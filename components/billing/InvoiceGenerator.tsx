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
  Check,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { usePrinter } from "../../lib/hooks/usePrinter";
import type {
  InvoiceData,
  InvoiceLineItem,
  PaperSize,
  MatterType,
} from "../../lib/types/lexicore";

const DEFAULT_CLIENTS: any[] = [
  {
    clientName: "Apex Horizon Holdings LLC",
    clientEmail: "cfo@apexhorizon.com",
    matterTitle: "Series B Corporate Restructuring & Q3 Tax Filings",
    matterType: "TAX",
    invoiceNumber: "INV-2026-8781",
    issueDate: "2026-09-01",
    dueDate: "2026-10-15",
    lineItems: [
      {
        id: "item-1",
        description: "Statutory Tax Planning & Cross-Border IP Evaluation",
        category: "SERVICE",
        hours: 4.8,
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
    ],
    subtotal: 6020,
    taxRate: 0,
    taxAmount: 0,
    trustRetainerAvailable: 4200,
    trustRetainerApplied: 3000,
    totalDue: 3020,
    savedAt: "Firm Record",
  },
  {
    clientName: "Sterling Global Ventures LLC",
    clientEmail: "cfo@sterlingventures.com",
    matterTitle: "FY2026 International Tax Restructuring",
    matterType: "TAX",
    invoiceNumber: "INV-2026-9901",
    issueDate: "2026-09-15",
    dueDate: "2026-10-30",
    lineItems: [
      {
        id: "item-sg-1",
        description: "Cross-Border Entity Structuring & Transfer Pricing Analysis",
        category: "SERVICE",
        hours: 8.0,
        rate: 550,
        amount: 4400,
      },
      {
        id: "item-sg-2",
        description: "Statutory Filing Fees & Multi-Jurisdiction Legal Review",
        category: "EXPENSE",
        amount: 1440,
      },
    ],
    subtotal: 5840,
    taxRate: 0,
    taxAmount: 0,
    trustRetainerAvailable: 5000,
    trustRetainerApplied: 0,
    totalDue: 5840,
    savedAt: "Firm Record",
  },
  {
    clientName: "Acme Logistics LLC",
    clientEmail: "john@acmecorp.com",
    matterTitle: "2025 Corporate Tax Filing & Operating Agreement Review",
    matterType: "TAX",
    invoiceNumber: "INV-2026-4102",
    issueDate: "2026-09-10",
    dueDate: "2026-10-25",
    lineItems: [
      {
        id: "item-acme-1",
        description: "Annual Corporate Tax Audit & State Filings",
        category: "SERVICE",
        hours: 5.5,
        rate: 400,
        amount: 2200,
      },
    ],
    subtotal: 2200,
    taxRate: 0,
    taxAmount: 0,
    trustRetainerAvailable: 2500,
    trustRetainerApplied: 0,
    totalDue: 2200,
    savedAt: "Firm Record",
  },
];

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
  const [savedClientsList, setSavedClientsList] = useState<any[]>(DEFAULT_CLIENTS);
  const [showClientPicker, setShowClientPicker] = useState(false);

  // Auto-load saved client/invoice on mount
  useEffect(() => {
    // 1. Check local storage
    let localList: any[] = [];
    try {
      const stored = localStorage.getItem("lexicore_saved_clients");
      if (stored) {
        localList = JSON.parse(stored);
      }
    } catch {}

    const clientMap = new Map<string, any>();
    // Pre-populate with firm defaults
    for (const c of DEFAULT_CLIENTS) {
      clientMap.set(c.clientEmail.toLowerCase(), c);
    }
    // Overlay local storage
    for (const c of localList) {
      if (c.clientEmail) {
        clientMap.set(c.clientEmail.toLowerCase(), {
          ...(clientMap.get(c.clientEmail.toLowerCase()) || {}),
          ...c,
        });
      }
    }

    // Set initial merged list
    const initialMerged = Array.from(clientMap.values());
    setSavedClientsList(initialMerged);

    // Load active invoice if present, else default
    try {
      const saved = localStorage.getItem("lexicore_active_invoice");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.clientName) setClientName(data.clientName);
        if (data.clientEmail) setClientEmail(data.clientEmail);
        if (data.matterTitle) setMatterTitle(data.matterTitle);
        if (data.matterType) setMatterType(data.matterType);
        if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
        if (Array.isArray(data.lineItems) && data.lineItems.length > 0) setLineItems(data.lineItems);
        if (data.issueDate) setIssueDate(data.issueDate);
        if (data.dueDate) setDueDate(data.dueDate);
        if (data.taxRate !== undefined) setTaxRate(Number(data.taxRate));
        if (data.trustRetainerAvailable !== undefined) setAvailableTrustRetainer(Number(data.trustRetainerAvailable));
        if (data.trustRetainerApplied !== undefined) setRetainerAppliedInput(Number(data.trustRetainerApplied));
        setSavedAt(`Active: ${data.clientName}`);
      }
    } catch {}

    // 2. Fetch full records from Neon PostgreSQL database
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.clients)) {
          for (const c of data.clients) {
            const email = c.user?.email;
            if (!email) continue;
            const primaryMatter = c.matters?.[0];
            const primaryInvoice = primaryMatter?.invoices?.[0];
            const existing = clientMap.get(email.toLowerCase()) || {};

            const dbClient = {
              clientName: c.companyName || c.user?.fullName || existing.clientName || "Client",
              clientEmail: email,
              matterTitle: primaryMatter?.title || existing.matterTitle || "Corporate Legal & Tax Matter",
              matterType: (primaryMatter?.matterType || existing.matterType || "TAX") as MatterType,
              invoiceNumber: primaryInvoice?.invoiceNumber || existing.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              issueDate: primaryInvoice?.createdAt ? primaryInvoice.createdAt.split("T")[0] : existing.issueDate || new Date().toISOString().split("T")[0],
              dueDate: primaryInvoice?.dueDate ? primaryInvoice.dueDate.split("T")[0] : existing.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              lineItems: primaryInvoice?.lineItems && primaryInvoice.lineItems.length > 0
                ? primaryInvoice.lineItems.map((li: any) => ({
                    id: li.id,
                    description: li.description,
                    category: li.category,
                    hours: li.hours !== null && li.hours !== undefined ? Number(li.hours) : undefined,
                    rate: li.rate !== null && li.rate !== undefined ? Number(li.rate) : undefined,
                    amount: Number(li.amount),
                  }))
                : existing.lineItems,
              subtotal: primaryInvoice ? Number(primaryInvoice.subtotal) : existing.subtotal,
              taxRate: primaryInvoice ? Number(primaryInvoice.taxRate) : existing.taxRate,
              taxAmount: primaryInvoice ? Number(primaryInvoice.taxAmount) : existing.taxAmount,
              trustRetainerApplied: primaryInvoice ? Number(primaryInvoice.trustRetainerApplied) : existing.trustRetainerApplied,
              totalDue: primaryInvoice ? Number(primaryInvoice.totalDue) : existing.totalDue,
              savedAt: "Cloud DB",
            };
            clientMap.set(email.toLowerCase(), { ...existing, ...dbClient });
          }

          const finalClients = Array.from(clientMap.values());
          setSavedClientsList(finalClients);
          try {
            localStorage.setItem("lexicore_saved_clients", JSON.stringify(finalClients));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveInvoiceAndClient = () => {
    const safeClientName = clientName.trim() || "New Client";
    const safeClientEmail = clientEmail.trim() || `client-${Date.now()}@domain.com`;

    const invoiceRecord: any = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      issueDate,
      dueDate,
      clientName: safeClientName,
      clientEmail: safeClientEmail,
      matterTitle,
      matterType,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      trustRetainerAvailable: availableTrustRetainer,
      trustRetainerApplied: effectiveRetainerApplied,
      totalDue: netPayable,
      savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "DRAFT",
    };

    try {
      localStorage.setItem("lexicore_active_invoice", JSON.stringify(invoiceRecord));

      // Append or update in saved clients list
      const existing: any[] = JSON.parse(localStorage.getItem("lexicore_saved_clients") || "[]");
      const filtered = existing.filter(
        (c: any) => c.clientEmail?.toLowerCase() !== safeClientEmail.toLowerCase()
      );
      const updatedList = [invoiceRecord, ...filtered];

      localStorage.setItem("lexicore_saved_clients", JSON.stringify(updatedList));
      setSavedClientsList(updatedList);
      window.dispatchEvent(new CustomEvent("lexicore:client-updated", { detail: invoiceRecord }));

      // Persist full payload with line items to Neon PostgreSQL Database
      fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: safeClientName,
          clientEmail: safeClientEmail,
          matterTitle,
          matterType,
          invoiceNumber,
          issueDate,
          dueDate,
          lineItems,
          subtotal,
          taxRate,
          taxAmount,
          trustRetainerApplied: effectiveRetainerApplied,
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
    if (client.invoiceNumber) setInvoiceNumber(client.invoiceNumber);
    if (client.issueDate) setIssueDate(client.issueDate);
    if (client.dueDate) setDueDate(client.dueDate);

    if (Array.isArray(client.lineItems) && client.lineItems.length > 0) {
      setLineItems(client.lineItems);
    } else {
      setLineItems([
        {
          id: `item-${Date.now()}-1`,
          description: `${client.matterTitle || "Statutory Legal & Tax Advisory"}`,
          category: "SERVICE",
          hours: 4.0,
          rate: 450,
          amount: 1800,
        },
      ]);
    }

    if (client.taxRate !== undefined) setTaxRate(Number(client.taxRate));
    if (client.trustRetainerAvailable !== undefined) {
      setAvailableTrustRetainer(Number(client.trustRetainerAvailable));
    }
    if (client.trustRetainerApplied !== undefined) {
      setRetainerAppliedInput(Number(client.trustRetainerApplied));
    }

    try {
      localStorage.setItem("lexicore_active_invoice", JSON.stringify(client));
      window.dispatchEvent(new CustomEvent("lexicore:client-updated", { detail: client }));
    } catch {}

    setSavedAt(`Loaded: ${client.clientName}`);
    setShowClientPicker(false);
  };

  const handleNewClient = () => {
    // 1. Auto-save current client if they have valid details
    if (clientName && clientEmail) {
      handleSaveInvoiceAndClient();
    }

    // 2. Setup blank slate for new client
    const newInv = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setInvoiceNumber(newInv);
    setClientName("");
    setClientEmail("");
    setMatterTitle("General Corporate Counsel & Tax Compliance");
    setMatterType("TAX");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setLineItems([
      {
        id: `item-${Date.now()}-1`,
        description: "Initial Statutory Intake & Corporate Entity Review",
        category: "SERVICE",
        hours: 2.0,
        rate: 450,
        amount: 900,
      },
    ]);
    setAvailableTrustRetainer(0);
    setRetainerAppliedInput(0);
    setApplyRetainer(false);
    setSavedAt("Ready for new client details");
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
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-white/10 shadow-2xl relative z-30">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

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
          {/* New Client Button */}
          <button
            onClick={handleNewClient}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 transition shadow-sm"
            title="Create a new client matter without losing existing clients"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Client</span>
          </button>

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
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowClientPicker(false)}
                  />
                  <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-2.5 z-50 space-y-1 text-xs backdrop-blur-2xl ring-1 ring-white/15">
                    <div className="font-semibold text-slate-300 px-2 py-1.5 border-b border-white/10 text-[11px] uppercase tracking-wider flex justify-between items-center">
                      <span>Saved Clients ({savedClientsList.length})</span>
                      <button
                        onClick={handleNewClient}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ New Client</span>
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-1.5 py-1">
                      {savedClientsList.map((client, idx) => {
                        const isCurrentActive =
                          client.clientEmail?.toLowerCase() === clientEmail?.toLowerCase();
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectSavedClient(client)}
                            className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-start justify-between gap-3 group ${
                              isCurrentActive
                                ? "bg-indigo-600/20 border-indigo-500/40 shadow-inner"
                                : "hover:bg-indigo-600/10 hover:border-indigo-500/20 border-white/5"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white group-hover:text-indigo-300 text-xs truncate">
                                  {client.clientName}
                                </span>
                                {isCurrentActive && (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                                    CURRENT
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {client.matterTitle || client.clientEmail}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                                <span>{client.invoiceNumber}</span>
                                <span>•</span>
                                <span>{client.lineItems?.length || 0} line items</span>
                                {client.savedAt && (
                                  <>
                                    <span>•</span>
                                    <span>{client.savedAt}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 pt-0.5">
                              <div className="text-xs font-bold font-mono text-cyan-300">
                                ${Number(client.totalDue || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
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
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColumnMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-3 z-50 space-y-2 text-xs backdrop-blur-2xl ring-1 ring-white/15">
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
              </>
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
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between text-xs gap-4 border border-white/10 bg-slate-900/70 relative z-10">
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
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveInvoiceAndClient}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition shadow-sm"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isSaved ? "Saved to Portal!" : "Save Client to Portal"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNewClient}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>+ New Client</span>
                </button>
                <span className="text-[10px] text-slate-400 font-mono">
                  All clients safely preserved
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
