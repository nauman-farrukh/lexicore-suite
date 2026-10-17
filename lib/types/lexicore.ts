export type UserRole =
  | "MANAGING_PARTNER"
  | "PARTNER"
  | "ASSOCIATE"
  | "PARALEGAL"
  | "BILLING_SPECIALIST"
  | "CLIENT_ADMIN"
  | "CLIENT_USER";

export type MatterType = "TAX" | "ACCOUNTING" | "LEGAL";

export type MatterStatus =
  | "INTAKE_PENDING"
  | "UNDER_REVIEW"
  | "DRAFTING"
  | "PARTNER_SIGNOFF"
  | "COMPLETED"
  | "ARCHIVED";

export type ChecklistStatus = "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";

export type PaperSize = "Letter" | "Legal" | "A4";

export interface PrinterInfo {
  name: string;
  is_default: boolean;
  status: string;
  port_name?: string | null;
  driver_name?: string | null;
  is_network: boolean;
}

export interface PrintPdfOptions {
  pdf_base64: string;
  printer_name?: string | null;
  job_name?: string;
  paper_size?: PaperSize;
  copies?: number;
  duplex?: "Simplex" | "DuplexNoTumble" | "DuplexTumble";
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: "SERVICE" | "EXPENSE" | "FILING_FEE";
  hours?: number; // 0.1 hr increments (6 minutes)
  rate?: number;  // Hourly rate
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  matterTitle: string;
  matterType: MatterType;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  trustRetainerAvailable: number;
  trustRetainerApplied: number;
  totalDue: number;
  notes?: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "ISSUED" | "PAID";
}

export interface DeclaredAmount {
  label: string;
  amount: number;
}

export interface ExtractedMetadata {
  taxYearOrEffectiveDate?: string | null;
  issuingEntity?: string | null;
  recipientName?: string | null;
  maskedTaxId?: string | null;
  declaredAmounts?: DeclaredAmount[];
}

export interface DocumentAnalysisResult {
  complianceStatus: "PASS" | "WARNING" | "REJECT";
  detectedType: string;
  confidenceScore: number;
  mismatches: string[];
  extractedMetadata: ExtractedMetadata;
  // Aliases for UI flexibility
  documentTypeDetected?: string;
  isExpectedMatch?: boolean;
  taxYearOrDate?: string | null;
  issuingEntity?: string | null;
  recipientName?: string | null;
  maskedTinOrSsn?: string | null;
  validationNotes?: string[];
}
