import crypto from "node:crypto"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function generateTempPassword() {
  const raw = crypto.randomBytes(24).toString("base64url")
  return raw.slice(0, 16)
}

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com"
  const name = process.env.ADMIN_NAME || "Admin User"
  const password = process.env.ADMIN_PASSWORD || generateTempPassword()

  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (existingAdmin) {
    console.log(`[seed] Admin already exists: ${existingAdmin.email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const created = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      kycStatus: "APPROVED",
    },
  })

  console.log(`[seed] Created ADMIN: ${created.email}`)
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`[seed] Temporary password (copy now): ${password}`)
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


