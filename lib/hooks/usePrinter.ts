"use client";

import { useState, useEffect, useCallback } from "react";
import type { PrinterInfo, PrintPdfOptions, PaperSize } from "../types/lexicore";

interface UsePrinterReturn {
  printers: PrinterInfo[];
  selectedPrinter: string | null;
  defaultPrinter: string | null;
  isTauri: boolean;
  isLoading: boolean;
  isPrinting: boolean;
  error: string | null;
  lastMessage: string | null;
  setSelectedPrinter: (printerName: string) => void;
  refreshPrinters: () => Promise<void>;
  printDocument: (options: {
    pdfBase64: string;
    jobName?: string;
    silent?: boolean;
    paperSize?: PaperSize;
    copies?: number;
  }) => Promise<boolean>;
}

const STORAGE_KEY_DEFAULT_PRINTER = "lexicore_preferred_printer";

export function usePrinter(): UsePrinterReturn {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinterState] = useState<string | null>(null);
  const [defaultPrinter, setDefaultPrinterState] = useState<string | null>(null);
  const [isTauri, setIsTauri] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  // Helper to dynamically invoke Tauri v2 IPC if available
  const getTauriInvoke = useCallback(async () => {
    if (typeof window === "undefined") return null;
    const isTauriEnv =
      "__TAURI_INTERNALS__" in window ||
      "__TAURI__" in window ||
      Boolean((window as unknown as { isTauri?: boolean }).isTauri);

    if (!isTauriEnv) return null;

    try {
      // Dynamic import to prevent bundler errors when compiling for web-only environments
      const tauriApi = await import("@tauri-apps/api/core");
      return tauriApi.invoke;
    } catch {
      return null;
    }
  }, []);

  // Set and persist selected workstation printer
  const setSelectedPrinter = useCallback((printerName: string) => {
    setSelectedPrinterState(printerName);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_DEFAULT_PRINTER, printerName);
      } catch {
        // Ignore localStorage quota/disabled exceptions
      }
    }
  }, []);

  // Query hardware printers from either Tauri runtime or populate browser virtual targets
  const refreshPrinters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const invoke = await getTauriInvoke();

    if (invoke) {
      setIsTauri(true);
      try {
        const discoveredPrinters = await invoke<PrinterInfo[]>("get_system_printers");
        const sysDefault = await invoke<string | null>("get_default_printer");

        setPrinters(discoveredPrinters);
        setDefaultPrinterState(sysDefault);

        // Restore persisted user choice, or fallback to system default
        const savedChoice = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_DEFAULT_PRINTER) : null;
        if (savedChoice && discoveredPrinters.some((p) => p.name === savedChoice)) {
          setSelectedPrinterState(savedChoice);
        } else if (sysDefault) {
          setSelectedPrinterState(sysDefault);
        } else if (discoveredPrinters.length > 0) {
          setSelectedPrinterState(discoveredPrinters[0].name);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Failed to enumerate desktop printers: ${msg}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Running inside standard web browser: populate client virtual driver fallback
      setIsTauri(false);
      const webPrinters: PrinterInfo[] = [
        {
          name: "Browser Print Dialog (System Default)",
          is_default: true,
          status: "Ready",
          port_name: "WEB_PRINT_IFRAME",
          driver_name: "Web Browser Print Manager",
          is_network: false,
        },
        {
          name: "PDF Virtual Export (Save as PDF)",
          is_default: false,
          status: "Ready",
          port_name: "VIRTUAL_PDF",
          driver_name: "Browser PDF Engine",
          is_network: false,
        },
      ];
      setPrinters(webPrinters);
      setSelectedPrinterState(webPrinters[0].name);
      setDefaultPrinterState(webPrinters[0].name);
      setIsLoading(false);
    }
  }, [getTauriInvoke]);

  useEffect(() => {
    refreshPrinters();
  }, [refreshPrinters]);

  // Execute print job via desktop hardware driver or web fallback
  const printDocument = useCallback(
    async (options: {
      pdfBase64: string;
      jobName?: string;
      silent?: boolean;
      paperSize?: PaperSize;
      copies?: number;
    }): Promise<boolean> => {
      setIsPrinting(true);
      setError(null);
      setLastMessage(null);

      try {
        const invoke = await getTauriInvoke();

        if (invoke && isTauri) {
          // Native Tauri Desktop Shell: Dispatch to Rust backend
          if (options.silent) {
            const payload: PrintPdfOptions = {
              pdf_base64: options.pdfBase64,
              printer_name: selectedPrinter,
              job_name: options.jobName || "Lexicore_Invoice",
              paper_size: options.paperSize || "Letter",
              copies: options.copies || 1,
            };

            const result = await invoke<string>("print_pdf_silent", { options: payload });
            setLastMessage(result);
            return true;
          } else {
            // Interactive OS Dialog
            const result = await invoke<string>("print_pdf_dialog", {
              pdfBase64: options.pdfBase64,
            });
            setLastMessage(result);
            return true;
          }
        } else {
          // Web Client Fallback: Render PDF via hidden off-screen iframe
          const cleanB64 = options.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
          const byteCharacters = atob(cleanB64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(blob);

          const iframe = document.createElement("iframe");
          iframe.style.position = "fixed";
          iframe.style.right = "0";
          iframe.style.bottom = "0";
          iframe.style.width = "0";
          iframe.style.height = "0";
          iframe.style.border = "0";
          iframe.src = blobUrl;

          document.body.appendChild(iframe);

          await new Promise<void>((resolve, reject) => {
            iframe.onload = () => {
              try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                setLastMessage("Browser print dialog dispatched successfully");
                resolve();
              } catch (e) {
                reject(e);
              }
            };
            iframe.onerror = () => reject(new Error("Failed to load PDF in browser print frame"));
            // Fallback timeout
            setTimeout(() => resolve(), 3000);
          });

          // Cleanup frame after dialog dispatch
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          }, 60000);

          return true;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Print execution failed: ${msg}`);
        return false;
      } finally {
        setIsPrinting(false);
      }
    },
    [getTauriInvoke, isTauri, selectedPrinter]
  );

  return {
    printers,
    selectedPrinter,
    defaultPrinter,
    isTauri,
    isLoading,
    isPrinting,
    error,
    lastMessage,
    setSelectedPrinter,
    refreshPrinters,
    printDocument,
  };
}
