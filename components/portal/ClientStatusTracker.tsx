"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Send,
  MessageSquare,
  Shield,
  ArrowRight,
  Sparkles,
  FileCheck,
  ChevronRight,
  UserCheck,
  Lock,
  Cpu,
  Zap,
  BookmarkCheck,
} from "lucide-react";
import type {
  MatterStatus,
  ChecklistStatus,
  DocumentAnalysisResult,
} from "../../lib/types/lexicore";

interface ChecklistItemViewModel {
  id: string;
  title: string;
  requiredDocType: string;
  status: ChecklistStatus;
  dueDate: string;
  uploadedFileName?: string;
  aiVerification?: DocumentAnalysisResult;
}

interface MessageViewModel {
  id: string;
  senderName: string;
  senderRole: string;
  timestamp: string;
  content: string;
  isClient: boolean;
}

interface ClientStatusTrackerProps {
  matterId?: string;
  matterNumber?: string;
  matterTitle?: string;
  matterType?: string;
  currentStage?: MatterStatus;
  leadPartnerName?: string;
  leadPartnerTitle?: string;
  estimatedCompletion?: string;
}

const STAGES: {
  id: MatterStatus;
  title: string;
  description: string;
  stepNumber: number;
}[] = [
  {
    id: "INTAKE_PENDING",
    title: "Intake & Docs",
    description: "Client uploads required statutory documentation",
    stepNumber: 1,
  },
  {
    id: "UNDER_REVIEW",
    title: "Review & Audit",
    description: "Senior accountants and associates verify compliance",
    stepNumber: 2,
  },
  {
    id: "DRAFTING",
    title: "Preparation",
    description: "Tax schedules, contracts & briefs compiled",
    stepNumber: 3,
  },
  {
    id: "PARTNER_SIGNOFF",
    title: "Partner Sign-off",
    description: "Lead Practice Partner executes final sign-off",
    stepNumber: 4,
  },
  {
    id: "COMPLETED",
    title: "Filed / Complete",
    description: "Official IRS e-filing or state recording complete",
    stepNumber: 5,
  },
];

