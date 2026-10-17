"use client";

import React, { useState } from "react";
import {
  User,
  Users,
  Shield,
  ChevronDown,
  LogOut,
  UserPlus,
  RefreshCw,
  Building2,
  Check,
} from "lucide-react";
import {
  UserAccount,
  getAllUsers,
  setActiveUserSession,
  logoutUserSession,
} from "../../lib/auth/authStore";

interface UserNavProps {
  currentUser: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
  onOpenAuthModal: (mode: "signin" | "register") => void;
}

export function UserNav({
  currentUser,
  onUserChange,
  onOpenAuthModal,
}: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const users = getAllUsers();

  const handleSelectUser = (user: UserAccount) => {
    setActiveUserSession(user);
    onUserChange(user);
    setIsOpen(false);
  };

  const handleSignOut = () => {
    logoutUserSession();
    onUserChange(null);
    setIsOpen(false);
    onOpenAuthModal("signin");
  };

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenAuthModal("signin")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
        >
          Sign In
        </button>
        <button
          onClick={() => onOpenAuthModal("register")}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30"
        >
          Create Account
        </button>
      </div>
    );
  }

  // Generate initials
  const initials = currentUser.fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Role Badge Styling
  const isClientRole = currentUser.role.startsWith("CLIENT_");
  const roleBadgeColor = isClientRole
    ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
    : currentUser.role === "MANAGING_PARTNER"
    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
    : currentUser.role === "BILLING_SPECIALIST"
    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
    : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";

  return (
    <div className="relative">
      {/* Current User Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 transition shadow-sm"
      >
        <div
          className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${
            currentUser.avatarColor || "from-indigo-600 to-cyan-500"
          } text-white flex items-center justify-center font-bold text-xs shadow-md`}
        >
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-white leading-tight truncate max-w-[130px]">
            {currentUser.fullName}
          </div>
          <div className="text-[10px] text-slate-400 font-mono leading-tight">
            {currentUser.role}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel border border-white/15 shadow-2xl p-3 z-50 text-xs backdrop-blur-xl">
          {/* User Details Header */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 mb-2">
            <div className="font-bold text-white text-sm">{currentUser.fullName}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
              {currentUser.email}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}>
                {currentUser.role}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                {currentUser.organizationName}
              </span>
            </div>
          </div>

          {/* Quick User Switcher List */}
          <div className="py-1">
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-2 py-1">
              Switch User Account
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
              {users.map((u) => {
                const isSelected = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-indigo-600/20 border border-indigo-500/30 text-white"
                        : "hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium truncate">{u.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {u.role} &bull; {u.email}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-white/10 mt-2 space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal("register");
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-cyan-300 flex items-center gap-2 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New User Credentials</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-300 flex items-center gap-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
