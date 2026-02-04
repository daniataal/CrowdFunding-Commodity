import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DealDetailView } from "@/components/deal-detail-view"

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const commodity = await prisma.commodity.findUnique({ where: { id } })
  if (!commodity) return notFound()

  return (
    <DealDetailView
      commodity={{
        id: commodity.id,
        type: commodity.type,
        name: commodity.name,
        icon: commodity.icon,
        risk: commodity.risk,
        targetApy: Number(commodity.targetApy),
        duration: commodity.duration,
        minInvestment: Number((commodity as any).minInvestment),
        maxInvestment: (commodity as any).maxInvestment === null ? null : Number((commodity as any).maxInvestment),
        platformFeeBps: (commodity as any).platformFeeBps,
        amountRequired: Number(commodity.amountRequired),
        currentAmount: Number(commodity.currentAmount),
        description: commodity.description,
        origin: commodity.origin,
        destination: commodity.destination,
        originLat: commodity.originLat ?? null,
        originLng: commodity.originLng ?? null,
        destLat: commodity.destLat ?? null,
        destLng: commodity.destLng ?? null,
        status: commodity.status,
        shipmentId: commodity.shipmentId,
        insuranceValue: commodity.insuranceValue === null ? null : Number(commodity.insuranceValue),
        transportMethod: commodity.transportMethod,
        riskScore: commodity.riskScore === null ? null : Number(commodity.riskScore),
        maturityDate: commodity.maturityDate ? commodity.maturityDate.toISOString() : null,
      }}
    />
  )
}


