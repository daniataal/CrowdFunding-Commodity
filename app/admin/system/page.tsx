import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Database, Users, TrendingUp } from "lucide-react"
import { auth } from "@/auth"
import { LogisticsSyncCard } from "@/components/admin/logistics-sync-card"

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Health</h2>
        <p className="text-muted-foreground">Platform statistics and health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Active Deals</CardTitle>
            <CardDescription>Currently funding or in transit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeDeals}</div>
            <p className="text-sm text-muted-foreground mt-2">Commodities actively trading</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Pending KYC</CardTitle>
            <CardDescription>Users awaiting verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingKyc}</div>
            <p className="text-sm text-muted-foreground mt-2">Requires admin review</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Transaction Statistics</CardTitle>
          <CardDescription>Platform transaction metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTransactions}</div>
          <p className="text-sm text-muted-foreground mt-2">Total transactions processed</p>
        </CardContent>
      </Card>

      <LogisticsSyncCard isAdmin={isAdmin} />
    </div>
  )
}

