import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

    // In production, upload files to S3 or similar storage
    // For now, we'll just store metadata and update KYC status
    // TODO: Implement actual file upload to cloud storage

    // Convert files to base64 or upload to storage service
    // For mock implementation, we'll just update the database

    const idBuffer = await idDocument.arrayBuffer()
    const addressBuffer = await addressDocument.arrayBuffer()

    // In production, upload to S3 and get URLs
    // For now, we'll create document records with placeholder URLs
    const idDocumentRecord = await prisma.document.create({
      data: {
        userId: session.user.id,
        type: "KYC_ID",
        name: idDocument.name,
        url: `/uploads/kyc/${session.user.id}/id-${Date.now()}.${idDocument.name.split('.').pop()}`,
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
        url: `/uploads/kyc/${session.user.id}/address-${Date.now()}.${addressDocument.name.split('.').pop()}`,
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
          documents: [idDocumentRecord.id, addressDocumentRecord.id],
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

