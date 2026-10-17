"use client";

import React, { useState, useEffect } from "react";
import { InvoiceGenerator } from "../components/billing/InvoiceGenerator";
import { ClientStatusTracker } from "../components/portal/ClientStatusTracker";
import { LicenseGate } from "../components/auth/LicenseGate";
import { UserNav } from "../components/auth/UserNav";
import { MultiUserAuthModal } from "../components/auth/MultiUserAuthModal";
import {
  UserAccount,
  getActiveUserSession,
  setActiveUserSession,
} from "../lib/auth/authStore";
import type { LicenseInfo } from "../lib/license/licenseValidator";
import {
  Scale,
  Receipt,
  Users,
  HardDrive,
  Sparkles,
  ShieldCheck,
  Cpu,
  Zap,
  Printer,
  Terminal,
  UserCheck,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"billing" | "portal" | "diagnostics">("billing");
  const [activeLicense, setActiveLicense] = useState<LicenseInfo | null>(null);

  // Multi-User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "register">("signin");

  useEffect(() => {
    const user = getActiveUserSession();
    if (user) {
      setCurrentUser(user);
      // If user is an external client, default to Client Portal tab
      if (user.role.startsWith("CLIENT_")) {
        setActiveTab("portal");
      }
    }
  }, []);

  const handleUserChange = (user: UserAccount | null) => {
    setCurrentUser(user);
    if (user && user.role.startsWith("CLIENT_")) {
      setActiveTab("portal");
    }
  };

  const handleOpenAuthModal = (mode: "signin" | "register") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const isClientRole = currentUser?.role.startsWith("CLIENT_");

  return (
    <LicenseGate activeLicense={activeLicense} onLicenseUpdate={setActiveLicense}>
      <main className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
        {/* Top Global Navigation Bar - High-End AI Software Aesthetic */}
        <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Logo & Operational Status */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/20">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                </span>
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight flex items-center gap-2 text-white">
                  <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    LEXICORE // AI
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    SAAS v2.0
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LICENSED
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Autonomous Legal, CPA & Tax Systems</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini 2.5 Flash
                  </span>
                </div>
              </div>
            </div>

            {/* Right Controls: Role-Aware Tab Switcher + User Profile Nav */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                {/* Firm Staff Tab: Only show if not scoped to Client User */}
                {!isClientRole && (
                  <button
                    onClick={() => setActiveTab("billing")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      activeTab === "billing"
                        ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 border border-white/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Billing & Hardware Print</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("portal")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    activeTab === "portal"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 border border-white/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isClientRole ? "My Active Matters" : "Matter Neural Pipeline"}</span>
                </button>

                {!isClientRole && (
                  <button
                    onClick={() => setActiveTab("diagnostics")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      activeTab === "diagnostics"
                        ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 border border-white/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Stack</span>
                  </button>
                )}
              </div>

              {/* Multi-User Profile Widget */}
              <UserNav
                currentUser={currentUser}
                onUserChange={handleUserChange}
                onOpenAuthModal={handleOpenAuthModal}
              />
            </div>
          </div>

          {/* AI Metrics & SaaS Plan Ribbon */}
          <div className="border-t border-white/5 bg-slate-950/40 px-4 sm:px-6 py-1.5 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Inference Engine:</span>
                <span className="font-mono text-slate-200">Gemini 2.5 Flash Multimodal</span>
              </div>
              <span className="text-slate-700 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Printer className="w-3 h-3 text-cyan-400" />
                <span>Hardware Spooler:</span>
                <span className="font-mono text-emerald-400">Tauri 2.0 (GDI / CUPS)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && (
                <span className="font-mono text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                  USER: {currentUser.fullName.toUpperCase()} ({currentUser.role})
                </span>
              )}
              <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                PLAN: 3-MONTH ENTERPRISE (DEC 27, 2026)
              </span>
            </div>
          </div>
        </header>

        {/* Main Tab Content */}
        <div className="flex-1 py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          {activeTab === "billing" && !isClientRole && <InvoiceGenerator />}
          {activeTab === "portal" && <ClientStatusTracker />}
          {activeTab === "diagnostics" && !isClientRole && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-white/10">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                      <span>Lexicore Multi-User & System Architecture</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Multi-tenant SaaS platform with custom credentials, physical hardware spooling, and double-entry IOLTA trust escrow accounting.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SAAS: MULTI-USER ACTIVE
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-xl bg-slate-900/60 border border-white/5 space-y-3 glass-panel-hover">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white">Tauri 2.0 Hardware Spooler</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Native Rust backend executing GDI rasterization and CUPS commands. Eliminates raw byte crashes on standard PCL office printers while supporting silent batch printing.
                    </p>
                    <div className="pt-2 text-[10px] font-mono text-indigo-400">
                      STATUS: READY (IPC CAPABILITIES ENABLED)
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-900/60 border border-white/5 space-y-3 glass-panel-hover">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white">Gemini 2.5 Flash Pre-Flight</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Multimodal document inspection via official <code>@google/genai</code> SDK. Inspects incoming client documents, extracts masked identifiers, and flags mismatches automatically.
                    </p>
                    <div className="pt-2 text-[10px] font-mono text-cyan-400">
                      MODEL: GEMINI-2.5-FLASH (JSON MODE)
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-900/60 border border-white/5 space-y-3 glass-panel-hover">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white">Strict IOLTA Escrow Ledger</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Immutable double-entry schema in Prisma with <code>Decimal(12, 2)</code> precision. Prevents improper commingling of unearned client retainer funds.
                    </p>
                    <div className="pt-2 text-[10px] font-mono text-emerald-400">
                      SCHEMA: VALIDATED & ENFORCED
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              LEXICORE SUITE &bull; Enterprise Tax, Accounting & Legal SaaS Operating System
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="text-emerald-400">SAAS LICENSE: 3-MONTH MASTER ACTIVE</span>
              <span className="text-slate-600">|</span>
              <span className="text-indigo-400">EXPIRES: DEC 27, 2026</span>
            </div>
          </div>
        </footer>

        {/* Multi-User Authentication & Registration Modal */}
        <MultiUserAuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleUserChange}
        />
      </main>
    </LicenseGate>
  );
}
