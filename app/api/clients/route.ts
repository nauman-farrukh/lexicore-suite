import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, MatterType, MatterStatus, InvoiceStatus } from "@prisma/client";

export async function GET() {
  try {
    const clients = await prisma.clientProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            status: true,
          },
        },
        matters: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            matterNumber: true,
            title: true,
            matterType: true,
            status: true,
          },
        },
      },
      take: 20,
    });

    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    console.error("Failed to query clients:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to query clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clientName,
      clientEmail,
      matterTitle,
      matterType = "TAX",
      invoiceNumber,
      totalDue,
    } = body;

    if (!clientName || !clientEmail) {
      return NextResponse.json(
        { success: false, error: "clientName and clientEmail are required." },
        { status: 400 }
      );
    }

    // 1. Locate default firm tenant
    let tenant = await prisma.tenant.findFirst({
      where: { subdomain: "alpha-tax-legal" },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: "Lexicore Legal & Accounting LLP",
          subdomain: "alpha-tax-legal",
          plan: "ENTERPRISE",
        },
      });
    }

    // 2. Locate or create partner user for lead assignment
    let partner = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: UserRole.MANAGING_PARTNER },
    });

    if (!partner) {
      partner = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: "partner@lexicore.com",
          fullName: "Eleanor Vance, Esq., CPA",
          role: UserRole.MANAGING_PARTNER,
          staffProfile: {
            create: {
              title: "Managing Tax Partner",
              licenseNumber: "CPA-789012",
              practiceArea: "Corporate Tax & Compliance",
              billableRate: 450.0,
            },
          },
        },
      });
    }

    // 3. Upsert Client User
    const clientUser = await prisma.user.upsert({
      where: { email: clientEmail },
      update: {
        fullName: clientName,
      },
      create: {
        tenantId: tenant.id,
        email: clientEmail,
        fullName: clientName,
        role: UserRole.CLIENT_USER,
        status: "ACTIVE",
      },
    });

    // 4. Upsert Client Profile
    let clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: clientUser.id },
    });

    if (!clientProfile) {
      clientProfile = await prisma.clientProfile.create({
        data: {
          userId: clientUser.id,
          companyName: clientName,
          entityType: "LLC",
        },
      });
    } else {
      clientProfile = await prisma.clientProfile.update({
        where: { id: clientProfile.id },
        data: { companyName: clientName },
      });
    }

    // 5. Create or connect Matter
    const resolvedMatterType: MatterType =
      matterType === "LEGAL" ? MatterType.LEGAL :
      matterType === "ACCOUNTING" ? MatterType.ACCOUNTING :
      MatterType.TAX;

    let matter = null;
    if (matterTitle) {
      matter = await prisma.matter.create({
        data: {
          tenantId: tenant.id,
          clientId: clientProfile.id,
          leadPartnerId: partner.id,
          matterNumber: `MAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          title: matterTitle,
          matterType: resolvedMatterType,
          status: MatterStatus.UNDER_REVIEW,
        },
      });
    }

    // 6. Create Invoice if provided
    let invoice = null;
    if (invoiceNumber && matter) {
      invoice = await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          matterId: matter.id,
          clientId: clientProfile.id,
          invoiceNumber: invoiceNumber,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: Number(totalDue) || 0,
          taxAmount: 0,
          totalDue: Number(totalDue) || 0,
          status: InvoiceStatus.DRAFT,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Client "${clientName}" saved successfully to Lexicore Portal & Cloud Neon PostgreSQL database.`,
      client: {
        id: clientUser.id,
        name: clientName,
        email: clientEmail,
        companyName: clientProfile.companyName,
      },
      matter: matter ? { id: matter.id, number: matter.matterNumber, title: matter.title } : null,
      invoice: invoice ? { id: invoice.id, invoiceNumber: invoice.invoiceNumber } : null,
    });
  } catch (error: any) {
    console.error("Failed to save client:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save client" },
      { status: 500 }
    );
  }
}
