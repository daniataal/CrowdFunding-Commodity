import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().max(50).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  twoFactorEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  investmentAlerts: z.boolean().optional(),
  marketUpdates: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  currency: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      kycStatus: true,
      avatar: true,
      phone: true,
      company: true,
      bio: true,
      twoFactorEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      investmentAlerts: true,
      marketUpdates: true,
      weeklyReport: true,
      currency: true,
      timezone: true,
      language: true,
    },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: user })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const validated = updateProfileSchema.parse(body)

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(validated.name !== undefined ? { name: validated.name } : {}),
      ...(validated.phone !== undefined ? { phone: validated.phone } : {}),
      ...(validated.company !== undefined ? { company: validated.company } : {}),
      ...(validated.bio !== undefined ? { bio: validated.bio } : {}),
      ...(validated.twoFactorEnabled !== undefined ? { twoFactorEnabled: validated.twoFactorEnabled } : {}),
      ...(validated.emailNotifications !== undefined ? { emailNotifications: validated.emailNotifications } : {}),
      ...(validated.pushNotifications !== undefined ? { pushNotifications: validated.pushNotifications } : {}),
      ...(validated.investmentAlerts !== undefined ? { investmentAlerts: validated.investmentAlerts } : {}),
      ...(validated.marketUpdates !== undefined ? { marketUpdates: validated.marketUpdates } : {}),
      ...(validated.weeklyReport !== undefined ? { weeklyReport: validated.weeklyReport } : {}),
      ...(validated.currency !== undefined ? { currency: validated.currency } : {}),
      ...(validated.timezone !== undefined ? { timezone: validated.timezone } : {}),
      ...(validated.language !== undefined ? { language: validated.language } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      kycStatus: true,
      avatar: true,
      phone: true,
      company: true,
      bio: true,
      twoFactorEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      investmentAlerts: true,
      marketUpdates: true,
      weeklyReport: true,
      currency: true,
      timezone: true,
      language: true,
    },
  })

  return NextResponse.json({ success: true, data: updated })
}


