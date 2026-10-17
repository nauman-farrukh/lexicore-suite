# SPEC 04: Desktop Hardware Printer Integration

## 1. Tauri Native Commands (Rust)

### `get_system_printers()`
- **Return Signature:**
```rust
pub struct PrinterInfo {
    pub name: String,
    pub is_default: bool,
    pub port_name: Option<String>,
    pub driver_name: Option<String>,
    pub is_network: bool,
}
```

### `get_default_printer()`
- **Return Signature:**
```rust
pub async fn get_default_printer() -> Result<Option<String>, String>
```

### `print_pdf_silent(pdf_base64: String, printer_name: Option<String>, paper_size: PaperSize)`
- **Behavior:**
  1. Decodes base64 payload into a temporary `.pdf` file in OS temp folder.
  2. Windows: Executes silent GDI printing via PowerShell `PrintTo` or bundled `PDFtoPrinter.exe`.
  3. macOS: Executes `lp -d <printer_name> <path_to_temp_file>`.
  4. Cleans up and deletes temporary PDF immediately after dispatch.
  5. Returns `Result<String, String>`.

### `print_pdf_dialog(pdf_base64: String)`
- **Return Signature:**
```rust
pub async fn print_pdf_dialog(pdf_base64: String) -> Result<String, String>
```

## 2. Frontend Abstraction Hook (usePrinter)
- **Runtime Environment Detection**:
  - Detects runtime environment via `window.__TAURI_INTERNALS__`.
- **Tauri Present Execution**:
  - Calls Tauri IPC `invoke('print_pdf_silent', { ... })`.
- **Web Browser Fallback Execution**:
  - Creates a hidden `iframe`, writes the PDF blob, and calls `iframe.contentWindow.print()`.

## 3. Cross-Platform Print Architecture & Spooling

### Windows GDI Rasterization Strategy
- Avoids raw unrendered byte writes that corrupt non-PostScript office printers (e.g. HP LaserJet PCL6, Brother, Canon).
- Leverages `PDFtoPrinter.exe`, `SumatraPDF.exe`, or Windows PowerShell GDI `PrintTo` verb fallback.
- Ensures paper size constraints (`Legal` 8.5×14" vs. `Letter` 8.5×11") are respected.

### macOS & Linux CUPS Strategy
- Spools print jobs via native `lp` CLI command with media geometry options (`-o media=legal`, `-o media=letter`).

### Ephemeral Storage & Security
- Temp files generated in OS-secured temporary directory (`std::env::temp_dir()`).
- Automated background cleanup immediately after spooling process dispatches.

## 4. Tauri v2 Capability Permissions
- Requires explicit capability authorization in `src-tauri/capabilities/default.json`:
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default-capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:default",
    "shell:allow-open",
    "shell:allow-execute"
  ]
}
```
