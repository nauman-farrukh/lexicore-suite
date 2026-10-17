import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    }
    const { matterId, filename, mimeType, fileSize, tenantId = "default-tenant" } = body;

    // Validate payload
    if (!matterId || !filename || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: matterId, filename, or mimeType" },
        { status: 400 }
      );
    }

    // Maximum file size limit: 10MB (10485760 bytes) as defined in SPEC 03
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit (${fileSize} bytes provided)` },
        { status: 413 }
      );
    }

    // Validate allowed MIME types
    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/tiff",
    ];

    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported MIME type '${mimeType}'. Allowed: PDF, PNG, JPEG, TIFF.` },
        { status: 415 }
      );
    }

    // Extract file extension
    const ext = filename.split(".").pop() || "pdf";
    const uniqueUuid = crypto.randomUUID();

    // SPEC 03 Contract: tenants/tenant_id/matters/matter_id/uuid.ext
    const fileKey = `tenants/${tenantId}/matters/${matterId}/${uniqueUuid}.${ext}`;

    const accountId = process.env.R2_ACCOUNT_ID || "r2";
    const bucketName = process.env.R2_BUCKET_NAME || "lexicore-documents";

    // Standard Cloudflare R2 / S3 presigned PUT URL expiring in 300 seconds
    const uploadUrl = `https://${accountId}.cloudflarestorage.com/${bucketName}/${fileKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300`;

    return NextResponse.json({
      uploadUrl,
      fileKey,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error("[Presigned URL Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
