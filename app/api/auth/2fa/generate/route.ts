import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { generateSecret, generateURI } from "otplib"
import QRCode from "qrcode"

export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = session.user.email || "User"
    const serviceName = "CommodityPlatform"

    const secret = generateSecret()
    const otpauth = generateURI({ secret, label: userEmail, issuer: serviceName })

    try {
        const qrCodeUrl = await QRCode.toDataURL(otpauth)
        return NextResponse.json({ success: true, data: { secret, qrCodeUrl } })
    } catch (err) {
        return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
    }
}
