import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"
import path from "path"
import fs from "fs/promises"

const createSchema = z.object({
  type: z.enum([
    "BILL_OF_LADING",
    "INSURANCE_CERTIFICATE",
    "QUALITY_CERTIFICATION",
    "COMMODITY_CONTRACT",
    "OTHER",
  ]),
  name: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
})

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").replace(/\s+/g, " ").trim()
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const gate = await requireDbRole(["ADMIN", "AUDITOR"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const docs = await prisma.document.findMany({
    where: { commodityId: id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    success: true,
    data: docs.map((d) => ({
      id: d.id,
      commodityId: d.commodityId,
      userId: d.userId,
      type: d.type,
      name: d.name,
      url: d.url,
      mimeType: d.mimeType,
      size: d.size,
      verified: d.verified,
      verifiedAt: d.verifiedAt ? d.verifiedAt.toISOString() : null,
      createdAt: d.createdAt.toISOString(),
    })),
  })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  const type = String(formData.get("type") ?? "")
  const name = formData.get("name") ? String(formData.get("name")) : undefined
  const url = formData.get("url") ? String(formData.get("url")) : undefined

  const parsed = createSchema.safeParse({ type, name, url })
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
  }

  let finalUrl = parsed.data.url
  let finalName = parsed.data.name
  let mimeType: string | undefined = undefined
  let size: number | undefined = undefined

  if (file) {
    const safeOriginal = sanitizeFilename(file.name || "document")
    const ts = Date.now()
    const storedName = `${ts}-${safeOriginal}`

    const dir = path.join(process.cwd(), "public", "uploads", "commodities", id)
    await fs.mkdir(dir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await fs.writeFile(path.join(dir, storedName), Buffer.from(bytes))

    finalUrl = `/uploads/commodities/${id}/${storedName}`
    finalName = finalName || safeOriginal
    mimeType = file.type || undefined
    size = file.size || undefined
  }

  if (!finalUrl) {
    return NextResponse.json({ error: "Provide either a file or a URL" }, { status: 400 })
  }

  const created = await prisma.document.create({
    data: {
      commodityId: id,
      type: parsed.data.type,
      name: finalName || "Document",
      url: finalUrl,
      mimeType,
      size,
      verified: false,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "CREATE_DOCUMENT",
      entityType: "Document",
      entityId: created.id,
      changes: {
        commodityId: id,
        type: created.type,
        name: created.name,
        url: created.url,
      },
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      id: created.id,
      commodityId: created.commodityId,
      userId: created.userId,
      type: created.type,
      name: created.name,
      url: created.url,
      mimeType: created.mimeType,
      size: created.size,
      verified: created.verified,
      verifiedAt: created.verifiedAt ? created.verifiedAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
    },
  })
}


