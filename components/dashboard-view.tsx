"use client"

import { Card } from "@/components/ui/card"
import { ArrowUpRight, TrendingUp, Wallet, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useQuery } from "@tanstack/react-query"
import type { DashboardSummary, PerformancePoint } from "@/lib/domain"

export function DashboardView() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/summary")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load summary")
      return json.data as DashboardSummary
    },
  })

  const performanceQuery = useQuery({
    queryKey: ["dashboard", "performance"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/performance")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load performance")
      return json.data as PerformancePoint[]
    },
  })

  const shipmentsQuery = useQuery({
    queryKey: ["dashboard", "shipments"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/shipments")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load shipments")
      return json.data as Array<{
        id: string
        type: string
        name: string
        status: string
        origin: string
        destination: string
        shipmentId: string | null
        amountRequired: number
      }>
    },
  })

  const summary = summaryQuery.data
  const performance = performanceQuery.data ?? []
  const activeShipments = shipmentsQuery.data ?? []

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-2 bg-card/50 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Portfolio Value</p>
              <h3 className="text-3xl font-bold mt-2">${(summary?.totalValue ?? 0).toLocaleString()}</h3>
              <div className="flex items-center mt-2 text-emerald-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-semibold">+{(summary?.roi ?? 0).toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 bg-card/50 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Profit</p>
              <h3 className="text-3xl font-bold mt-2">${(summary?.totalProfit ?? 0).toLocaleString()}</h3>
              <div className="flex items-center mt-2 text-emerald-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-semibold">+15.2%</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 bg-card/50 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Cash in Wallet</p>
              <h3 className="text-3xl font-bold mt-2">${(summary?.cashInWallet ?? 0).toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground mt-2">Available to invest</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="p-6 border-2 bg-card/50 backdrop-blur">
        <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="#10b981"
                strokeWidth={2}
                name="Your Portfolio"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="market"
                stroke="#6b7280"
                strokeWidth={2}
                name="Market Index"
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Active Shipments */}
      <Card className="p-6 border-2 bg-card/50 backdrop-blur">
        <h3 className="text-lg font-semibold mb-4">Active Shipments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Commodity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Shipment ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Route</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Value</th>
              </tr>
            </thead>
            <tbody>
              {activeShipments.map((shipment) => (
                <tr key={shipment.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-medium">{shipment.name}</div>
                    <div className="text-sm text-muted-foreground">{shipment.type}</div>
                  </td>
                  <td className="py-4 px-4">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{shipment.shipmentId ?? "-"}</code>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div>{shipment.origin}</div>
                    <div className="text-muted-foreground">→ {shipment.destination}</div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant="default"
                      className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                    >
                      {shipment.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold">${shipment.amountRequired.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
