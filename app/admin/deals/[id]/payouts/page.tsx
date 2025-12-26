import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PayoutsForm } from "@/components/admin/payouts-form"

export const dynamic = "force-dynamic"

export default async function DealPayoutsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const investments = await prisma.investment.findMany({
    where: { commodityId: id },
    select: { userId: true, amount: true },
  })
  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const investorCount = new Set(investments.map((i) => i.userId)).size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settlement Engine</h2>
          <p className="text-muted-foreground">Distribute payouts pro-rata in one atomic transaction</p>
        </div>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href={`/admin/deals/${id}`}>Back to deal</Link>
        </Button>
      </div>

      <PayoutsForm dealId={id} dealName={commodity.name} totalInvested={totalInvested} investorCount={investorCount} />
    </div>
  )
}


