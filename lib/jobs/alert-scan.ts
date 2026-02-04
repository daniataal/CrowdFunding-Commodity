import "server-only"

import { prisma } from "@/lib/prisma"

export async function runAlertScan() {
  const now = new Date()

  // 1) Shipment delays: IN_TRANSIT past maturityDate (ETA) by > 1 day.
  const delayed = await prisma.commodity.findMany({
    where: {
      status: "IN_TRANSIT",
      maturityDate: { not: null, lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true, name: true, maturityDate: true, origin: true, destination: true },
    take: 100,
  })

  // 2) KYC pending too long: > 7 days.
  const pendingKyc = await prisma.user.findMany({
    where: {
      kycStatus: "PENDING",
      createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, email: true, name: true, createdAt: true },
    take: 200,
  })

  const created: string[] = []

  for (const c of delayed) {
    const key = `shipment_delay:${c.id}`
    const alert = await prisma.systemAlert.upsert({
      where: { key },
      create: {
        key,
        severity: "WARNING",
        type: "SHIPMENT_DELAY",
        title: "Shipment appears delayed",
        message: `Deal "${c.name}" is still IN_TRANSIT past its ETA.`,
        entityType: "Commodity",
        entityId: c.id,
        metadata: {
          origin: c.origin,
          destination: c.destination,
          eta: c.maturityDate?.toISOString(),
        },
      },
      update: {
        // If it was resolved earlier but still delayed, reopen it.
        resolvedAt: null,
        message: `Deal "${c.name}" is still IN_TRANSIT past its ETA.`,
        metadata: {
          origin: c.origin,
          destination: c.destination,
          eta: c.maturityDate?.toISOString(),
        },
      },
      select: { id: true },
    })
    created.push(alert.id)
  }

  for (const u of pendingKyc) {
    const key = `kyc_pending:${u.id}`
    const alert = await prisma.systemAlert.upsert({
      where: { key },
      create: {
        key,
        severity: "INFO",
        type: "KYC_PENDING_TOO_LONG",
        title: "KYC pending too long",
        message: `User ${u.email} has been pending KYC review for more than 7 days.`,
        entityType: "User",
        entityId: u.id,
        metadata: { email: u.email, name: u.name, createdAt: u.createdAt.toISOString() },
      },
      update: {
        resolvedAt: null,
        message: `User ${u.email} has been pending KYC review for more than 7 days.`,
        metadata: { email: u.email, name: u.name, createdAt: u.createdAt.toISOString() },
      },
      select: { id: true },
    })
    created.push(alert.id)
  }

  return { shipmentDelay: delayed.length, kycPending: pendingKyc.length, upserted: created.length }
}


