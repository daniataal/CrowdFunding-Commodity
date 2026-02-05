import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Database, Users, TrendingUp, ShieldCheck, Activity } from "lucide-react"
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
      title: "Platform Volume",
      value: `$${(Math.abs(Number(totalVolume._sum.amount ?? 0)) / 1000).toFixed(0)}k`,
      icon: BarChart3,
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
    },
    {
      title: "Total Investments",
      value: totalInvestments,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Total Commodities",
      value: totalCommodities,
      icon: Database,
      color: "text-foreground",
      bg: "bg-muted",
      border: "border-border",
    },
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-muted-foreground",
      bg: "bg-muted/50",
      border: "border-border/50",
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
            <Card key={stat.title} className={`border bg-card p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${stat.border}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 transition-all group-hover:opacity-40 ${stat.bg.replace('/10', '/30')}`} />

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-4 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className={`text-4xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Active Deals</CardTitle>
                <CardDescription className="text-muted-foreground">Live trading commodities</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{activeDeals}</div>
            <p className="text-sm text-muted-foreground mt-2">Currently funding or in transit</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Pending KYC</CardTitle>
                <CardDescription className="text-muted-foreground">Awaiting verification</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${pendingKyc > 0 ? "text-accent" : "text-muted-foreground"}`}>{pendingKyc}</div>
            <p className="text-sm text-muted-foreground mt-2">Requires admin review</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Transactions</CardTitle>
                <CardDescription className="text-muted-foreground">Total processed</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <Database className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{totalTransactions}</div>
            <p className="text-sm text-muted-foreground mt-2">Lifetime platform actions</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <LogisticsSyncCard isAdmin={isAdmin} />
        <JobsCard isAdmin={isAdmin} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AlertsCard isAdmin={isAdmin} />
          <ApprovalsCard isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  )
}
