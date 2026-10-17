# SPEC 03: API Data Contracts & Endpoints

## 1. Presigned Upload Endpoint
- **Route:** `POST /api/documents/presigned-url`
- **Auth:** Bearer Token (Authenticated Session)
- **Request Payload:**
```json
{
  "matterId": "string (uuid)",
  "filename": "string",
  "mimeType": "string (image/png | image/jpeg | application/pdf)",
  "fileSize": 10485760
}
```
- **Response Payload:**
```json
{
  "uploadUrl": "https://r2.cloudflarestorage.com/...",
  "fileKey": "tenants/tenant_id/matters/matter_id/uuid.pdf",
  "expiresInSeconds": 300
}
```

## 2. AI Pre-Flight Document Analysis Endpoint
- **Route:** `POST /api/documents/analyze`
- **Auth:** Bearer Token / Session
- **Request Payload:**
```json
{
  "fileBase64": "string (optional if fileKey supplied)",
  "fileKey": "string (optional)",
  "mimeType": "application/pdf",
  "expectedType": "Form W-2 | 1099-MISC | Operating Agreement | Articles of Incorporation"
}
```
- **Response Payload:**
```json
{
  "complianceStatus": "PASS | WARNING | REJECT",
  "detectedType": "string",
  "confidenceScore": 0.98,
  "mismatches": ["string (reasons if status is WARNING or REJECT)"],
  "extractedMetadata": {
    "taxYearOrEffectiveDate": "string",
    "issuingEntity": "string",
    "recipientName": "string",
    "maskedTaxId": "***-**-1234",
    "declaredAmounts": [
      { "label": "string", "amount": 0.00 }
    ]
  }
}
```
