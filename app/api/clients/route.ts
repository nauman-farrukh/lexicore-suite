import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, MatterType, MatterStatus, InvoiceStatus, LineItemCategory } from "@prisma/client";

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
          orderBy: { createdAt: "desc" },
          include: {
            invoices: {
              orderBy: { createdAt: "desc" },
              include: {
                lineItems: true,
              },
            },
            checklistItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
      issueDate,
      dueDate,
      lineItems = [],
      subtotal = 0,
      taxRate = 0,
      taxAmount = 0,
      trustRetainerApplied = 0,
      totalDue = 0,
    } = body;

    if (!clientName || !clientEmail) {
      return NextResponse.json(
        { success: false, error: "clientName and clientEmail are required." },
        { status: 400 }
      );
    }

    // 1. Locate or create default firm tenant
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
    const finalMatterTitle = matterTitle || `${clientName} Legal & Accounting Matter`;

    matter = await prisma.matter.findFirst({
      where: {
        clientId: clientProfile.id,
        title: finalMatterTitle,
      },
    });

    if (!matter) {
      matter = await prisma.matter.create({
        data: {
          tenantId: tenant.id,
          clientId: clientProfile.id,
          leadPartnerId: partner.id,
          matterNumber: `MAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          title: finalMatterTitle,
          matterType: resolvedMatterType,
          status: MatterStatus.UNDER_REVIEW,
        },
      });
    }

    // 6. Upsert Invoice and Line Items
    let invoice = null;
    if (invoiceNumber && matter) {
      const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const safeDueDate = isNaN(parsedDueDate.getTime()) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : parsedDueDate;

      // Clean line items payload
      const formattedLineItems = Array.isArray(lineItems)
        ? lineItems.map((item: any) => ({
            description: String(item.description || "Professional Services"),
            category:
              item.category === "EXPENSE"
                ? LineItemCategory.EXPENSE
                : item.category === "FILING_FEE"
                ? LineItemCategory.FILING_FEE
                : LineItemCategory.SERVICE,
            hours: item.hours !== undefined && item.hours !== null ? Number(item.hours) : null,
            rate: item.rate !== undefined && item.rate !== null ? Number(item.rate) : null,
            amount: Number(item.amount) || 0,
          }))
        : [];

      // Check if invoice already exists
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          tenantId: tenant.id,
          invoiceNumber: invoiceNumber,
        },
      });

      if (existingInvoice) {
        invoice = await prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            matterId: matter.id,
            clientId: clientProfile.id,
            dueDate: safeDueDate,
            subtotal: Number(subtotal) || 0,
            taxRate: Number(taxRate) || 0,
            taxAmount: Number(taxAmount) || 0,
            trustRetainerApplied: Number(trustRetainerApplied) || 0,
            totalDue: Number(totalDue) || 0,
          },
        });

        // Replace line items
        await prisma.invoiceLineItem.deleteMany({
          where: { invoiceId: existingInvoice.id },
        });

        if (formattedLineItems.length > 0) {
          await prisma.invoiceLineItem.createMany({
            data: formattedLineItems.map((li) => ({
              ...li,
              invoiceId: existingInvoice.id,
            })),
          });
        }
      } else {
        // Create new invoice with nested line items
        invoice = await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            matterId: matter.id,
            clientId: clientProfile.id,
            invoiceNumber: invoiceNumber,
            dueDate: safeDueDate,
            subtotal: Number(subtotal) || 0,
            taxRate: Number(taxRate) || 0,
            taxAmount: Number(taxAmount) || 0,
            trustRetainerApplied: Number(trustRetainerApplied) || 0,
            totalDue: Number(totalDue) || 0,
            status: InvoiceStatus.DRAFT,
            lineItems: {
              create: formattedLineItems,
            },
          },
          include: {
            lineItems: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Client "${clientName}" saved successfully with all line items to Neon PostgreSQL.`,
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
