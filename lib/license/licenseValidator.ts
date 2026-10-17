export interface LicenseInfo {
  key: string;
  tier: "STARTER" | "PROFESSIONAL" | "ENTERPRISE_SAAS";
  organizationName: string;
  adminEmail: string;
  issuedAt: string; // ISO date
  expiresAt: string; // ISO date
  status: "ACTIVE" | "EXPIRED" | "INVALID";
  daysRemaining: number;
  maxSeats: number;
  features: string[];
}

export const VALID_3_MONTH_LICENSE_KEYS: Record<
  string,
  {
    tier: "ENTERPRISE_SAAS";
    durationDays: number;
    maxSeats: number;
    features: string[];
  }
> = {
  // Official 3-Month Master SaaS Enterprise License Key
  "LEXI-SAAS-2026-90D-88F4-A92B-4E1C": {
    tier: "ENTERPRISE_SAAS",
    durationDays: 90,
    maxSeats: 999,
    features: [
      "Tax & Audit AI Copilot (Gemini 2.5 Flash)",
      "Strict IOLTA Trust Accounting Double-Entry Ledger",
      "Tauri 2.0 Native Hardware & Physical Printer Spooler",
      "Client Portal & Encrypted Legal Matter Pipelines",
      "Spreadsheet-Parity Ledger Controls & XLSX Exports",
      "Multi-Tenant PostgreSQL + pgvector RAG Indexing",
      "Priority 24/7 Enterprise Support",
    ],
  },
  // Additional backup 3-month key
  "LEXI-SAAS-2026-90D-77A1-C34E-990F": {
    tier: "ENTERPRISE_SAAS",
    durationDays: 90,
    maxSeats: 999,
    features: [
      "Full SaaS Enterprise Capabilities",
      "Unlimited Firm Staff & External Client Logins",
      "90-Day Unrestricted Access",
    ],
  },
};

const STORAGE_KEY_LICENSE = "lexicore_saas_license_session";

/**
 * Validate a license key and return structured subscription metadata
 */
export function validateLicenseKey(
  key: string,
  organizationName = "Apex Legal & Tax Advisory LLC",
  adminEmail = "partner@lexicore-firm.com"
): LicenseInfo {
  const cleanKey = key.trim().toUpperCase();

  // Check known master keys or valid pattern
  const predefined = VALID_3_MONTH_LICENSE_KEYS[cleanKey];

  // Base current reference timestamp (September 27, 2026)
  const now = new Date("2026-09-27T12:00:00Z");
  const issueDate = new Date("2026-09-27T00:00:00Z");
  const expiryDate = new Date("2026-12-27T23:59:59Z"); // Exactly 3 months (90 days)

  if (predefined || cleanKey.startsWith("LEXI-SAAS-2026-")) {
    const diffMs = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      key: cleanKey,
      tier: "ENTERPRISE_SAAS",
      organizationName,
      adminEmail,
      issuedAt: issueDate.toISOString(),
      expiresAt: expiryDate.toISOString(),
      status: daysRemaining > 0 ? "ACTIVE" : "EXPIRED",
      daysRemaining,
      maxSeats: predefined?.maxSeats || 50,
      features: predefined?.features || [
        "Full AI Law & Tax Capabilities",
        "Tauri 2.0 Hardware Spooler",
        "Strict IOLTA Escrow Ledger",
      ],
    };
  }

  // Invalid key fallback
  return {
    key: cleanKey,
    tier: "STARTER",
    organizationName,
    adminEmail,
    issuedAt: issueDate.toISOString(),
    expiresAt: issueDate.toISOString(),
    status: "INVALID",
    daysRemaining: 0,
    maxSeats: 0,
    features: [],
  };
}

/**
 * Save active license session to localStorage
 */
export function saveLicenseSession(license: LicenseInfo): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(license));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Retrieve active license session from localStorage
 */
export function getSavedLicenseSession(): LicenseInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LICENSE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear license session (Logout / Deactivate)
 */
export function clearLicenseSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_LICENSE);
  } catch {
    // Ignore
  }
}
