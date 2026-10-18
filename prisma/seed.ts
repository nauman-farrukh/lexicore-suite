import { PrismaClient, UserRole, MatterType, MatterStatus, ChecklistStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Firm Tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'alpha-tax-legal' },
    update: {},
    create: {
      name: 'Alpha Tax & Legal Advisors',
      subdomain: 'alpha-tax-legal',
    },
  });

  // 2. Create Firm Staff (Managing Partner)
  const partner = await prisma.user.upsert({
    where: { email: 'partner@alphataxlegal.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'partner@alphataxlegal.com',
      role: UserRole.MANAGING_PARTNER,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          billableRate: 350.0,
          licenseNumber: 'CPA-789012',
          practiceArea: 'Corporate Tax & Compliance',
        },
      },
    },
  });

  // 3. Create Sample Client Profile
  const clientUser = await prisma.user.upsert({
    where: { email: 'john@acmecorp.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'john@acmecorp.com',
      role: UserRole.CLIENT_ADMIN,
      status: 'ACTIVE',
      clientProfile: {
        create: {
          companyName: 'Acme Logistics LLC',
          entityType: 'LLC',
          billingAddress: '100 Market St, Suite 400',
        },
      },
    },
  });

  const clientProfile = await prisma.clientProfile.findFirst({
    where: { userId: clientUser.id },
  });

  // 4. Create Active Matter
  let matter = await prisma.matter.findFirst({
    where: { tenantId: tenant.id, title: '2025 Corporate Tax Filing & Operating Agreement Review' },
  });

  if (!matter) {
    matter = await prisma.matter.create({
      data: {
        tenantId: tenant.id,
        clientId: clientProfile!.id,
        leadPartnerId: partner.id,
        title: '2025 Corporate Tax Filing & Operating Agreement Review',
        matterType: MatterType.TAX,
        status: MatterStatus.INTAKE_PENDING,
        checklistItems: {
          create: [
            {
              tenantId: tenant.id,
              title: '2024 Form 1120-S Prior Year Return',
              requiredDocType: 'Tax Return',
              status: ChecklistStatus.VERIFIED,
            },
            {
              tenantId: tenant.id,
              title: 'Q4 Profit & Loss Statement',
              requiredDocType: 'Financial Statement',
              status: ChecklistStatus.PENDING,
            },
            {
              tenantId: tenant.id,
              title: 'Draft Operating Agreement Amendment',
              requiredDocType: 'Legal Contract',
              status: ChecklistStatus.PENDING,
            },
          ],
        },
      },
    });
  }

  // 5. Initialize IOLTA Trust Account
  await prisma.trustAccount.upsert({
    where: { clientId: clientProfile!.id },
    update: { currentBalance: 5000.0 },
    create: {
      tenantId: tenant.id,
      clientId: clientProfile!.id,
      currentBalance: 5000.0, // Retainer on deposit
    },
  });

  console.log('Database seeded successfully with default firm data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
