import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import path from "path"
import fs from "fs/promises"

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").replace(/\s+/g, " ").trim()
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const idDocument = formData.get("idDocument") as File
    const addressDocument = formData.get("addressDocument") as File

    if (!idDocument || !addressDocument) {
      return NextResponse.json({ error: "Both documents are required" }, { status: 400 })
    }

    // Dev-friendly local storage under /public/uploads/kyc/<userId>/...
    // In production you'd upload to S3 (or similar) and store the resulting URLs.
    const userDir = path.join(process.cwd(), "public", "uploads", "kyc", session.user.id)
    await fs.mkdir(userDir, { recursive: true })

    const ts = Date.now()
    const idSafe = sanitizeFilename(idDocument.name || "id-document")
    const addressSafe = sanitizeFilename(addressDocument.name || "address-document")

    const idStored = `${ts}-id-${idSafe}`
    const addressStored = `${ts}-address-${addressSafe}`

    const idBytes = await idDocument.arrayBuffer()
    await fs.writeFile(path.join(userDir, idStored), Buffer.from(idBytes))

    const addressBytes = await addressDocument.arrayBuffer()
    await fs.writeFile(path.join(userDir, addressStored), Buffer.from(addressBytes))

    const idUrl = `/uploads/kyc/${session.user.id}/${idStored}`
    const addressUrl = `/uploads/kyc/${session.user.id}/${addressStored}`

    const idDocumentRecord = await prisma.document.create({
      data: {
        userId: session.user.id,
        type: "KYC_ID",
        name: idDocument.name,
        url: idUrl,
        mimeType: idDocument.type,
        size: idDocument.size,
        verified: false,
      },
    })

    const addressDocumentRecord = await prisma.document.create({
      data: {
        userId: session.user.id,
        type: "KYC_PROOF_OF_ADDRESS",
        name: addressDocument.name,
        url: addressUrl,
        mimeType: addressDocument.type,
        size: addressDocument.size,
        verified: false,
      },
    })

    // Update user KYC status to PENDING
    await prisma.user.update({
      where: { id: session.user.id },
      data: { kycStatus: "PENDING" },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBMIT_KYC",
        entityType: "User",
        entityId: session.user.id,
        changes: {
          documents: [
            { id: idDocumentRecord.id, type: idDocumentRecord.type, url: idDocumentRecord.url },
            { id: addressDocumentRecord.id, type: addressDocumentRecord.type, url: addressDocumentRecord.url },
          ],
        },
      },
    })

    return NextResponse.json({
      message: "Documents uploaded successfully",
      documents: [idDocumentRecord.id, addressDocumentRecord.id],
    })
  } catch (error) {
    console.error("KYC upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

