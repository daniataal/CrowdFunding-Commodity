import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Edit, Eye } from "lucide-react"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function DealsPage() {
  const commodities = await prisma.commodity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { investments: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deal Management</h2>
          <p className="text-muted-foreground">Create and manage commodity listings</p>
        </div>
        <Link href="/admin/deals/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Create New Deal
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commodities.map((commodity) => {
          const fundedPercentage = Number(commodity.amountRequired) > 0
            ? (Number(commodity.currentAmount) / Number(commodity.amountRequired)) * 100
            : 0

          return (
            <Card key={commodity.id} className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{commodity.name}</CardTitle>
                    <CardDescription>{commodity.type}</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      commodity.status === "FUNDING"
                        ? "border-amber-500/50 text-amber-500"
                        : commodity.status === "ACTIVE"
                          ? "border-emerald-500/50 text-emerald-500"
                          : "border-gray-500/50 text-gray-500"
                    }
                  >
                    {commodity.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="font-semibold">{fundedPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(fundedPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${Number(commodity.currentAmount).toLocaleString()}</span>
                    <span>${Number(commodity.amountRequired).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">APY:</span>
                    <span className="ml-1 font-semibold">{Number(commodity.targetApy)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-1 font-semibold">{commodity.duration}d</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/admin/deals/${commodity.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/admin/deals/${commodity.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="mr-2 h-3 w-3" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

