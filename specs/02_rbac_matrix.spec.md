# SPEC 02: Role-Based Access Control (RBAC) Matrix

## 1. Access Matrix

| Resource / Action | Managing Partner | Partner | Associate | Paralegal | Billing Specialist | Client Admin | Client User |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Firm Settings & Staff** | R/W | — | — | — | — | — | — |
| **View Firm Financial Analytics** | R/W | R (Assigned) | — | — | R | — | — |
| **Create/Assign Matters** | R/W | R/W | — | — | — | — | — |
| **Read Assigned Matter Docs** | R/W | R/W | R/W | R/W | R (Billing only) | R (Own Org) | R (Own File) |
| **Execute AI Pre-Flight Analysis**| R/W | R/W | R/W | R/W | — | Trigger Only | Trigger Only |
| **Create/Approve Invoices** | Approve | Approve | Draft | — | Draft/Generate | Pay/Dispute | Pay/Dispute |
| **Disburse IOLTA Trust Funds** | Approve | Approve | — | — | Review Only | — | — |
| **Trigger Hardware Printing** | Yes | Yes | Yes | Yes | Yes | No | No |

## 2. Enforcement Rules
- Enforcement occurs at both Next.js Middleware/API Route Handler level and PostgreSQL Row-Level Security (RLS).
- Clients cannot access raw internal matter notes, partner rate multipliers, or other clients' folders.
