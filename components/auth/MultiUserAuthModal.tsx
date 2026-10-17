"use client";

import React, { useState } from "react";
import {
  User,
  Lock,
  Mail,
  Building2,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Briefcase,
  Users,
  ChevronDown,
} from "lucide-react";
import {
  UserAccount,
  loginUser,
  registerUser,
  getAllUsers,
} from "../../lib/auth/authStore";
import type { UserRole } from "../../lib/types/lexicore";

interface MultiUserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: "signin" | "register";
}

const ROLE_OPTIONS: { role: UserRole; title: string; category: "Staff" | "Client"; desc: string }[] = [
  {
    role: "MANAGING_PARTNER",
    title: "Managing Partner / Senior Partner",
    category: "Staff",
    desc: "Full administrative control, billing oversight, and firm settings.",
  },
  {
    role: "PARTNER",
    title: "Partner / Practice Lead",
    category: "Staff",
    desc: "Oversees practice areas, assigns matters, approves final invoices.",
  },
  {
    role: "ASSOCIATE",
    title: "Associate / Senior Accountant",
    category: "Staff",
    desc: "Daily matter execution, billable time entry (0.1h), legal drafting.",
  },
  {
    role: "PARALEGAL",
    title: "Paralegal / Junior Accountant / Clerk",
    category: "Staff",
    desc: "Document ingestion, checklist verification, and AI pre-flight review.",
  },
  {
    role: "BILLING_SPECIALIST",
    title: "Billing Specialist",
    category: "Staff",
    desc: "IOLTA trust escrow accounting, retainer management, invoice dispatch.",
  },
  {
    role: "CLIENT_ADMIN",
    title: "Client Administrator (Corporate POC)",
    category: "Client",
    desc: "Corporate client point of contact, doc uploads, payment approvals.",
  },
  {
    role: "CLIENT_USER",
    title: "Client User (Entity Member / Individual)",
    category: "Client",
    desc: "Individual matter progress tracking and document uploads.",
  },
];

export function MultiUserAuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "signin",
}: MultiUserAuthModalProps) {
  const [mode, setMode] = useState<"signin" | "register">(initialMode);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("ASSOCIATE");
  const [organizationName, setOrganizationName] = useState("Vance & Associates Legal LLP");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const users = getAllUsers();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = loginUser(email, password);
    if (result.success && result.user) {
      onSuccess(result.user);
      onClose();
    } else {
      setErrorMessage(result.error || "Failed to authenticate.");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    const result = registerUser({
      fullName,
      email,
      password,
      role,
      organizationName,
    });

    if (result.success && result.user) {
      onSuccess(result.user);
      onClose();
    } else {
      setErrorMessage(result.error || "Failed to create account.");
    }
  };

  const handleQuickSelectDemoUser = (user: UserAccount) => {
    setEmail(user.email);
    setPassword(user.password);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-bold"
        >
          &times;
        </button>

        {/* Modal Header */}
        <div className="text-center pb-4 border-b border-white/10">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {mode === "signin" ? "Sign In to Lexicore Suite" : "Create Multi-User Account"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === "signin"
              ? "Access your role-based workspace or client portal"
              : "Set your own custom credentials and select your firm role"}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-4 flex p-1 rounded-xl bg-slate-900 border border-white/10 text-xs">
            <button
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                mode === "signin"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In (Existing User)
            </button>
            <button
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                mode === "register"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Set New Credentials
            </button>
          </div>
        </div>

        {/* Quick Demo Switcher (when in Sign In mode) */}
        {mode === "signin" && (
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="text-[11px] font-mono text-slate-400 mb-2 font-bold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-CLICK DEMO ACCOUNTS (CLICK TO AUTOFILL):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {users.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelectDemoUser(u)}
                  className="text-left p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 transition text-[11px] space-y-0.5"
                >
                  <div className="font-semibold text-white truncate">{u.fullName.split(" ")[0]}</div>
                  <div className="text-[10px] text-cyan-400 font-mono truncate">{u.role}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sign In Form */}
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="eleanor@vancelegal.com"
                  className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-white placeholder-slate-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input pl-9 pr-10 py-2.5 rounded-xl text-white placeholder-slate-500 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/20 text-xs flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In with Credentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          /* Register / Set New Credentials Form */
          <form onSubmit={handleRegister} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1">
                Full Name & Title
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jonathan Wright, Esq."
                  className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-white placeholder-slate-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jwright@firm.com"
                  className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-white placeholder-slate-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1">
                Firm / Practice / Client Entity
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Vance & Associates Legal LLP"
                  className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-white placeholder-slate-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1">
                Assigned Role in Platform
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-cyan-300 focus:outline-none focus:border-indigo-500 font-mono"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.role} value={opt.role} className="bg-slate-900 text-white">
                    [{opt.category.toUpperCase()}] {opt.title}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1 font-sans">
                {ROLE_OPTIONS.find((o) => o.role === role)?.desc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1">
                  Set Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full glass-input px-3 py-2 rounded-xl text-white placeholder-slate-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full glass-input px-3 py-2 rounded-xl text-white placeholder-slate-500 text-xs font-mono"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/20 text-xs flex items-center justify-center gap-2 mt-2"
            >
              <span>Save Credentials & Register User</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
