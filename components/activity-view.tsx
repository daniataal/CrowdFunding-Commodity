"use client"

import { mockActivity, type ActivityItem } from "@/lib/mock-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrendingUp, DollarSign, Package, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ActivityView() {
  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "investment":
        return <TrendingUp className="h-5 w-5 text-purple-500" />
      case "dividend":
        return <DollarSign className="h-5 w-5 text-emerald-500" />
      case "shipment":
        return <Package className="h-5 w-5 text-blue-500" />
      case "deposit":
        return <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
      case "withdrawal":
        return <ArrowUpFromLine className="h-5 w-5 text-amber-500" />
    }
  }

  const getStatusBadge = (status: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20">Completed</Badge>
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/20">Pending</Badge>
      case "info":
        return <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/20">Update</Badge>
    }
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return null
    const isPositive = amount > 0
    return (
      <span className={`font-semibold ${isPositive ? "text-emerald-500" : "text-slate-300"}`}>
        {isPositive ? "+" : ""}${amount.toLocaleString()}
      </span>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Activity</h1>
        <p className="text-muted-foreground">Track your investments and transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your complete transaction history and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-border" />

              {mockActivity.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {/* Icon circle */}
                  <div className="relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-border bg-card">
                    {getIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(item.timestamp)}</p>
                      </div>
                      {item.amount && <div className="text-right">{formatAmount(item.amount)}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
