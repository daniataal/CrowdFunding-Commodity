import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Database, Users, TrendingUp } from "lucide-react"
import { auth } from "@/auth"
import { LogisticsSyncCard } from "@/components/admin/logistics-sync-card"
import { JobsCard } from "@/components/admin/jobs-card"
import { AlertsCard } from "@/components/admin/alerts-card"
import { ApprovalsCard } from "@/components/admin/approvals-card"

export const dynamic = "force-dynamic"

export default async function SystemHealthPage() {
  const session = await auth()
  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    : null
  const isAdmin = dbUser?.role === "ADMIN"

  const [
    totalUsers,
    totalCommodities,
    totalInvestments,
    totalTransactions,
    totalVolume,
    activeDeals,
    pendingKyc,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.commodity.count(),
    prisma.investment.count(),
    prisma.transaction.count(),
    prisma.transaction.aggregate({
      where: { type: "INVESTMENT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.commodity.count({ where: { status: { in: ["FUNDING", "ACTIVE", "IN_TRANSIT"] } } }),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
  ])

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
    },
    {
      title: "Total Commodities",
      value: totalCommodities,
      icon: Database,
    },
    {
      title: "Total Investments",
      value: totalInvestments,
      icon: TrendingUp,
    },
    {
      title: "Platform Volume",
      value: `$${(Math.abs(Number(totalVolume._sum.amount ?? 0)) / 1000).toFixed(0)}k`,
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">System Health</h2>
        <p className="text-muted-foreground">Platform statistics and health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-border bg-card p-6 relative overflow-hidden group hover:shadow-sm transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[50px] group-hover:bg-primary/10 transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-4 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className="p-2 rounded-lg bg-muted border border-border">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Active Deals</CardTitle>
            <CardDescription className="text-muted-foreground">Currently funding or in transit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-500">{activeDeals}</div>
            <p className="text-sm text-muted-foreground mt-2">Commodities actively trading</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Pending KYC</CardTitle>
            <CardDescription className="text-muted-foreground">Users awaiting verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${pendingKyc > 0 ? "text-amber-500" : "text-muted-foreground"}`}>{pendingKyc}</div>
            <p className="text-sm text-muted-foreground mt-2">Requires admin review</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Transaction Statistics</CardTitle>
          <CardDescription className="text-muted-foreground">Platform transaction metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">{totalTransactions}</div>
          <p className="text-sm text-muted-foreground mt-2">Total transactions processed</p>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <LogisticsSyncCard isAdmin={isAdmin} />
        <JobsCard isAdmin={isAdmin} />
        <AlertsCard isAdmin={isAdmin} />
        <ApprovalsCard isAdmin={isAdmin} />
      </div>
    </div>
  )
}

