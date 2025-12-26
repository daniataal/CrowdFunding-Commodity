import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function DealDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) redirect("/admin/deals")
  const session = await auth()
  if (!session?.user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "AUDITOR")) redirect("/")

  const commodity = await prisma.commodity.findUnique({
    where: { id },
    include: { _count: { select: { investments: true } } },
  })
  if (!commodity) redirect("/admin/deals")

  const isAdmin = dbUser.role === "ADMIN"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{commodity.name}</h2>
          <p className="text-muted-foreground">Deal details</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/admin/deals">Back</Link>
          </Button>
          <Button asChild variant="outline" className="bg-transparent">
            <Link href={`/admin/deals/${commodity.id}/documents`}>Documents</Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="outline" className="bg-transparent">
              <Link href={`/admin/deals/${commodity.id}/payouts`}>Distribute Payouts</Link>
            </Button>
          )}
          {isAdmin && (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href={`/admin/deals/${commodity.id}/edit`}>Edit</Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Overview</CardTitle>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">{commodity.type}</Badge>
              <Badge variant="outline">{commodity.risk}</Badge>
              <Badge variant="outline">{commodity.status}</Badge>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Investments: {commodity._count.investments}</div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Funding</div>
            <div className="font-semibold">
              ${Number(commodity.currentAmount).toLocaleString()} / ${Number(commodity.amountRequired).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">APY / Duration</div>
            <div className="font-semibold">{Number(commodity.targetApy)}% • {commodity.duration} days</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Investor limits</div>
            <div className="font-semibold">
              Min ${Number((commodity as any).minInvestment).toLocaleString()}
              {(commodity as any).maxInvestment ? ` • Max $${Number((commodity as any).maxInvestment).toLocaleString()}` : ""}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Platform fee</div>
            <div className="font-semibold">{(Number((commodity as any).platformFeeBps ?? 150) / 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Route</div>
            <div className="font-semibold">{commodity.origin} → {commodity.destination}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Shipment ID</div>
            <div className="font-semibold">{commodity.shipmentId ?? "-"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-muted-foreground">Description</div>
            <div className="mt-1">{commodity.description}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


