import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"
import bcrypt from "bcryptjs"
import crypto from "crypto"

function safeNumber(val: string | null, fallback: number) {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

function generateTempPassword() {
  // 16 chars, URL-safe-ish, avoids ambiguous chars; admin will copy once.
  const raw = crypto.randomBytes(24).toString("base64url")
  return raw.slice(0, 16)
}

const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.enum(["USER", "ADMIN", "AUDITOR"]).optional(),
  kycStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "NOT_STARTED"]).optional(),
  disabled: z.enum(["true", "false"]).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
})

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["USER", "ADMIN", "AUDITOR"]).default("USER"),
  kycStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "NOT_STARTED"]).optional(),
  phone: z.string().trim().min(1).optional(),
  company: z.string().trim().min(1).optional(),
  password: z.string().min(8).optional(),
})

export async function GET(request: NextRequest) {
  const gate = await requireDbRole(["ADMIN", "AUDITOR"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const url = new URL(request.url)
  const parsed = listQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    kycStatus: url.searchParams.get("kycStatus") ?? undefined,
    disabled: url.searchParams.get("disabled") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 })
  }

  const page = Math.max(1, safeNumber(parsed.data.page ?? null, 1))
  const pageSize = Math.min(100, Math.max(5, safeNumber(parsed.data.pageSize ?? null, 20)))
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (parsed.data.q) {
    where.OR = [
      { name: { contains: parsed.data.q, mode: "insensitive" } },
      { email: { contains: parsed.data.q, mode: "insensitive" } },
      { id: { contains: parsed.data.q, mode: "insensitive" } },
    ]
  }
  if (parsed.data.role) where.role = parsed.data.role
  if (parsed.data.kycStatus) where.kycStatus = parsed.data.kycStatus
  if (parsed.data.disabled) where.disabled = parsed.data.disabled === "true"

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        _count: { select: { investments: true, transactions: true, documents: true } },
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    page,
    pageSize,
    total,
    data: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      kycStatus: u.kycStatus,
      walletBalance: Number(u.walletBalance),
      walletFrozen: (u as any).walletFrozen ?? false,
      walletFrozenAt: (u as any).walletFrozenAt ? new Date((u as any).walletFrozenAt).toISOString() : null,
      disabled: (u as any).disabled ?? false,
      disabledAt: (u as any).disabledAt ? new Date((u as any).disabledAt).toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      _count: u._count,
    })),
  })
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireDbRole(["ADMIN"])
    if (!gate.ok) {
      return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
    }

    const body = await request.json()
    const validated = createUserSchema.parse(body)

    const tempPassword = validated.password ?? generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const created = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        role: validated.role,
        kycStatus: validated.kycStatus,
        phone: validated.phone,
        company: validated.company,
        passwordHash,
      },
      include: {
        _count: { select: { investments: true, transactions: true, documents: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: gate.userId,
        action: "CREATE_USER",
        entityType: "User",
        entityId: created.id,
        changes: {
          email: created.email,
          name: created.name,
          role: created.role,
          kycStatus: created.kycStatus,
          phone: created.phone,
          company: created.company,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role,
          kycStatus: created.kycStatus,
          walletBalance: Number(created.walletBalance),
          disabled: (created as any).disabled ?? false,
          disabledAt: (created as any).disabledAt ? new Date((created as any).disabledAt).toISOString() : null,
          createdAt: created.createdAt.toISOString(),
          _count: created._count,
        },
        tempPassword: validated.password ? null : tempPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


