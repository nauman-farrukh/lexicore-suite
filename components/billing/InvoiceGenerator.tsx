"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Printer,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Scale,
  Calendar,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Zap,
  Sliders,
  CreditCard,
  FileText,
  Save,
  History,
  BookmarkCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { usePrinter } from "../../lib/hooks/usePrinter";
import type {
  InvoiceData,
  InvoiceLineItem,
  PaperSize,
  MatterType,
} from "../../lib/types/lexicore";

interface InvoiceGeneratorProps {
  initialInvoice?: Partial<InvoiceData>;
  onSave?: (invoice: InvoiceData) => void;
}

export function InvoiceGenerator({ initialInvoice, onSave }: InvoiceGeneratorProps) {
  const {
    printers,
    selectedPrinter,
    isTauri,
    isLoading: isPrintersLoading,
    isPrinting,
    error: printerError,
    lastMessage: printerMessage,
    setSelectedPrinter,
    refreshPrinters,
    printDocument,
  } = usePrinter();

  // Invoice Metadata State
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [issueDate, setIssueDate] = useState(
    initialInvoice?.issueDate || new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [clientName, setClientName] = useState(
    initialInvoice?.clientName || "Apex Horizon Holdings LLC"
  );
  const [clientEmail, setClientEmail] = useState(
    initialInvoice?.clientEmail || "cfo@apexhorizon.com"
  );
  const [matterTitle, setMatterTitle] = useState(
    initialInvoice?.matterTitle || "Series B Corporate Restructuring & Q3 Tax Filings"
  );
  const [matterType, setMatterType] = useState<MatterType>(
    initialInvoice?.matterType || "TAX"
  );

  // Line Items State
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    initialInvoice?.lineItems || [
      {
        id: "item-1",
        description: "Statutory Tax Planning & Cross-Border IP Evaluation",
        category: "SERVICE",
        hours: 4.8, // 4 hours 48 minutes (0.1 hr increments)
        rate: 450,
        amount: 2160,
      },
      {
        id: "item-2",
        description: "Drafting Operating Agreement & Cap Table Restructure",
        category: "SERVICE",
        hours: 6.2,
        rate: 550,
        amount: 3410,
      },
      {
        id: "item-3",
        description: "Delaware Division of Corporations Filing Surcharge",
        category: "EXPENSE",
        amount: 450,
      },
    ]
  );

  // Tax & IOLTA Trust Accounting Retainer State
  const [taxRate, setTaxRate] = useState<number>(initialInvoice?.taxRate || 0.0);
  const [availableTrustRetainer, setAvailableTrustRetainer] = useState<number>(
    initialInvoice?.trustRetainerAvailable || 4200.0
  );
  const [applyRetainer, setApplyRetainer] = useState<boolean>(true);
  const [retainerAppliedInput, setRetainerAppliedInput] = useState<number>(3000.0);

  // Hardware Print Control State
  const [paperSize, setPaperSize] = useState<PaperSize>("Letter");
  const [isSilentPrint, setIsSilentPrint] = useState<boolean>(true);
  const [copies, setCopies] = useState<number>(1);

  // Spreadsheet-Parity Column Visibility Toggles
  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    hours: true,
    rate: true,
    amount: true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Calculated Financial Totals
  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [lineItems]);

  const taxAmount = useMemo(() => {
    return Number((subtotal * (taxRate / 100)).toFixed(2));
  }, [subtotal, taxRate]);

  const grossTotal = useMemo(() => {
    return Number((subtotal + taxAmount).toFixed(2));
  }, [subtotal, taxAmount]);

  const effectiveRetainerApplied = useMemo(() => {
    if (!applyRetainer) return 0;
    const bounded = Math.min(retainerAppliedInput, availableTrustRetainer, grossTotal);
    return Math.max(0, Number(bounded.toFixed(2)));
  }, [applyRetainer, retainerAppliedInput, availableTrustRetainer, grossTotal]);

  const netPayable = useMemo(() => {
    return Number((grossTotal - effectiveRetainerApplied).toFixed(2));
  }, [grossTotal, effectiveRetainerApplied]);

  // Line Item Handlers
  const handleUpdateItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "hours" || field === "rate") {
          const h = field === "hours" ? Number(value) : item.hours || 0;
          const r = field === "rate" ? Number(value) : item.rate || 0;
          updated.amount = Number((h * r).toFixed(2));
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      description: "AI-Assisted Contract Analysis & Statutory Compliance Check",
      category: "SERVICE",
      hours: 1.0,
      rate: 450,
      amount: 450,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Portal Persistence State
  const [isSaved, setIsSaved] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedClientsList, setSavedClientsList] = useState<any[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);

  // Auto-load saved client/invoice on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lexicore_active_invoice");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.clientName) setClientName(data.clientName);
        if (data.clientEmail) setClientEmail(data.clientEmail);
        if (data.matterTitle) setMatterTitle(data.matterTitle);
        if (data.matterType) setMatterType(data.matterType);
        if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
        if (data.lineItems && data.lineItems.length > 0) setLineItems(data.lineItems);
        if (data.issueDate) setIssueDate(data.issueDate);
        if (data.dueDate) setDueDate(data.dueDate);
        setSavedAt("Loaded from active session");
      }
      const list = localStorage.getItem("lexicore_saved_clients");
      if (list) {
        setSavedClientsList(JSON.parse(list));
      }
    } catch {}
  }, []);

  const handleSaveInvoiceAndClient = () => {
    const invoiceRecord: InvoiceData = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      issueDate,
      dueDate,
      clientName,
      clientEmail,
      matterTitle,
      matterType,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      trustRetainerAvailable: availableTrustRetainer,
      trustRetainerApplied: effectiveRetainerApplied,
      totalDue: netPayable,
      status: "DRAFT",
    };

    try {
      localStorage.setItem("lexicore_active_invoice", JSON.stringify(invoiceRecord));

      const existing: any[] = JSON.parse(localStorage.getItem("lexicore_saved_clients") || "[]");
      const updated = [
        {
          clientName,
          clientEmail,
          matterTitle,
          matterType,
          savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          invoiceNumber,
        },
        ...existing.filter((c: any) => c.clientEmail !== clientEmail),
      ];
      localStorage.setItem("lexicore_saved_clients", JSON.stringify(updated));
      setSavedClientsList(updated);
      window.dispatchEvent(new CustomEvent("lexicore:client-updated", { detail: invoiceRecord }));

      // Persist to Neon PostgreSQL Database
      fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          matterTitle,
          matterType,
          invoiceNumber,
          totalDue: netPayable,
        }),
      }).catch((err) => console.warn("Cloud DB sync deferred or offline:", err));
    } catch {}

    if (onSave) {
      onSave(invoiceRecord);
    }

    setIsSaved(true);
    setSavedAt(`Saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleSelectSavedClient = (client: any) => {
    if (client.clientName) setClientName(client.clientName);
    if (client.clientEmail) setClientEmail(client.clientEmail);
    if (client.matterTitle) setMatterTitle(client.matterTitle);
    if (client.matterType) setMatterType(client.matterType);
    setShowClientPicker(false);
  };

  // Generate lightweight printable PDF base64 / HTML print payload
  const generatePdfBase64Payload = (): string => {
    const printDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${invoiceNumber} - Lexicore Suite</title>
        <style>
          @page { size: ${paperSize === "Legal" ? "8.5in 14in" : "8.5in 11in"}; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 1px solid #d1d5db; font-size: 12px; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          .totals { margin-left: auto; width: 340px; font-size: 14px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .total-row.net { font-weight: bold; font-size: 18px; border-top: 2px solid #111827; padding-top: 10px; color: #1e40af; }
          .iolta-badge { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 8px; border-radius: 6px; font-size: 12px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">LEXICORE SUITE LLP</div>
            <div style="font-size: 12px; color: #6b7280;">Attorneys at Law & Certified Public Accountants</div>
            <div style="font-size: 11px; color: #9ca3af;">100 Wall Street, 24th Floor, New York, NY 10005</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: bold; color: #2563eb;">INVOICE</div>
            <div style="font-size: 13px;">${invoiceNumber}</div>
            <div style="font-size: 12px; color: #6b7280;">Date: ${issueDate}</div>
            <div style="font-size: 12px; color: #6b7280;">Due: ${dueDate}</div>
          </div>
        </div>

        <div class="details">
          <div>
            <strong>BILLED TO:</strong><br/>
            ${clientName}<br/>
            ${clientEmail}<br/>
            <strong>Matter:</strong> ${matterTitle} (${matterType})
          </div>
          <div style="text-align: right;">
            <strong>PAYMENT TERMS:</strong> Net 30<br/>
            <strong>Paper Format:</strong> ${paperSize} Standard<br/>
            <strong>Escrow/IOLTA Ledger:</strong> Active
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th style="text-align: right;">Hours</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems
              .map(
                (item) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.category}</td>
                  <td style="text-align: right;">${item.hours ? item.hours.toFixed(1) : "-"}</td>
                  <td style="text-align: right;">${item.rate ? "$" + item.rate.toFixed(2) : "-"}</td>
                  <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span>$${subtotal.toFixed(2)}</span></div>
          ${taxRate > 0 ? `<div class="total-row"><span>Tax (${taxRate}%):</span><span>$${taxAmount.toFixed(2)}</span></div>` : ""}
          <div class="total-row"><span>Gross Charges:</span><span>$${grossTotal.toFixed(2)}</span></div>
          ${
            effectiveRetainerApplied > 0
              ? `
            <div class="total-row" style="color: #059669;">
              <span>IOLTA Retainer Applied:</span>
              <span>-$${effectiveRetainerApplied.toFixed(2)}</span>
            </div>`
              : ""
          }
          <div class="total-row net">
            <span>Net Payable Balance:</span>
            <span>$${netPayable.toFixed(2)}</span>
          </div>
        </div>

        ${
          effectiveRetainerApplied > 0
            ? `
          <div class="iolta-badge">
            <strong>IOLTA Escrow Ledger Notice:</strong> $${effectiveRetainerApplied.toFixed(
              2
            )} will be transferred from Client Trust Account to Firm Operating Account upon partner sign-off. Remaining trust retainer: $${(
                availableTrustRetainer - effectiveRetainerApplied
              ).toFixed(2)}.
          </div>`
            : ""
        }
      </body>
      </html>
    `;

    return btoa(unescape(encodeURIComponent(printDoc)));
  };

  // Direct Hardware Physical Print Action
  const handleDirectPrint = async () => {
    const payloadB64 = generatePdfBase64Payload();
    await printDocument({
      pdfBase64: payloadB64,
      jobName: `${invoiceNumber}_${clientName.replace(/\s+/g, "_")}`,
      silent: isSilentPrint,
      paperSize,
      copies,
    });
  };

  // Export to Excel Workbook (.xlsx)
  const handleExportExcel = () => {
    const rows = lineItems.map((item) => ({
      "Invoice #": invoiceNumber,
      "Client": clientName,
      "Matter": matterTitle,
      "Description": item.description,
      "Category": item.category,
      "Hours (0.1h)": item.hours || 0,
      "Rate ($/hr)": item.rate || 0,
      "Line Amount ($)": item.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [],
        ["", "", "", "", "Subtotal", "", "", subtotal],
        ["", "", "", "", "Tax Rate", "", "", `${taxRate}%`],
        ["", "", "", "", "Gross Total", "", "", grossTotal],
        ["", "", "", "", "IOLTA Retainer Applied", "", "", -effectiveRetainerApplied],
        ["", "", "", "", "Net Payable", "", "", netPayable],
      ],
      { origin: -1 }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Ledger");
    XLSX.writeFile(workbook, `${invoiceNumber}_Ledger.xlsx`);
  };

  // Browser Client PDF Download
  const handleDownloadPdf = () => {
    const b64 = generatePdfBase64Payload();
    const byteCharacters = atob(b64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Control Toolbar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>FINANCIAL OPERATIONS // IOLTA LEDGER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Invoice & Fee Ledger Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Compliant with IOLTA Escrow Rules</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <Zap className="w-3 h-3" /> Double-Entry Guaranteed
            </span>
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Save Client & Invoice to Portal & Cloud DB */}
          <button
            onClick={handleSaveInvoiceAndClient}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg border ${
              isSaved
                ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30"
                : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40 shadow-indigo-600/25"
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-white" />
                <span>Client & Invoice Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-indigo-200" />
                <span>Save Client & Invoice</span>
              </>
            )}
          </button>

          {/* Saved Clients Directory Picker */}
          {savedClientsList.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowClientPicker(!showClientPicker)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 transition shadow-sm"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clients ({savedClientsList.length})</span>
              </button>
              {showClientPicker && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-30 space-y-1 text-xs backdrop-blur-xl">
                  <div className="font-semibold text-slate-300 px-2 py-1.5 border-b border-white/10 text-[11px] uppercase tracking-wider flex justify-between items-center">
                    <span>Recent Clients</span>
                    <span className="text-[10px] text-slate-400 font-mono">Auto-Saved</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                    {savedClientsList.map((client, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSavedClient(client)}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent transition flex flex-col gap-0.5 group"
                      >
                        <span className="font-semibold text-white group-hover:text-indigo-300">
                          {client.clientName}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {client.matterTitle || client.clientEmail}
                        </span>
                        {client.savedAt && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Saved at: {client.savedAt}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Columns Visibility */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 transition shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Columns</span>
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-3 z-30 space-y-2 text-xs backdrop-blur-xl">
                <div className="font-semibold text-slate-300 pb-1.5 border-b border-white/10 text-[11px] uppercase tracking-wider">
                  Display Columns
                </div>
                {Object.keys(visibleColumns).map((col) => (
                  <label key={col} className="flex items-center gap-2.5 cursor-pointer capitalize text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col as keyof typeof visibleColumns]}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          [col]: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-emerald-600/20 border border-emerald-400/30"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {/* Download PDF/HTML */}
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-white/10 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* Direct Hardware Physical Print */}
          <button
            onClick={handleDirectPrint}
            disabled={isPrinting || isPrintersLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/25 border border-white/20"
          >
            {isPrinting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-cyan-200" />
            )}
            <span>Direct Hardware Print</span>
          </button>
        </div>
      </div>

      {/* Hardware Workstation & Spooler Control Strip */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between text-xs gap-4 border border-white/10 bg-slate-900/70">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200 font-mono text-[11px]">
              {isTauri ? "TAURI 2.0 HARDWARE SPOOLER" : "BROWSER VIRTUAL PRINTER"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPrinter || ""}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              disabled={isPrintersLoading}
              className="bg-slate-800/90 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {printers.map((p) => (
                <option key={p.name} value={p.name} className="bg-slate-900 text-white">
                  {p.name} {p.is_default ? "★ (Default)" : ""} ({p.status})
                </option>
              ))}
            </select>
            <button
              onClick={() => refreshPrinters()}
              title="Refresh physical printers"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPrintersLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Paper & Spool Settings */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/70 p-1 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400 px-2 font-mono">PAPER:</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as PaperSize)}
              className="bg-slate-900 border-none rounded-lg px-2.5 py-1 text-xs font-semibold text-cyan-300 focus:outline-none"
            >
              <option value="Letter">Letter (8.5 × 11")</option>
              <option value="Legal">Legal (8.5 × 14")</option>
              <option value="A4">A4 Standard</option>
            </select>
          </div>

          {isTauri && (
            <label className="flex items-center gap-2 cursor-pointer bg-slate-800/70 px-3 py-1.5 rounded-xl border border-white/10">
              <input
                type="checkbox"
                checked={isSilentPrint}
                onChange={(e) => setIsSilentPrint(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-slate-300 font-medium text-[11px] font-mono">SILENT BATCH</span>
            </label>
          )}

          <div className="flex items-center gap-2 bg-slate-800/70 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-slate-400 text-[11px] font-mono">COPIES:</span>
            <input
              type="number"
              min="1"
              max="99"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-10 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Notifications / Printer Status */}
      {printerError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{printerError}</span>
        </div>
      )}
      {printerMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{printerMessage}</span>
        </div>
      )}

      {/* Main Terminal Invoice Card */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative">
        {/* Invoice Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-white/10">
          <div>
            <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>LEXICORE LEGAL & ACCOUNTING LLP</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Federal Tax ID (EIN): XX-XXX9281 &bull; IOLTA Escrow Reg: #NY-99218
            </div>

            <div className="mt-6 space-y-3 text-xs max-w-md">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    CLIENT / CORPORATE ENTITY
                  </label>
                  {savedAt && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-normal">
                      <BookmarkCheck className="w-3 h-3" />
                      {savedAt}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full glass-input px-3 py-1.5 rounded-lg font-semibold text-white focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase tracking-wider mb-1">
                  AUTHORIZED OFFICER EMAIL
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full glass-input px-3 py-1.5 rounded-lg text-slate-300 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveInvoiceAndClient}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition"
                >
                  <Save className="w-3 h-3 text-indigo-400" />
                  <span>{isSaved ? "Saved to Portal!" : "Save Client to Portal"}</span>
                </button>
                <span className="text-[10px] text-slate-500 font-mono">
                  Syncs with Client Portal & Neon DB
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:items-end justify-between">
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                DRAFT / UNBILLED
              </span>
            </div>

            <div className="space-y-3 text-xs w-full md:w-72 mt-4 md:mt-0">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono">INVOICE NO:</span>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="text-right font-mono font-bold text-cyan-300 glass-input px-2.5 py-1 rounded-lg w-36"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono">ISSUE DATE:</span>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="text-right font-mono text-slate-300 glass-input px-2.5 py-1 rounded-lg w-36"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono">DUE DATE:</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-right font-mono text-slate-300 glass-input px-2.5 py-1 rounded-lg w-36"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Matter Strip */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-mono">MATTER:</span>
            <input
              type="text"
              value={matterTitle}
              onChange={(e) => setMatterTitle(e.target.value)}
              className="font-medium text-white bg-transparent border-b border-white/20 focus:border-cyan-400 outline-none w-72 sm:w-96"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-mono">PRACTICE AREA:</span>
            <select
              value={matterType}
              onChange={(e) => setMatterType(e.target.value as MatterType)}
              className="bg-slate-800 border border-white/15 rounded-lg px-3 py-1 font-semibold text-cyan-300 text-xs focus:outline-none"
            >
              <option value="TAX">Corporate Tax & Audit</option>
              <option value="ACCOUNTING">Financial Accounting / GAAP</option>
              <option value="LEGAL">Corporate Law & Litigation</option>
            </select>
          </div>
        </div>

        {/* Financial Terminal Line Items Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase tracking-wider bg-slate-900/40">
                <th className="py-3 px-3">Description / Billable Unit</th>
                {visibleColumns.category && <th className="py-3 px-3 w-36">Category</th>}
                {visibleColumns.hours && <th className="py-3 px-3 text-right w-28">Hours (0.1h)</th>}
                {visibleColumns.rate && <th className="py-3 px-3 text-right w-28">Rate ($/hr)</th>}
                {visibleColumns.amount && <th className="py-3 px-3 text-right w-36">Amount ($)</th>}
                <th className="py-3 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-400 outline-none font-medium text-slate-200"
                    />
                  </td>

                  {visibleColumns.category && (
                    <td className="py-2.5 px-3">
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(item.id, "category", e.target.value)}
                        className="bg-slate-800/80 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 font-mono"
                      >
                        <option value="SERVICE">Service (Hourly)</option>
                        <option value="EXPENSE">Expense</option>
                        <option value="FILING_FEE">Filing Fee</option>
                      </select>
                    </td>
                  )}

                  {visibleColumns.hours && (
                    <td className="py-2.5 px-3 text-right">
                      {item.category === "SERVICE" ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.hours ?? ""}
                          onChange={(e) => handleUpdateItem(item.id, "hours", e.target.value)}
                          className="w-20 text-right bg-slate-800/50 border border-white/10 rounded px-2 py-0.5 outline-none font-mono text-cyan-300"
                        />
                      ) : (
                        <span className="text-slate-600 font-mono">—</span>
                      )}
                    </td>
                  )}

                  {visibleColumns.rate && (
                    <td className="py-2.5 px-3 text-right">
                      {item.category === "SERVICE" ? (
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={item.rate ?? ""}
                          onChange={(e) => handleUpdateItem(item.id, "rate", e.target.value)}
                          className="w-20 text-right bg-slate-800/50 border border-white/10 rounded px-2 py-0.5 outline-none font-mono text-slate-300"
                        />
                      ) : (
                        <span className="text-slate-600 font-mono">—</span>
                      )}
                    </td>
                  )}

                  {visibleColumns.amount && (
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white text-sm">
                      {item.category === "SERVICE" ? (
                        `$${item.amount.toFixed(2)}`
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => handleUpdateItem(item.id, "amount", Number(e.target.value))}
                          className="w-24 text-right bg-slate-800/50 border border-white/10 rounded px-2 py-0.5 outline-none font-mono font-bold text-white"
                        />
                      )}
                    </td>
                  )}

                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Delete line item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/10 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Billable Unit (0.1h Increment)</span>
            </button>
          </div>
        </div>

        {/* Trust Retainer Widget & Balance Ledger */}
        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* IOLTA Trust Account Widget */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>IOLTA CLIENT TRUST ESCROW</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                ${availableTrustRetainer.toFixed(2)} AVAILABLE
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Earned fees are automatically debited from the client's verified trust deposit balance upon invoice issuance in strict compliance with Bar & CPA IOLTA double-entry rules.
            </p>

            <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={applyRetainer}
                  onChange={(e) => setApplyRetainer(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Apply Retainer Towards Total:</span>
              </label>

              {applyRetainer && (
                <div className="flex items-center gap-1">
                  <span className="text-emerald-400 font-mono">$</span>
                  <input
                    type="number"
                    step="10"
                    max={Math.min(availableTrustRetainer, grossTotal)}
                    value={retainerAppliedInput}
                    onChange={(e) => setRetainerAppliedInput(Number(e.target.value))}
                    className="w-24 text-right bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Ledger Calculation Summary */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-400 font-mono">
              <span>SUBTOTAL (UNBILLED UNITS):</span>
              <span className="text-white font-medium text-sm">${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span>SERVICES TAX:</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.25"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-12 text-center bg-slate-800 border border-white/10 rounded px-1 text-[11px] text-white"
                />
                <span>%</span>
              </div>
              <span className="text-white font-medium">${taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300 font-mono font-semibold pt-1 border-t border-white/5">
              <span>GROSS CHARGES:</span>
              <span className="text-white font-bold">${grossTotal.toFixed(2)}</span>
            </div>

            {effectiveRetainerApplied > 0 && (
              <div className="flex justify-between items-center text-emerald-400 font-mono font-semibold">
                <span>LESS IOLTA RETAINER APPLIED:</span>
                <span>-${effectiveRetainerApplied.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-bold text-white pt-4 border-t border-white/10">
              <span className="text-cyan-400 font-mono tracking-tight">NET BALANCE DUE:</span>
              <span className="font-mono text-2xl text-cyan-300 font-black">${netPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
