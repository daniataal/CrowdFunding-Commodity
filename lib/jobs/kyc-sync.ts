import "server-only"

import { prisma } from "@/lib/prisma"
import { verifyKycPlaceholder } from "@/lib/integrations/kyc-provider"

/**
 * Placeholder KYC sync job. In production, you'd poll the provider (or ingest webhooks).
 */
export async function runKycSync() {
  const pending = await prisma.user.findMany({
    where: { kycStatus: "PENDING" },
    select: { id: true, email: true, name: true },
    take: 100,
  })

  let processed = 0
  for (const u of pending) {
    // Placeholder always returns PENDING; this job is scaffolding for a real provider.
    await verifyKycPlaceholder({ userId: u.id, email: u.email, name: u.name })
    processed++
  }

  return { processed }
}


