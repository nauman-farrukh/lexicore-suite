# Lexicore Suite — Law, Tax & Accounting SaaS Platform

> **Production-ready, zero-cost-first web & desktop platform tailored to Law and Accounting practices, with deep native desktop hardware integration for local printers, AI pre-flight document auditing, and strict IOLTA trust escrow accounting.**

---

## 🔑 Included 3-Month SaaS License Credentials

Your installation includes a pre-configured, valid **3-Month SaaS Enterprise License Key**:

- **License Key:** `LEXI-SAAS-2026-90D-88F4-A92B-4E1C`
- **Plan Tier:** `Enterprise Partner (SaaS)`
- **Duration:** 90 Days (Valid through **December 27, 2026**)
- **Allocated Seats:** Unlimited Firm Staff & External Clients
- **Modules Enabled:**
  - AI Document Pre-Flight Inspection (Gemini 2.5 Flash)
  - Strict IOLTA Double-Entry Trust Accounting Ledger
  - Tauri 2.0 Native Hardware & Physical Printer Spooler
  - Client Matter Pipeline & E2EE Privileged Messaging
  - Spreadsheet-Parity Financial Controls & Excel (.xlsx) Exports

*(Backup License Key: `LEXI-SAAS-2026-90D-77A1-C34E-990F`)*

---

## 👥 Multi-User Authentication & Role System

Users can **Set Custom Credentials** by clicking **"Create Account"** or sign in with pre-seeded role accounts to test firm workflows immediately:

| Role | Name | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **MANAGING_PARTNER** | Eleanor Vance, Esq., CPA | `eleanor@vancelegal.com` | `Password123!` | Full administrative control, billing, IOLTA ledger, team oversight |
| **BILLING_SPECIALIST**| Rachel Adams | `rachel@vancelegal.com` | `Password123!` | IOLTA trust escrow accounting, invoice generation, physical printing |
| **ASSOCIATE** | David Ross, Esq. | `david@vancelegal.com` | `Password123!` | Case execution, billable time entry (0.1h), legal drafting |
| **CLIENT_ADMIN** | Marcus Sterling (CFO) | `marcus@apexhorizon.com` | `Password123!` | Client Portal, document uploads, invoice review & payment |

*To set new custom credentials:* Click **"Create Account"** in the top navigation bar, enter your Full Name, Work Email, Password, and select from 7 firm and client roles.

## ⚡ Quickstart Guide

### Prerequisites
- **Node.js**: v20 or v24+
- **Rust / Cargo**: Optional, only required for compiling the native Tauri 2.0 desktop shell
- **PostgreSQL**: With `pgvector` extension enabled (available on Supabase or Neon free tiers)

### 1. Installation
Extract the zip file, enter the directory, and install dependencies:
```bash
cd lexicore-suite
npm install --legacy-peer-deps
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your PostgreSQL connection string and Gemini API key (free at [Google AI Studio](https://aistudio.google.com/)).

### 3. Database Initialization
Generate Prisma client and push the schema to your database:
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Web Application
```bash
npm run dev
```
Open your browser at **[http://localhost:3000](http://localhost:3000)** and activate with your 3-Month SaaS License Key.

### 5. Run as Desktop Application (Tauri 2.0)
```bash
npm run tauri dev
```
This enables the native Rust hardware bridge, allowing silent batch printing directly to local office laser, thermal, and multifunction printers without OS dialog interruptions.

### 6. Deploy to GitHub & Vercel

#### A. Push to GitHub
1. Create a new empty repository on [GitHub](https://github.com/new) (e.g. `lexicore-suite`).
2. Link your local repository and push:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/lexicore-suite.git
git branch -M main
git push -u origin main
```

#### B. Deploy to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** and select **Import Git Repository** (`lexicore-suite`).
3. Set the Environment Variables under **Settings > Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string (Supabase or Neon).
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (e.g., `https://lexicore-suite.vercel.app`).
4. Click **Deploy**. Vercel will automatically run `prisma generate` and `next build` based on `vercel.json`.

---

## 🏛️ System Architecture

### 1. Frontend & Client Portal (`app/`, `components/`)
- **React 19 & Next.js 15 (App Router)** with Tailwind CSS dark obsidian AI theme.
- **Matter Neural Pipeline**: 5-stage visual progress tracker (`Intake & Docs Pending` → `Under Legal/Tax Review` → `Drafting/Preparation` → `Partner Sign-off` → `Filed / Completed`).
- **Encrypted Messaging**: Real-time privileged attorney-client case communications.

### 2. Physical Hardware Spooler (`src-tauri/`)
- Native Rust commands (`src-tauri/src/printer.rs`) supporting GDI rasterization (`PDFtoPrinter.exe`, `SumatraPDF.exe`, or Windows PowerShell GDI `PrintTo` verb fallback, and `lp` on macOS/Linux).
- Avoids raw PostScript byte corruption on standard non-PostScript office printers.
- Supports both **Direct/Silent Batch Printing** and **Interactive OS Dialogs** with paper format selection (`Letter` 8.5×11 vs. `Legal` 8.5×14).

### 3. Strict IOLTA Double-Entry Ledger (`prisma/schema.prisma`)
- Immutable `TrustAccount` and `TrustTransaction` models with `@db.Decimal(12, 2)` precision.
- Enforces strict trust accounting rules preventing commingling and overdrafts of unearned client retainer deposits.

### 4. AI Document Pre-Flight Auditing (`app/api/documents/analyze/route.ts`)
- Powered by `@google/genai` utilizing `gemini-2.5-flash`.
- Automatically inspects client uploads, cross-references checklists, and flags mismatches (e.g., insurance policy uploaded instead of Form W-2) before staff review.
- Extracts masked identifiers (`***-**-1234`) and issuing authorities.

---

## 📦 Handover Manifest & Structure

```
lexicore-suite/
├── app/
│   ├── api/documents/analyze/route.ts   # Gemini 2.5 Flash multimodal pre-flight route
│   ├── globals.css                      # AI software styling & ambient glows
│   ├── layout.tsx                       # Dark mode shell & metadata
│   └── page.tsx                         # Main dashboard with LicenseGate wrapper
├── components/
│   ├── auth/LicenseGate.tsx             # 3-Month SaaS license activation modal
│   ├── billing/InvoiceGenerator.tsx     # Financial terminal & hardware print engine
│   └── portal/ClientStatusTracker.tsx   # 5-stage matter pipeline & checklist
├── lib/
│   ├── hooks/usePrinter.ts              # Tauri hardware & browser print hook
│   ├── license/licenseValidator.ts      # SaaS license verification & storage
│   └── types/lexicore.ts                # TypeScript domain contracts
├── prisma/
│   └── schema.prisma                    # PostgreSQL + pgvector schema & IOLTA ledger
├── src-tauri/
│   ├── capabilities/default.json        # Tauri v2 capability permissions
│   ├── Cargo.toml                       # Rust dependencies
│   ├── tauri.conf.json                  # Desktop window specifications
│   └── src/
│       ├── lib.rs                       # Tauri 2 command registration
│       ├── main.rs                      # Desktop binary entrypoint
│       └── printer.rs                   # Robust cross-platform printer spooler
├── .env.example                         # Environment configuration template
├── package.json                         # Dependencies & scripts
├── tailwind.config.ts                   # Cyber/AI theme configuration
├── postcss.config.mjs                   # PostCSS plugins
├── tsconfig.json                        # TypeScript configuration
└── next.config.mjs                      # Next.js 50MB payload limits
```

---

## ⚖️ License & Ownership
Created for client deployment. All proprietary intellectual property, code assets, and database schemas belong to your organization.
