import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"
import path from "path"
import fs from "fs/promises"

const patchSchema = z.object({
  verified: z.boolean().optional(),
  name: z.string().min(1).optional(),
  type: z
    .enum([
      "BILL_OF_LADING",
      "INSURANCE_CERTIFICATE",
      "QUALITY_CERTIFICATION",
      "COMMODITY_CONTRACT",
      "OTHER",
      "KYC_ID",
      "KYC_PROOF_OF_ADDRESS",
    ])
    .optional(),
})

export async function PATCH(request: NextRequest, context: { params: Promise<{ docId: string }> }) {
  const { docId } = await context.params
  if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 })

  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const body = await request.json()
  const validated = patchSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: "Invalid payload", details: validated.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.document.findUnique({ where: { id: docId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updates: any = {}
  if (validated.data.name !== undefined) updates.name = validated.data.name
  if (validated.data.type !== undefined) updates.type = validated.data.type

  if (validated.data.verified !== undefined) {
    if (validated.data.verified) {
      updates.verified = true
      updates.verifiedAt = new Date()
      updates.verifiedBy = gate.userId
    } else {
      updates.verified = false
      updates.verifiedAt = null
      updates.verifiedBy = null
    }
  }

  const updated = await prisma.document.update({
    where: { id: docId },
    data: updates,
  })

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "UPDATE_DOCUMENT",
      entityType: "Document",
      entityId: updated.id,
      changes: validated.data,
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      commodityId: updated.commodityId,
      userId: updated.userId,
      type: updated.type,
      name: updated.name,
      url: updated.url,
      mimeType: updated.mimeType,
      size: updated.size,
      verified: updated.verified,
      verifiedAt: updated.verifiedAt ? updated.verifiedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    },
  })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ docId: string }> }) {
  const { docId } = await context.params
  if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 })

  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const existing = await prisma.document.findUnique({ where: { id: docId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.document.delete({ where: { id: docId } })

  // Best-effort delete of locally stored files (dev-friendly).
  // In production you'd use S3 (or similar) and delete there.
  if (existing.url.startsWith("/uploads/")) {
    const publicPath = path.join(process.cwd(), "public", existing.url.replaceAll("/", path.sep))
    await fs.unlink(publicPath).catch(() => null)
  }

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "DELETE_DOCUMENT",
      entityType: "Document",
      entityId: existing.id,
      changes: { url: existing.url, name: existing.name, type: existing.type, commodityId: existing.commodityId },
    },
  })

  return NextResponse.json({ success: true })
}


