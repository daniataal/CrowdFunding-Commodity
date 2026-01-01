import { NextRequest, NextResponse } from "next/server"
import { requireDbRole } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { runAlertScan } from "@/lib/jobs/alert-scan"
import { runKycSync } from "@/lib/jobs/kyc-sync"

const schema = z.object({
  job: z.enum(["LOGISTICS_SYNC", "KYC_SYNC", "ALERT_SCAN"]),
})

export async function POST(request: NextRequest) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const body = await request.json()
  const validated = schema.parse(body)

  let data: any = null

  if (validated.job === "ALERT_SCAN") {
    data = await runAlertScan()
  } else if (validated.job === "KYC_SYNC") {
    data = await runKycSync()
  } else if (validated.job === "LOGISTICS_SYNC") {
    // Reuse existing endpoint logic by calling it internally (simple for now):
    // In production, move logistics sync into lib/jobs/logistics-sync.ts
    data = { hint: "Use /api/admin/logistics/sync (already implemented)" }
  }

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "RUN_JOB",
      entityType: "System",
      changes: { job: validated.job, result: data },
    },
  })

  return NextResponse.json({ success: true, data })
}


