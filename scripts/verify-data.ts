
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("🔍 Starting Verification...")

    // 1. Verify Commodities
    const commodities = await prisma.commodity.findMany()
    console.log(`✅  Found ${commodities.length} Commodities`)
    if (commodities.length === 0) {
        console.error("❌  No commodities found. Did you run the seed?")
        process.exit(1)
    }

    // 2. Verify Admin
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
    if (!admin) {
        console.error("❌  Admin user not found.")
        process.exit(1)
    }
    console.log(`✅  Found Admin User: ${admin.email} (Wallet: $${admin.walletBalance})`)

    // 3. Simulate Investment (Direct DB Interaction)
    // We'll give the admin some money and invest in the first commodity.
    const targetCommodity = commodities.find(c => c.status === "FUNDING")
    if (!targetCommodity) {
        console.log("⚠️  No FUNDING commodity found to test investment.")
    } else {
        console.log(`Moved to test investment in: ${targetCommodity.name}`)

        // Credit Wallet
        await prisma.user.update({
            where: { id: admin.id },
            data: { walletBalance: { increment: 10000 } }
        })
        console.log("💰 Credited $10,000 to Admin Wallet")

        // Create Investment
        const amount = 5000
        const investment = await prisma.investment.create({
            data: {
                userId: admin.id,
                commodityId: targetCommodity.id,
                amount: amount,
                percentage: 0.1, // Dummy pct
                status: "ACTIVE",
                projectedReturn: amount * 1.12 // 12% dummy
            }
        })

        // Create Transaction
        await prisma.transaction.create({
            data: {
                userId: admin.id,
                commodityId: targetCommodity.id,
                type: "INVESTMENT",
                amount: amount,
                status: "COMPLETED",
                description: `Investment in ${targetCommodity.name}`
            }
        })

        // Update Commodity
        await prisma.commodity.update({
            where: { id: targetCommodity.id },
            data: { currentAmount: { increment: amount } }
        })

        console.log(`✅  Successfully created Investment of $${amount}`)

        // Verify Dashboard-like query
        const userInvestments = await prisma.investment.findMany({
            where: { userId: admin.id },
            include: { commodity: true }
        })
        console.log(`📊 Admin Portfolio: ${userInvestments.length} Active Investments`)
    }

    // 4. Verify Payment Methods (Billing)
    const paymentMethods = await prisma.paymentMethod.findMany({ where: { userId: admin.id } })
    console.log(`💳 Found ${paymentMethods.length} Payment Methods for Admin`)

    console.log("\n🎉 Verification Complete! The system is wired and data-ready.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
