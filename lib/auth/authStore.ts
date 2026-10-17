"use client";

import type { UserRole } from "../types/lexicore";

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  password: string; // Plain/hash for client-side multi-user demonstration
  role: UserRole;
  organizationName: string;
  avatarColor?: string;
  createdAt: string;
}

const STORAGE_KEY_USERS = "lexicore_saas_users";
const STORAGE_KEY_ACTIVE_SESSION = "lexicore_active_user_session";

// Default Seeded Multi-User Accounts for Immediate Testing
const SEED_USERS: UserAccount[] = [
  {
    id: "usr-partner-1",
    fullName: "Eleanor Vance, Esq., CPA",
    email: "eleanor@vancelegal.com",
    password: "Password123!",
    role: "MANAGING_PARTNER",
    organizationName: "Vance & Associates Legal & Tax LLP",
    avatarColor: "from-indigo-600 to-cyan-500",
    createdAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "usr-billing-1",
    fullName: "Rachel Adams",
    email: "rachel@vancelegal.com",
    password: "Password123!",
    role: "BILLING_SPECIALIST",
    organizationName: "Vance & Associates Legal & Tax LLP",
    avatarColor: "from-emerald-600 to-teal-500",
    createdAt: "2026-09-05T00:00:00Z",
  },
  {
    id: "usr-associate-1",
    fullName: "David Ross, Esq.",
    email: "david@vancelegal.com",
    password: "Password123!",
    role: "ASSOCIATE",
    organizationName: "Vance & Associates Legal & Tax LLP",
    avatarColor: "from-blue-600 to-indigo-500",
    createdAt: "2026-09-10T00:00:00Z",
  },
  {
    id: "usr-client-1",
    fullName: "Marcus Sterling (Apex Horizon CFO)",
    email: "marcus@apexhorizon.com",
    password: "Password123!",
    role: "CLIENT_ADMIN",
    organizationName: "Apex Horizon Holdings LLC",
    avatarColor: "from-purple-600 to-pink-500",
    createdAt: "2026-09-15T00:00:00Z",
  },
];

/**
 * Retrieve all registered users from storage (or initialize with seeds)
 */
export function getAllUsers(): UserAccount[] {
  if (typeof window === "undefined") return SEED_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_USERS;
  } catch {
    return SEED_USERS;
  }
}

/**
 * Register a new user account with custom credentials set by the user
 */
export function registerUser(params: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  organizationName?: string;
}): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const normalizedEmail = params.email.trim().toLowerCase();

  // Validate email uniqueness
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return {
      success: false,
      error: "An account with this email address already exists. Please sign in instead.",
    };
  }

  // Generate random avatar gradient
  const gradients = [
    "from-indigo-600 to-cyan-500",
    "from-emerald-600 to-teal-500",
    "from-blue-600 to-indigo-500",
    "from-purple-600 to-pink-500",
    "from-amber-600 to-orange-500",
  ];
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  const newUser: UserAccount = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fullName: params.fullName.trim(),
    email: normalizedEmail,
    password: params.password,
    role: params.role,
    organizationName: params.organizationName?.trim() || "Lexicore Firm",
    avatarColor: randomGradient,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(newUser));
    } catch {
      // Ignore
    }
  }

  return { success: true, user: newUser };
}

/**
 * Authenticate a user by verifying their credentials
 */
export function loginUser(
  email: string,
  password: string
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    return {
      success: false,
      error: "No account found with this email. Please register or check your spelling.",
    };
  }

  if (found.password !== password) {
    return {
      success: false,
      error: "Incorrect password. Please try again.",
    };
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(found));
    } catch {
      // Ignore
    }
  }

  return { success: true, user: found };
}

/**
 * Retrieve the active user session
 */
export function getActiveUserSession(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
    if (!raw) {
      // Default to lead partner for convenience if no active session
      const defaultUser = SEED_USERS[0];
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_USERS[0];
  }
}

/**
 * Switch active user session directly
 */
export function setActiveUserSession(user: UserAccount): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(user));
  } catch {
    // Ignore
  }
}

/**
 * Terminate active user session (Logout)
 */
export function logoutUserSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
  } catch {
    // Ignore
  }
}
