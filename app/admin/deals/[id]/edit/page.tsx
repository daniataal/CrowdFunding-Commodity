import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { EditDealForm } from "@/components/admin/edit-deal-form"

export const dynamic = "force-dynamic"

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) redirect("/admin/deals")
  const session = await auth()
  if (!session?.user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/admin/deals")

  const commodity = await prisma.commodity.findUnique({ where: { id } })
  if (!commodity) redirect("/admin/deals")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Edit Deal</h2>
        <p className="text-muted-foreground">Update a commodity listing</p>
      </div>
      <EditDealForm
        dealId={commodity.id}
        initial={{
          name: commodity.name,
          type: commodity.type,
          risk: commodity.risk,
          targetApy: Number(commodity.targetApy),
          duration: commodity.duration,
          minInvestment: Number((commodity as any).minInvestment),
          maxInvestment: (commodity as any).maxInvestment === null ? null : Number((commodity as any).maxInvestment),
          platformFeeBps: (commodity as any).platformFeeBps,
          amountRequired: Number(commodity.amountRequired),
          description: commodity.description,
          origin: commodity.origin,
          destination: commodity.destination,
          originLat: commodity.originLat ?? null,
          originLng: commodity.originLng ?? null,
          destLat: commodity.destLat ?? null,
          destLng: commodity.destLng ?? null,
          shipmentId: commodity.shipmentId,
          insuranceValue: commodity.insuranceValue === null ? null : Number(commodity.insuranceValue),
          transportMethod: commodity.transportMethod,
          riskScore: commodity.riskScore === null ? null : Number(commodity.riskScore),
          maturityDate: commodity.maturityDate ? commodity.maturityDate.toISOString() : null,
        }}
      />
    </div>
  )
}


