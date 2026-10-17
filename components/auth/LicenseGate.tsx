"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  ShieldCheck,
  Building2,
  Mail,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  LogOut,
  Calendar,
  Layers,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  LicenseInfo,
  validateLicenseKey,
  saveLicenseSession,
  getSavedLicenseSession,
  clearLicenseSession,
  VALID_3_MONTH_LICENSE_KEYS,
} from "../../lib/license/licenseValidator";

interface LicenseGateProps {
  children: React.ReactNode;
  activeLicense: LicenseInfo | null;
  onLicenseUpdate: (license: LicenseInfo | null) => void;
}

const DEFAULT_DEMO_KEY = "LEXI-SAAS-2026-90D-88F4-A92B-4E1C";

export function LicenseGate({
  children,
  activeLicense,
  onLicenseUpdate,
}: LicenseGateProps) {
  const [licenseKeyInput, setLicenseKeyInput] = useState(DEFAULT_DEMO_KEY);
  const [orgNameInput, setOrgNameInput] = useState("Vance & Associates Legal & Tax LLP");
  const [emailInput, setEmailInput] = useState("managing.partner@vancelegal.com");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  // Initialize from storage on mount
  useEffect(() => {
    const saved = getSavedLicenseSession();
    if (saved && saved.status === "ACTIVE") {
      onLicenseUpdate(saved);
    }
  }, [onLicenseUpdate]);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsActivating(true);

    setTimeout(() => {
      const validation = validateLicenseKey(
        licenseKeyInput,
        orgNameInput.trim() || "Apex Legal Group",
        emailInput.trim() || "admin@lexicore.com"
      );

      if (validation.status === "ACTIVE") {
        saveLicenseSession(validation);
        onLicenseUpdate(validation);
      } else {
        setErrorMessage(
          "Invalid or expired SaaS license key. Please check the code or click 'Use 3-Month Master Key'."
        );
      }
      setIsActivating(false);
    }, 600);
  };

  const handleQuickFill = () => {
    setLicenseKeyInput(DEFAULT_DEMO_KEY);
    setOrgNameInput("Vance & Associates Legal & Tax LLP");
    setEmailInput("managing.partner@vancelegal.com");
    setErrorMessage(null);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(DEFAULT_DEMO_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleLogout = () => {
    clearLicenseSession();
    onLicenseUpdate(null);
    setShowLicenseModal(false);
  };

  // If active license is present, render platform with license header telemetry
  if (activeLicense && activeLicense.status === "ACTIVE") {
    return (
      <div className="relative">
        {/* Top Active SaaS License Ribbon */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-white/10 px-4 sm:px-6 py-1.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold text-white uppercase text-[11px] tracking-wider">
              SAAS ENTERPRISE LICENSE ACTIVE
            </span>
            <span className="text-slate-600 hidden sm:inline">&bull;</span>
            <span className="text-indigo-300 font-semibold hidden sm:inline">
              {activeLicense.organizationName}
            </span>
            <span className="text-slate-600 hidden md:inline">&bull;</span>
            <span className="text-cyan-400 font-mono text-[11px] hidden md:inline">
              {activeLicense.daysRemaining} DAYS REMAINING (EXPIRES DEC 27, 2026)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLicenseModal(true)}
              className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 underline decoration-cyan-500/40 transition"
            >
              License Details
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={handleLogout}
              className="text-[11px] font-mono text-slate-400 hover:text-rose-400 transition flex items-center gap-1"
              title="Deactivate license session"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* License Details Modal */}
        {showLicenseModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/15 max-w-lg w-full shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">SaaS Enterprise Subscription</h3>
                    <p className="text-xs text-slate-400 font-mono">3-Month Term &bull; Multi-Tenant</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLicenseModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="mt-5 space-y-3 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">ORGANIZATION:</span>
                  <span className="text-white font-bold">{activeLicense.organizationName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">ADMINISTRATOR:</span>
                  <span className="text-slate-200">{activeLicense.adminEmail}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">PLAN TIER:</span>
                  <span className="text-emerald-400 font-bold">ENTERPRISE SAAS (3 MONTHS)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">VALID UNTIL:</span>
                  <span className="text-cyan-300 font-bold">DECEMBER 27, 2026 (90 DAYS)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">LICENSE KEY:</span>
                  <span className="text-slate-300 break-all select-all font-mono text-[10px]">
                    {activeLicense.key}
                  </span>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
                <div className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enabled SaaS Features:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  <li>Gemini 2.5 Flash Multimodal Pre-Flight Audit</li>
                  <li>Strict IOLTA Escrow Double-Entry Accounting</li>
                  <li>Tauri 2.0 Native Hardware & Physical Printer Spooler</li>
                  <li>Client Matter Status Portal & Privileged Messaging</li>
                </ul>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                >
                  Deactivate License
                </button>
                <button
                  onClick={() => setShowLicenseModal(false)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {children}
      </div>
    );
  }

  // Unauthenticated / Activation Screen
  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden text-slate-100 font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        {/* Top Header Card */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center text-center">
            {/* Animated Logo */}
            <div className="p-3.5 bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 rounded-2xl shadow-xl shadow-indigo-500/30 border border-white/20 mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Lexicore SaaS Intelligence
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-sm">
              Enter your 3-Month SaaS Enterprise License Key to unlock cloud & desktop firm operations.
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-3 h-3" />
              <span>3-MONTH TERM &bull; VALID THROUGH DEC 27, 2026</span>
            </div>
          </div>

          {/* Quick-Fill Demo Key Helper */}
          <div className="mt-6 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
            <div className="flex items-center justify-between text-indigo-300 font-mono font-bold text-[11px] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                PRE-CONFIGURED 3-MONTH MASTER KEY:
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="hover:text-white flex items-center gap-1 text-[10px]"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-cyan-200 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10 select-all">
              <span>{DEFAULT_DEMO_KEY}</span>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[10px] text-indigo-300 hover:text-white underline font-sans ml-2"
              >
                Auto-Fill Form
              </button>
            </div>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="mt-6 space-y-4">
            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Firm / Organization Name</span>
              </label>
              <input
                type="text"
                required
                value={orgNameInput}
                onChange={(e) => setOrgNameInput(e.target.value)}
                placeholder="e.g. Vance & Partners Legal LLP"
                className="w-full glass-input px-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Administrator / Partner Email</span>
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. partner@vancelegal.com"
                className="w-full glass-input px-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>SaaS License Key</span>
              </label>
              <input
                type="text"
                required
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                placeholder="LEXI-SAAS-2026-90D-XXXX-XXXX-XXXX"
                className="w-full font-mono text-cyan-300 glass-input px-4 py-2.5 rounded-xl text-xs tracking-wider focus:border-cyan-400"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isActivating || !licenseKeyInput.trim()}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 border border-white/20"
            >
              {isActivating ? (
                <span>Verifying Cryptographic Entitlements...</span>
              ) : (
                <>
                  <span>Activate 3-Month SaaS License</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Entitlements Badge */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <Lock className="w-3 h-3" />
              <span>SHA-256 ENCRYPTED</span>
            </span>
            <span>ENTERPRISE GRADE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
