
import crypto from "node:crypto"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function generateTempPassword() {
  const raw = crypto.randomBytes(24).toString("base64url")
  return raw.slice(0, 16)
}

function keySys(name) {
  return `sys:${name}`
}
function keyCommodity(commodityId, name) {
  return `com:${commodityId}:${name}`
}

async function getOrCreateSystemAccount(name, type, currency = "USD") {
  return prisma.ledgerAccount.upsert({
    where: { key: keySys(name) },
    create: { key: keySys(name), name, type, currency },
    update: {},
  })
}

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com"
  const name = process.env.ADMIN_NAME || "Admin User"
  const password = process.env.ADMIN_PASSWORD || generateTempPassword()

  // 1. Admin User
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 10)
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "ADMIN",
        kycStatus: "APPROVED",
        walletBalance: 0,
      },
    })
    console.log(`[seed] Created ADMIN: ${created.email}`)
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`[seed] Temporary password: ${password}`)
    }
  } else {
    console.log(`[seed] Admin exists: ${existingAdmin.email}`)
  }

  // 2. System Ledger Accounts
  await getOrCreateSystemAccount("Platform Cash", "ASSET")
  await getOrCreateSystemAccount("Platform Fee Income", "INCOME")
  await getOrCreateSystemAccount("Payout Expense", "EXPENSE")
  await getOrCreateSystemAccount("Admin Adjustments", "EXPENSE")
  console.log(`[seed] System ledger accounts created`)

  // 3. Commodities
  const commodities = [
    {
      name: "Gold Bullion (99.99%)",
      type: "Metals",
      risk: "Low",
      targetApy: 12.5,
      duration: 180,
      minInvestment: 5000,
      amountRequired: 2000000,
      currentAmount: 1450000, // Partial funding
      description: "High-grade gold bullion shipment from Switzerland to Singapore. Secured by Brinks.",
      origin: "Zurich, Switzerland",
      destination: "Singapore, SG",
      status: "FUNDING",
      transportMethod: "Air Freight",
      insuranceValue: 2000000,
      metalForm: "Bar",
      purityPercent: 99.99,
      karat: 24,
      grossWeightTroyOz: 1000,
      refineryName: "Valcambi",
      refineryLocation: "Balerna, Switzerland",
    },
    {
      name: "Copper Cathodes Grade A",
      type: "Metals",
      risk: "Medium",
      targetApy: 15.0,
      duration: 90,
      minInvestment: 2500,
      amountRequired: 500000,
      currentAmount: 500000,
      description: "LME Grade A Copper Cathodes shipping from Chile to China. Essential for EV manufacturing.",
      origin: "Antofagasta, Chile",
      destination: "Shanghai, China",
      status: "ACTIVE", // Funded
      transportMethod: "Sea Freight",
      insuranceValue: 550000,
      metalForm: "Cathode",
      purityPercent: 99.99,
      grossWeightTroyOz: 160000, // Approx 5 metric tonnes
    },
    {
      name: "Lithium Carbonate",
      type: "Energy",
      risk: "High",
      targetApy: 22.0,
      duration: 120,
      minInvestment: 1000,
      amountRequired: 800000,
      currentAmount: 800000,
      description: "Battery-grade Lithium Carbonate for top-tier EV battery producer.",
      origin: "Salar de Atacama, Chile",
      destination: "Seoul, South Korea",
      status: "IN_TRANSIT",
      transportMethod: "mixed",
      insuranceValue: 850000,
    },
    {
      name: "Soybean Bulk Shipment",
      type: "Agriculture",
      risk: "Medium",
      targetApy: 14.2,
      duration: 60,
      minInvestment: 5000,
      amountRequired: 1200000,
      currentAmount: 300000,
      description: "Non-GMO Soybeans bulk carrier shipment.",
      origin: "Santos, Brazil",
      destination: "Rotterdam, Netherlands",
      status: "FUNDING",
      transportMethod: "Sea Freight",
      insuranceValue: 1200000,
    },
    {
      name: "Brent Crude Oil",
      type: "Energy",
      risk: "Medium",
      targetApy: 18.5,
      duration: 45,
      minInvestment: 10000,
      amountRequired: 5000000,
      currentAmount: 5000000,
      description: "Standard Brent Crude shipment.",
      origin: "North Sea",
      destination: "Houston, USA",
      status: "ARRIVED",
      transportMethod: "Pipeline/Tanker",
      insuranceValue: 5000000,
    },
    {
      name: "Silver Bars (1000oz)",
      type: "Metals",
      risk: "Low",
      targetApy: 11.0,
      duration: 365,
      minInvestment: 2000,
      amountRequired: 750000,
      currentAmount: 100000,
      description: "Investment grade silver bars.",
      origin: "Mexico City, Mexico",
      destination: "London, UK",
      status: "FUNDING",
      metalForm: "Bar",
      purityPercent: 99.9,
    },
    {
      name: "Corn Futures backed",
      type: "Agriculture",
      risk: "Low",
      targetApy: 9.5,
      duration: 180,
      minInvestment: 1000,
      amountRequired: 300000,
      currentAmount: 300000,
      description: "US Corn harvest shipment.",
      origin: "Iowa, USA",
      destination: "Tokyo, Japan",
      status: "SETTLED", // Completed
      transportMethod: "Sea Freight",
      insuranceValue: 300000,
    },
  ]

  for (const c of commodities) {
    // Check duplication by name
    const existing = await prisma.commodity.findFirst({ where: { name: c.name } })
    if (existing) continue

    const commodity = await prisma.commodity.create({
      data: {
        ...c,
        icon: c.type === "Metals" ? "Pickaxe" : c.type === "Energy" ? "Zap" : "Sprout", // Simplified icon mapping
      },
    })

    // Create Escrow Account for Commodity
    await prisma.ledgerAccount.create({
      data: {
        key: keyCommodity(commodity.id, "escrow"),
        name: "Escrow",
        type: "LIABILITY",
        currency: "USD",
        commodityId: commodity.id,
      },
    })

    // Add Mock Documents
    await prisma.document.createMany({
      data: [
        {
          commodityId: commodity.id,
          type: "BILL_OF_LADING",
          name: "BillOfLading.pdf",
          url: "https://example.com/bol.pdf",
          verified: true,
          verifiedAt: new Date(),
        },
        {
          commodityId: commodity.id,
          type: "INSURANCE_CERTIFICATE",
          name: "InsuranceCert.pdf",
          url: "https://example.com/insurance.pdf",
          verified: true,
          verifiedAt: new Date(),
        },
        {
          commodityId: commodity.id,
          type: "QUALITY_CERTIFICATION",
          name: "AssayReport.pdf",
          url: "https://example.com/assay.pdf",
          verified: true,
          verifiedAt: new Date(),
        },
      ],
    })

    // Add Shipment Events if ACTIVE or later
    if (["ACTIVE", "IN_TRANSIT", "ARRIVED", "SETTLED"].includes(c.status)) {
      await prisma.shipmentEvent.create({
        data: {
          commodityId: commodity.id,
          type: "DEPARTED",
          occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
          description: `Shipment departed from ${c.origin}`,
        }
      })
    }
    if (["IN_TRANSIT", "ARRIVED", "SETTLED"].includes(c.status)) {
      await prisma.shipmentEvent.create({
        data: {
          commodityId: commodity.id,
          type: "IN_TRANSIT",
          occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
          description: `Customs clearance in progress at transit port.`,
        }
      })
    }
    if (["ARRIVED", "SETTLED"].includes(c.status)) {
      await prisma.shipmentEvent.create({
        data: {
          commodityId: commodity.id,
          type: "ARRIVED",
          occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
          description: `Shipment arrived at ${c.destination}`,
        }
      })
    }

    console.log(`[seed] Created Commodity: ${c.name} (${c.status})`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
