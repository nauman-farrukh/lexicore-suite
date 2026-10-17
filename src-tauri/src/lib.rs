pub mod printer;

use printer::{get_default_printer, get_system_printers, print_pdf_dialog, print_pdf_silent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_system_printers,
            get_default_printer,
            print_pdf_silent,
            print_pdf_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running Lexicore Suite desktop application");
}
