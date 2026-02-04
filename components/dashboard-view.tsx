"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] transition-all duration-500 group-hover:bg-primary/30" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Portfolio Value</p>
                <h3 className="text-3xl font-bold mt-2 text-white">${(summary?.totalValue ?? 0).toLocaleString()}</h3>
                <div className="flex items-center mt-2 text-emerald-400">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-semibold">+{(summary?.roi ?? 0).toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px] transition-all duration-500 group-hover:bg-emerald-500/30" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Profit</p>
                <h3 className="text-3xl font-bold mt-2 text-white">${(summary?.totalProfit ?? 0).toLocaleString()}</h3>
                <div className="flex items-center mt-2 text-emerald-400">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-semibold">+15.2%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-[60px] transition-all duration-500 group-hover:bg-amber-500/30" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Cash in Wallet</p>
                <h3 className="text-3xl font-bold mt-2 text-white">${(summary?.cashInWallet ?? 0).toLocaleString()}</h3>
                <p className="text-sm text-emerald-400 mt-2 font-medium">Available to invest</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Wallet className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="p-8 border border-white/10 bg-[#0A0A0A] rounded-2xl">
        <h3 className="text-xl font-bold mb-6 text-white">Portfolio Performance</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                }}
                itemStyle={{ color: "#fff" }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                name="Your Portfolio"
                dot={false}
                activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="market"
                stroke="#444"
                strokeWidth={2}
                name="Market Index"
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-8 border border-white/10 bg-[#0A0A0A] rounded-2xl">
        <h3 className="text-xl font-bold mb-6 text-white">Active Shipments</h3>
        {activeShipments.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
            <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No active shipments</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Values are waiting to be unlocked. Visit the marketplace to start building your portfolio.</p>
            <Button asChild className="h-12 px-8 bg-primary hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 rounded-xl">
              <a href="/marketplace">Browse Marketplace</a>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Commodity</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Shipment ID</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Route</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">Value</th>
                </tr>
              </thead>
              <tbody>
                {activeShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="py-5 px-4">
                      <div className="font-bold text-white text-lg">{shipment.name}</div>
                      <div className="text-sm text-muted-foreground">{shipment.type}</div>
                    </td>
                    <td className="py-5 px-4">
                      <code className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-muted-foreground font-mono">{shipment.shipmentId ?? "-"}</code>
                    </td>
                    <td className="py-5 px-4 text-sm">
                      <div className="text-white font-medium">{shipment.origin}</div>
                      <div className="text-muted-foreground">→ {shipment.destination}</div>
                    </td>
                    <td className="py-5 px-4">
                      <Badge
                        variant="default"
                        className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                      >
                        {shipment.status}
                      </Badge>
                    </td>
                    <td className="py-5 px-4 text-right font-bold text-white text-lg">${shipment.amountRequired.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
