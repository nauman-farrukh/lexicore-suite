# SPEC 01: Core Domain Entities & Ledger Schema

## 1. Multi-Tenancy Invariant
- Every entity table (except global system metadata) MUST include a non-nullable `tenantId: String` foreign key.
- Compound indexes MUST enforce tenant isolation: `@@index([tenantId])`.

## 2. Entities & Field Definitions

### Tenant
- `id: UUID` (Primary Key)
- `name: String` (Firm Name)
- `subdomain: String` (Unique, lowercase alphanumeric)
- `createdAt: DateTime`, `updatedAt: DateTime`

### User
- `id: UUID` (Matches Supabase `auth.users.id`)
- `tenantId: UUID` (FK -> Tenant)
- `email: String` (Unique per tenant)
- `role: UserRole` (MANAGING_PARTNER | PARTNER | ASSOCIATE | PARALEGAL | BILLING_SPECIALIST | CLIENT_ADMIN | CLIENT_USER)
- `status: UserStatus` (ACTIVE | SUSPENDED | INVITED)
- `mfaEnabled: Boolean` (Default: false)

### Matter
- `id: UUID`
- `tenantId: UUID`
- `clientId: UUID` (FK -> ClientProfile)
- `leadPartnerId: UUID` (FK -> User)
- `title: String`
- `matterType: MatterType` (TAX | ACCOUNTING | LEGAL)
- `status: MatterStatus` (INTAKE_PENDING | UNDER_REVIEW | DRAFTING | PARTNER_SIGNOFF | COMPLETED | ARCHIVED)

### TrustAccount (IOLTA Compliant)
- `id: UUID`
- `tenantId: UUID`
- `clientId: UUID` (Unique FK -> ClientProfile)
- `currentBalance: Decimal(12, 2)` (CHECK constraint: currentBalance >= 0.00)
- Invariant: Direct mutations of `currentBalance` are prohibited; updates MUST calculate the sum of linked `TrustTransaction` rows.

### TrustTransaction
- `id: UUID`
- `trustAccountId: UUID` (FK -> TrustAccount)
- `matterId: UUID?` (FK -> Matter, Optional)
- `amount: Decimal(12, 2)` (Positive for deposits; negative for disbursements)
- `type: TrustTxType` (DEPOSIT | DISBURSEMENT_TO_OPERATING | REFUND)
- `referenceNumber: String` (Check #, Wire ID)
- `approvedById: UUID` (FK -> User)
- `createdAt: DateTime` (Immutable: No update or delete allowed)

### Document & Vector
- `id: UUID`
- `tenantId: UUID`
- `matterId: UUID` (FK -> Matter)
- `r2FileKey: String` (Encrypted object key)
- `mimeType: String`
- `fileSize: Int` (Bytes)
- `extractedText: String?` (Text extracted by OCR/Gemini)
- `verificationStatus: DocStatus` (PENDING | VERIFIED | REJECTED)
- `embedding: vector(768)` (Generated via text-embedding-004)