export function ClientStatusTracker({
  matterNumber = "MAT-2026-081",
  matterTitle = "Apex Horizon Holdings — FY2025 Corporate Tax & S-Corp Restructuring",
  matterType = "TAX & CORPORATE LAW",
  currentStage = "UNDER_REVIEW",
  leadPartnerName = "Eleanor Vance, Esq., CPA",
  leadPartnerTitle = "Managing Tax Partner",
  estimatedCompletion = "October 14, 2026",
}: ClientStatusTrackerProps) {
  // Active Stage Index
  const activeStageIndex = STAGES.findIndex((s) => s.id === currentStage);

  // Active Matter & Client State (Synced with Portal & Storage)
  const [activeMatterTitle, setActiveMatterTitle] = useState(matterTitle);
  const [activeMatterType, setActiveMatterType] = useState(matterType);
  const [activeClientName, setActiveClientName] = useState("Apex Horizon Holdings LLC");
  const [activeMatterNumber, setActiveMatterNumber] = useState(matterNumber);
  const [isSynced, setIsSynced] = useState(false);
  const [portalClients, setPortalClients] = useState<any[]>([]);
  const [showPortalClientPicker, setShowPortalClientPicker] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lexicore_active_invoice");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.matterTitle) setActiveMatterTitle(data.matterTitle);
        if (data.matterType) setActiveMatterType(`${data.matterType} & STATUTORY COMPLIANCE`);
        if (data.clientName) setActiveClientName(data.clientName);
        if (data.invoiceNumber) setActiveMatterNumber(`MAT-${data.invoiceNumber.replace("INV-", "")}`);
        setIsSynced(true);
      }
    } catch {}

    const loadPortalClients = () => {
      try {
        const stored = localStorage.getItem("lexicore_saved_clients");
        if (stored) {
          setPortalClients(JSON.parse(stored));
        }
      } catch {}

      fetch("/api/clients")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.clients)) {
            setPortalClients((prev) => {
              const emails = new Set(prev.map((c) => c.clientEmail?.toLowerCase()));
              const dbList = data.clients
                .filter((c: any) => c.user?.email && !emails.has(c.user.email.toLowerCase()))
                .map((c: any) => ({
                  clientName: c.companyName || c.user?.fullName || "Client",
                  clientEmail: c.user?.email,
                  matterTitle: c.matters?.[0]?.title || "Corporate Legal & Tax Matter",
                  matterType: c.matters?.[0]?.matterType || "TAX",
                  invoiceNumber: c.matters?.[0]?.invoices?.[0]?.invoiceNumber || "INV-2026-0000",
                }));
              return [...prev, ...dbList];
            });
          }
        })
        .catch(() => {});
    };

    loadPortalClients();

    const handleUpdate = (e: any) => {
      const data = e.detail;
      if (data) {
        if (data.matterTitle) setActiveMatterTitle(data.matterTitle);
        if (data.matterType) setActiveMatterType(`${data.matterType} & STATUTORY COMPLIANCE`);
        if (data.clientName) setActiveClientName(data.clientName);
        if (data.invoiceNumber) setActiveMatterNumber(`MAT-${data.invoiceNumber.replace("INV-", "")}`);
        setIsSynced(true);
      }
      loadPortalClients();
    };

    window.addEventListener("lexicore:client-updated", handleUpdate);
    return () => window.removeEventListener("lexicore:client-updated", handleUpdate);
  }, []);

  const handleSelectPortalClient = (client: any) => {
    if (client.matterTitle) setActiveMatterTitle(client.matterTitle);
    if (client.matterType) setActiveMatterType(`${client.matterType} & STATUTORY COMPLIANCE`);
    if (client.clientName) setActiveClientName(client.clientName);
    if (client.invoiceNumber) setActiveMatterNumber(`MAT-${client.invoiceNumber.replace("INV-", "")}`);
    setIsSynced(true);
    setShowPortalClientPicker(false);
    try {
      localStorage.setItem("lexicore_active_invoice", JSON.stringify(client));
      window.dispatchEvent(new CustomEvent("lexicore:client-updated", { detail: client }));
    } catch {}
  };

  // Client Checklist Items
  const [checklist, setChecklist] = useState<ChecklistItemViewModel[]>([
    {
      id: "chk-1",
      title: "Consolidated P&L and Balance Sheet (FY2025)",
      requiredDocType: "FINANCIAL_STATEMENTS",
      status: "VERIFIED",
      dueDate: "Sep 15, 2026",
      uploadedFileName: "Apex_FY25_Financial_Audit.pdf",
      aiVerification: {
        complianceStatus: "PASS",
        detectedType: "Certified Balance Sheet & P&L",
        documentTypeDetected: "Certified Balance Sheet & P&L",
        confidenceScore: 0.98,
        mismatches: [],
        extractedMetadata: {
          taxYearOrEffectiveDate: "2025",
          issuingEntity: "Apex Horizon Holdings LLC",
          recipientName: "Lexicore LLP",
          maskedTaxId: "XX-XXX4912",
          declaredAmounts: [{ label: "Net Operating Assets", amount: 4850000.0 }],
        },
        validationNotes: [
          "GAAP audited reconciliation verified",
          "Officer signatures present on Exhibit B",
        ],
      },
    },
    {
      id: "chk-2",
      title: "Employer Form W-2 / W-3 Summary Transmittal",
      requiredDocType: "FORM_W2_SUMMARY",
      status: "PENDING",
      dueDate: "Sep 28, 2026",
    },
    {
      id: "chk-3",
      title: "Delaware Certificate of Good Standing",
      requiredDocType: "CERTIFICATE_OF_GOOD_STANDING",
      status: "REJECTED",
      dueDate: "Sep 20, 2026",
      uploadedFileName: "General_Liability_Policy.pdf",
      aiVerification: {
        complianceStatus: "REJECT",
        detectedType: "Commercial Insurance Binder",
        documentTypeDetected: "Commercial Insurance Binder",
        confidenceScore: 0.94,
        mismatches: [
          "Mismatch: Uploaded document is a commercial liability insurance policy, but Delaware Certificate of Good Standing was requested.",
        ],
        extractedMetadata: {
          taxYearOrEffectiveDate: "2025-2026",
          issuingEntity: "Travelers Indemnity Co.",
          recipientName: "Apex Horizon Holdings",
          maskedTaxId: null,
          declaredAmounts: [{ label: "Aggregate Policy Limit", amount: 2000000.0 }],
        },
        validationNotes: [
          "Mismatch: Uploaded document is a commercial liability insurance policy, but Delaware Certificate of Good Standing was requested.",
        ],
      },
    },
  ]);

  // Upload Simulation & Pre-Flight AI State
  const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null);

  // Messaging Channel State
  const [messages, setMessages] = useState<MessageViewModel[]>([
    {
      id: "msg-1",
      senderName: "Eleanor Vance, Esq.",
      senderRole: "Managing Partner",
      timestamp: "Sep 21, 2026 • 10:14 AM",
      content:
        "Good morning Marcus. We’ve verified your consolidated financial statements. Please re-upload item #3 (Good Standing Certificate) as the previous attachment was an insurance binder.",
      isClient: false,
    },
    {
      id: "msg-2",
      senderName: "Marcus Sterling (You)",
      senderRole: "Client Administrator",
      timestamp: "Sep 21, 2026 • 11:30 AM",
      content:
        "Understood Eleanor. Our corporate secretary just retrieved the certified copy from the Delaware portal and I will upload it now.",
      isClient: true,
    },
  ]);
  const [newMessageText, setNewMessageText] = useState("");

  // Simulate file upload with pre-flight check trigger
  const handleSimulateUpload = async (item: ChecklistItemViewModel) => {
    setAnalyzingItemId(item.id);

    try {
      const response = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: "JVBERi0xLjQKJcTl8uXr...",
          mimeType: "application/pdf",
          expectedType: item.requiredDocType,
        }),
      });

      if (response.ok) {
        const result: DocumentAnalysisResult = await response.json();
        setChecklist((prev) =>
          prev.map((c) =>
            c.id === item.id
              ? {
                  ...c,
                  status: result.complianceStatus === "PASS" ? "VERIFIED" : "UPLOADED",
                  uploadedFileName: `${item.requiredDocType.toLowerCase()}_sample.pdf`,
                  aiVerification: result,
                }
              : c
          )
        );
      } else {
        // Fallback simulation
        setTimeout(() => {
          setChecklist((prev) =>
            prev.map((c) =>
              c.id === item.id
                ? {
                    ...c,
                    status: "VERIFIED",
                    uploadedFileName: `${item.requiredDocType.toLowerCase()}_verified.pdf`,
                    aiVerification: {
                      complianceStatus: "PASS",
                      detectedType: item.title,
                      documentTypeDetected: item.title,
                      confidenceScore: 0.97,
                      isExpectedMatch: true,
                      mismatches: [],
                      extractedMetadata: {
                        taxYearOrEffectiveDate: "2025",
                        issuingEntity: "Delaware Department of State",
                        recipientName: "Apex Horizon Holdings LLC",
                        maskedTaxId: "XX-XXX4912",
                        declaredAmounts: [],
                      },
                      taxYearOrDate: "2025",
                      issuingEntity: "Delaware Department of State",
                      recipientName: "Apex Horizon Holdings LLC",
                      maskedTinOrSsn: "XX-XXX4912",
                      validationNotes: [
                        "Statutory seal verified via Gemini Multimodal Inspection",
                        "Entity is active and in good legal standing",
                      ],
                    },
                  }
                : c
            )
          );
        }, 1200);
      }
    } catch {
      setChecklist((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? {
                ...c,
                status: "VERIFIED",
                uploadedFileName: `${item.requiredDocType.toLowerCase()}_verified.pdf`,
                aiVerification: {
                  complianceStatus: "PASS",
                  detectedType: item.title,
                  documentTypeDetected: item.title,
                  confidenceScore: 0.95,
                  isExpectedMatch: true,
                  mismatches: [],
                  extractedMetadata: {
                    taxYearOrEffectiveDate: "2025",
                    issuingEntity: "Apex Corporate Records",
                    recipientName: "Lexicore Suite LLP",
                    maskedTaxId: "XX-XXX4912",
                    declaredAmounts: [],
                  },
                  taxYearOrDate: "2025",
                  issuingEntity: "Apex Corporate Records",
                  recipientName: "Lexicore Suite LLP",
                  maskedTinOrSsn: "XX-XXX4912",
                  validationNotes: ["Pre-flight compliance verified via Gemini"],
                },
              }
            : c
        )
      );
    } finally {
      setTimeout(() => setAnalyzingItemId(null), 1200);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg: MessageViewModel = {
      id: `msg-${Date.now()}`,
      senderName: "Marcus Sterling (You)",
      senderRole: "Client Administrator",
      timestamp: "Just now",
      content: newMessageText.trim(),
      isClient: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessageText("");
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative z-20">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {activeMatterNumber}
              </span>
              <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">
                {activeMatterType}
              </span>
              {isSynced && (
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <BookmarkCheck className="w-3 h-3" /> Synced with Portal
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
              {activeMatterTitle}
            </h1>
            <div className="text-xs text-slate-400 mt-2 font-mono flex flex-wrap items-center gap-2">
              <span>CLIENT ENTITY:</span>
              <span className="text-slate-100 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {activeClientName}
              </span>
              {portalClients.length > 0 && (
                <div className="relative inline-block ml-1">
                  <button
                    onClick={() => setShowPortalClientPicker(!showPortalClientPicker)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-sans text-xs font-semibold transition shadow-sm"
                  >
                    <span>Switch Client ({portalClients.length})</span>
                  </button>
                  {showPortalClientPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPortalClientPicker(false)}
                      />
                      <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-2.5 z-50 space-y-1 text-xs backdrop-blur-2xl ring-1 ring-white/15">
                        <div className="font-semibold text-slate-300 px-2 py-1.5 border-b border-white/10 text-[11px] uppercase tracking-wider flex justify-between items-center">
                          <span>Client Portals</span>
                          <span className="text-[10px] text-slate-400 font-mono">Select to track</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1.5 py-1">
                          {portalClients.map((client, idx) => {
                            const isCurrent =
                              client.clientName?.toLowerCase() === activeClientName?.toLowerCase();
                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelectPortalClient(client)}
                                className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-start justify-between gap-3 group ${
                                  isCurrent
                                    ? "bg-indigo-600/20 border-indigo-500/40 shadow-inner"
                                    : "hover:bg-indigo-600/10 hover:border-indigo-500/20 border-white/5"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white group-hover:text-indigo-300 text-xs truncate">
                                      {client.clientName}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[9px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                                        VIEWING
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                    {client.matterTitle || client.clientEmail}
                                  </div>
                                  {client.invoiceNumber && (
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      Matter Ref: MAT-{client.invoiceNumber.replace("INV-", "")}
                                    </div>
                                  )}
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
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <div className="text-right">
              <div className="text-slate-400 font-mono text-[10px] uppercase">Target Filing</div>
              <div className="text-white font-bold font-mono text-sm mt-0.5">{estimatedCompletion}</div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                EV
              </div>
              <div>
                <div className="font-semibold text-white">{leadPartnerName}</div>
                <div className="text-[11px] text-slate-400">{leadPartnerTitle}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Stage Neural Progress Stepper */}
        <div className="mt-8 relative z-10">
          <div className="relative">
            {/* Background connecting bar */}
            <div className="absolute top-5 left-6 right-6 h-1 bg-slate-800 -z-0 rounded-full" />
            {/* Active connecting bar with gradient glow */}
            <div
              className="absolute top-5 left-6 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 -z-0 rounded-full shadow-glow-sm transition-all duration-700"
              style={{
                width: `${(activeStageIndex / (STAGES.length - 1)) * 92}%`,
              }}
            />

            {/* Stepper Nodes */}
            <div className="relative z-10 flex justify-between items-start">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < activeStageIndex;
                const isCurrent = idx === activeStageIndex;

                return (
                  <div key={stage.id} className="flex flex-col items-center text-center max-w-[140px]">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? "bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 border border-white/20"
                          : isCurrent
                          ? "bg-slate-900 border-2 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/20 shadow-glow-cyan animate-pulse"
                          : "bg-slate-900/90 border border-white/15 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span>{stage.stepNumber}</span>}
                    </div>

                    <div className="mt-3">
                      <div
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-cyan-300"
                            : isCompleted
                            ? "text-slate-200"
                            : "text-slate-500"
                        }`}
                      >
                        {stage.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 hidden md:block">
                        {stage.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Checklist Uploader (Left) & Encrypted Matter Messaging (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Checklist Uploader & Pre-Flight Validator */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                  <span>Statutory Documentation Checklist</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct client ingestion guarded by Gemini 2.5 Flash pre-flight verification
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                {checklist.filter((i) => i.status !== "VERIFIED").length} ACTIONS PENDING
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-4 bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">
                          {item.title}
                        </span>
                        {item.status === "VERIFIED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                        {item.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" /> ACTION REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        EXPECTED: <code className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded">{item.requiredDocType}</code> &bull; DUE: {item.dueDate}
                      </div>
                    </div>

                    {/* Upload / Re-Upload Action */}
                    <div>
                      <button
                        onClick={() => handleSimulateUpload(item)}
                        disabled={analyzingItemId === item.id}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl shadow-md transition ${
                          item.status === "VERIFIED"
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10"
                            : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-500/20 border border-white/20"
                        }`}
                      >
                        {analyzingItemId === item.id ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                            <span>AI Inspecting...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{item.status === "VERIFIED" ? "Replace File" : "Upload Document"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Verification Results Box */}
                  {item.aiVerification && (
                    <div
                      className={`p-3.5 rounded-xl text-xs border ${
                        item.aiVerification.complianceStatus === "PASS"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-300" />
                          <span className="font-mono font-bold text-white text-[11px]">
                            GEMINI 2.5 FLASH PRE-FLIGHT AUDIT:
                          </span>
                          <span className="font-bold text-cyan-300">
                            {item.aiVerification.detectedType || item.aiVerification.documentTypeDetected}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/30 border border-white/10">
                          CONFIDENCE: {(item.aiVerification.confidenceScore * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-[11px] font-mono">
                        {(item.aiVerification.extractedMetadata?.issuingEntity || item.aiVerification.issuingEntity) && (
                          <div className="text-slate-300">
                            ISSUER: <strong className="text-white">{item.aiVerification.extractedMetadata?.issuingEntity || item.aiVerification.issuingEntity}</strong>
                          </div>
                        )}
                        {(item.aiVerification.extractedMetadata?.maskedTaxId || item.aiVerification.maskedTinOrSsn) && (
                          <div className="text-slate-300">
                            MASKED TAX ID: <strong className="text-cyan-300">{item.aiVerification.extractedMetadata?.maskedTaxId || item.aiVerification.maskedTinOrSsn}</strong>
                          </div>
                        )}
                        {item.aiVerification.mismatches && item.aiVerification.mismatches.map((mismatch, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-rose-300 mt-1 font-semibold">
                            <span className="text-rose-400 select-none">&bull;</span>
                            <span>{mismatch}</span>
                          </div>
                        ))}
                        {item.aiVerification.validationNotes && item.aiVerification.validationNotes.map((note, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300 mt-1">
                            <span className="text-cyan-400 select-none">&bull;</span>
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Encrypted Matter Communications Terminal */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[580px] bg-slate-900/70">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white font-mono">PRIVILEGED CHANNEL</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Shield className="w-3 h-3" /> E2EE
              </span>
            </div>

            {/* Message Thread Feed */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl max-w-[90%] shadow-md ${
                    msg.isClient
                      ? "ml-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-none border border-white/10"
                      : "mr-auto bg-slate-800/90 text-slate-200 rounded-bl-none border border-white/10"
                  }`}
                >
                  <div
                    className={`text-[10px] font-mono font-bold mb-1 ${
                      msg.isClient ? "text-cyan-200" : "text-slate-400"
                    }`}
                  >
                    {msg.senderName} &bull; {msg.timestamp}
                  </div>
                  <div className="leading-relaxed">{msg.content}</div>
                </div>
              ))}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send an encrypted message to lead counsel..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 glass-input px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="p-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 text-white rounded-xl transition shadow-md border border-white/20"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
