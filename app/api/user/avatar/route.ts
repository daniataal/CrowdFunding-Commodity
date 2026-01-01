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
    const avatar = formData.get("avatar")

    if (!avatar || !(avatar instanceof File)) {
      return NextResponse.json({ error: "Avatar file is required" }, { status: 400 })
    }

    if (!avatar.type.startsWith("image/")) {
      return NextResponse.json({ error: "Avatar must be an image" }, { status: 400 })
    }

    const maxBytes = 2 * 1024 * 1024
    if (avatar.size > maxBytes) {
      return NextResponse.json({ error: "Avatar must be less than 2MB" }, { status: 400 })
    }

    // Dev-friendly local storage under /public/uploads/avatars/<userId>/...
    // In production you'd upload to S3 (or similar) and store the resulting URL.
    const userDir = path.join(process.cwd(), "public", "uploads", "avatars", session.user.id)
    await fs.mkdir(userDir, { recursive: true })

    const ts = Date.now()
    const safeName = sanitizeFilename(avatar.name || "avatar")
    const stored = `${ts}-${safeName}`

    const bytes = await avatar.arrayBuffer()
    await fs.writeFile(path.join(userDir, stored), Buffer.from(bytes))

    const url = `/uploads/avatars/${session.user.id}/${stored}`

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: url },
    })

    return NextResponse.json({ success: true, data: { avatar: url } })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


