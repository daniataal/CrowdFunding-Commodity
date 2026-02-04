import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function resetAdminPassword() {
    const newPassword = process.env.NEW_PASSWORD || "admin123"
    const email = process.env.ADMIN_EMAIL || "admin@example.com"

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const updated = await prisma.user.updateMany({
        where: {
            email: email,
            role: "ADMIN"
        },
        data: {
            passwordHash
        }
    })

    if (updated.count > 0) {
        console.log(`✓ Password reset for ${email}`)
        console.log(`  New password: ${newPassword}`)
    } else {
        console.log(`✗ No admin user found with email: ${email}`)
    }
}

resetAdminPassword()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
