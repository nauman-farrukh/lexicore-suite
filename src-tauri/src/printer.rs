use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterInfo {
    pub name: String,
    pub is_default: bool,
    pub status: String,
    pub port_name: Option<String>,
    pub driver_name: Option<String>,
    pub is_network: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintPdfOptions {
    pub pdf_base64: String,
    pub printer_name: Option<String>,
    pub job_name: Option<String>,
    pub paper_size: Option<String>, // "Letter" | "Legal" | "A4"
    pub copies: Option<u32>,
    pub duplex: Option<String>,     // "Simplex" | "DuplexNoTumble" | "DuplexTumble"
}

/// Enumerate all local and networked physical/virtual printers available to the OS
#[tauri::command]
pub async fn get_system_printers() -> Result<Vec<PrinterInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        // Enumerate via PowerShell CIM instance to guarantee accurate attributes on modern Windows 10/11/Server
        let ps_cmd = r#"
            Get-CimInstance Win32_Printer | Select-Object Name, Default, PrinterStatus, PortName, DriverName, Network | ConvertTo-Json -Compress
        "#;

        let output = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", ps_cmd])
            .output()
            .map_err(|e| format!("Failed to query Windows printers: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Windows printer query error: {}", stderr));
        }

        let json_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if json_str.is_empty() || json_str == "null" {
            return Ok(vec![]);
        }

        #[derive(Deserialize)]
        struct WinPrinterRaw {
            #[serde(rename = "Name")]
            name: Option<String>,
            #[serde(rename = "Default")]
            default: Option<bool>,
            #[serde(rename = "PrinterStatus")]
            printer_status: Option<u32>,
            #[serde(rename = "PortName")]
            port_name: Option<String>,
            #[serde(rename = "DriverName")]
            driver_name: Option<String>,
            #[serde(rename = "Network")]
            network: Option<bool>,
        }

        // Handle both single object and array output from PowerShell JSON serialization
        let raw_list: Vec<WinPrinterRaw> = if json_str.starts_with('[') {
            serde_json::from_str(&json_str).unwrap_or_default()
        } else {
            serde_json::from_str::<WinPrinterRaw>(&json_str)
                .map(|item| vec![item])
                .unwrap_or_default()
        };

        let printers: Vec<PrinterInfo> = raw_list
            .into_iter()
            .filter_map(|p| {
                let name = p.name?;
                let status = match p.printer_status.unwrap_or(3) {
                    3 => "Ready",
                    4 => "Printing",
                    5 => "Warmup",
                    1 => "Other",
                    2 => "Unknown",
                    7 => "Offline",
                    _ => "Idle",
                }
                .to_string();

                Some(PrinterInfo {
                    name,
                    is_default: p.default.unwrap_or(false),
                    status,
                    port_name: p.port_name,
                    driver_name: p.driver_name,
                    is_network: p.network.unwrap_or(false),
                })
            })
            .collect();

        Ok(printers)
    }

    #[cfg(target_os = "macos")]
    {
        // Enumerate via CUPS lpstat on macOS
        let output = Command::new("lpstat")
            .args(["-p", "-d"])
            .output()
            .map_err(|e| format!("Failed to query CUPS printers: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut default_printer = String::new();
        for line in stdout.lines() {
            if line.starts_with("system default destination: ") {
                default_printer = line.replace("system default destination: ", "").trim().to_string();
            }
        }

        let mut printers = Vec::new();
        for line in stdout.lines() {
            if line.starts_with("printer ") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let name = parts[1].to_string();
                    let is_default = name == default_printer;
                    let status = if line.contains("is idle") {
                        "Ready".to_string()
                    } else if line.contains("printing") {
                        "Printing".to_string()
                    } else {
                        "Online".to_string()
                    };

                    printers.push(PrinterInfo {
                        name,
                        is_default,
                        status,
                        port_name: None,
                        driver_name: None,
                        is_network: true,
                    });
                }
            }
        }
        Ok(printers)
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        // Generic Linux / Unix CUPS fallback
        let output = Command::new("lpstat")
            .args(["-e"])
            .output()
            .map_err(|e| format!("Failed to query CUPS printers on Linux: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let printers: Vec<PrinterInfo> = stdout
            .lines()
            .filter(|l| !l.trim().is_empty())
            .map(|l| PrinterInfo {
                name: l.trim().to_string(),
                is_default: false,
                status: "Ready".to_string(),
                port_name: None,
                driver_name: None,
                is_network: true,
            })
            .collect();
        Ok(printers)
    }
}

/// Retrieve the current system default printer name
#[tauri::command]
pub async fn get_default_printer() -> Result<Option<String>, String> {
    let printers = get_system_printers().await?;
    let default = printers.into_iter().find(|p| p.is_default).map(|p| p.name);
    Ok(default)
}

/// Robust, cross-platform silent physical print execution.
/// Avoids sending raw unrendered PDF byte streams directly to non-PostScript PCL office printers,
/// preventing corruption and blank/raw-code print jobs.
#[tauri::command]
pub async fn print_pdf_silent(
    options: PrintPdfOptions,
) -> Result<String, String> {
    // 1. Decode base64 payload
    let clean_b64 = options
        .pdf_base64
        .trim_start_matches("data:application/pdf;base64,");

    let pdf_bytes = BASE64
        .decode(clean_b64)
        .map_err(|e| format!("Invalid Base64 PDF stream: {}", e))?;

    if pdf_bytes.is_empty() {
        return Err("PDF byte stream is empty".into());
    }

    // 2. Persist to temporary workspace file
    let temp_dir = std::env::temp_dir();
    let job_id = uuid::Uuid::new_v4();
    let temp_file_path = temp_dir.join(format!("lexicore_print_{}.pdf", job_id));

    {
        let mut file = File::create(&temp_file_path)
            .map_err(|e| format!("Failed to create temporary print file: {}", e))?;
        file.write_all(&pdf_bytes)
            .map_err(|e| format!("Failed to write print data: {}", e))?;
    }

    let file_path_str = temp_file_path
        .to_str()
        .ok_or_else(|| "Invalid temporary file path".to_string())?
        .to_string();

    // 3. Platform-specific rasterized / GDI spooler dispatch
    #[cfg(target_os = "windows")]
    {
        let target_printer = options.printer_name.clone();

        // Priority 1: Check if PDFtoPrinter.exe is packaged or accessible on PATH
        let pdf_to_printer_res = Command::new("PDFtoPrinter.exe")
            .arg(&file_path_str)
            .args(target_printer.as_ref().map(|p| vec![p.as_str()]).unwrap_or_default())
            .output();

        let printed_successfully = match pdf_to_printer_res {
            Ok(out) if out.status.success() => true,
            _ => false,
        };

        // Priority 2: Fallback to SumatraPDF if installed
        let printed_successfully = if !printed_successfully {
            let mut sumatra_cmd = Command::new("SumatraPDF.exe");
            sumatra_cmd.arg("-print-to");
            if let Some(ref p) = target_printer {
                sumatra_cmd.arg(p);
            } else {
                sumatra_cmd.arg("default");
            }
            sumatra_cmd.arg("-silent").arg(&file_path_str);

            match sumatra_cmd.output() {
                Ok(out) if out.status.success() => true,
                _ => false,
            }
        } else {
            true
        };

        // Priority 3: Native Windows PowerShell GDI PrintTo dispatch (always present on Win 10/11)
        if !printed_successfully {
            let ps_script = if let Some(printer) = target_printer {
                format!(
                    r#"Start-Process -FilePath "{}" -Verb PrintTo -ArgumentList '"{}"' -PassThru | ForEach-Object {{ Start-Sleep -Milliseconds 1200; Stop-Process -Id $_.Id -ErrorAction SilentlyContinue }}"#,
                    file_path_str.replace('"', "`\""),
                    printer.replace('"', "`\"")
                )
            } else {
                format!(
                    r#"Start-Process -FilePath "{}" -Verb Print -PassThru | ForEach-Object {{ Start-Sleep -Milliseconds 1200; Stop-Process -Id $_.Id -ErrorAction SilentlyContinue }}"#,
                    file_path_str.replace('"', "`\"")
                )
            };

            let win_output = Command::new("powershell")
                .args(["-NoProfile", "-NonInteractive", "-Command", &ps_script])
                .output()
                .map_err(|e| format!("Windows print dispatch failed: {}", e))?;

            if !win_output.status.success() {
                let err_msg = String::from_utf8_lossy(&win_output.stderr);
                let _ = std::fs::remove_file(&temp_file_path);
                return Err(format!("Windows GDI printing failed: {}", err_msg));
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        let mut cmd = Command::new("lp");
        if let Some(ref name) = options.printer_name {
            cmd.arg("-d").arg(name);
        }

        // Apply paper size option if requested (e.g. Legal 8.5x14 for legal filings)
        if let Some(ref size) = options.paper_size {
            cmd.arg("-o").arg(format!("media={}", size));
        }

        if let Some(copies) = options.copies {
            cmd.arg("-n").arg(copies.to_string());
        }

        if let Some(ref duplex) = options.duplex {
            cmd.arg("-o").arg(format!("sides={}", duplex));
        }

        cmd.arg(&file_path_str);

        let output = cmd
            .output()
            .map_err(|e| format!("CUPS dispatch error: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let _ = std::fs::remove_file(&temp_file_path);
            return Err(format!("CUPS print error: {}", stderr));
        }
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        let mut cmd = Command::new("lp");
        if let Some(ref name) = options.printer_name {
            cmd.arg("-d").arg(name);
        }
        cmd.arg(&file_path_str);

        let output = cmd
            .output()
            .map_err(|e| format!("Linux CUPS dispatch error: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let _ = std::fs::remove_file(&temp_file_path);
            return Err(format!("Linux CUPS print error: {}", stderr));
        }
    }

    // 4. Deferred cleanup of temporary artifact after spooler release
    let cleanup_path = temp_file_path.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(5));
        let _ = std::fs::remove_file(cleanup_path);
    });

    let target_display = options
        .printer_name
        .unwrap_or_else(|| "Default Workstation Printer".to_string());

    Ok(format!(
        "Print job successfully queued to '{}' [Job ID: {}]",
        target_display, job_id
    ))
}

/// Interactive print dialog: opens the generated PDF using the operating system's
/// default document viewer so the user can interactively select paper trays, duplex, or color modes.
#[tauri::command]
pub async fn print_pdf_dialog(pdf_base64: String) -> Result<String, String> {
    let clean_b64 = pdf_base64.trim_start_matches("data:application/pdf;base64,");
    let pdf_bytes = BASE64
        .decode(clean_b64)
        .map_err(|e| format!("Invalid Base64 PDF: {}", e))?;

    let temp_dir = std::env::temp_dir();
    let temp_file_path = temp_dir.join(format!("lexicore_interactive_{}.pdf", uuid::Uuid::new_v4()));

    {
        let mut file = File::create(&temp_file_path)
            .map_err(|e| format!("Failed to create temporary PDF: {}", e))?;
        file.write_all(&pdf_bytes)
            .map_err(|e| format!("Failed to write temporary PDF: {}", e))?;
    }

    let path_str = temp_file_path
        .to_str()
        .ok_or_else(|| "Invalid temporary file path".to_string())?
        .to_string();

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path_str])
            .spawn()
            .map_err(|e| format!("Failed to open print viewer on Windows: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open print preview on macOS: {}", e))?;
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open print preview on Linux: {}", e))?;
    }

    Ok("Document viewer opened for interactive printing".into())
}
