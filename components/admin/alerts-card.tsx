"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type AlertItem = {
  id: string
  key: string
  severity: "INFO" | "WARNING" | "CRITICAL"
  type: string
  title: string
  message: string
  entityType?: string | null
  entityId?: string | null
  createdAt: string
  resolvedAt?: string | null
}

export function AlertsCard({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient()

  const alertsQuery = useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/alerts")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load alerts")
      return json.data as AlertItem[]
    },
  })

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/alerts/${id}/resolve`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Resolve failed")
      return json
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "alerts"] })
    },
  })

  const items = alertsQuery.data ?? []

  return (
    <Card className="border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />
      <div className="p-6 relative z-10 w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-bold text-white text-lg">System Alerts</div>
            <div className="text-sm text-muted-foreground mt-1">Operational warnings and compliance queues</div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {alertsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading alerts…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No alerts.</div>
          ) : (
            items.map((a) => (
              <div key={a.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-start justify-between gap-4 hover:bg-white/[0.04] transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${a.severity === "CRITICAL"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : a.severity === "WARNING"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}
                    >
                      {a.severity}
                    </span>
                    <span className="font-bold text-white">{a.title}</span>
                    {a.resolvedAt ? <span className="text-xs text-muted-foreground">(resolved)</span> : null}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.message}</div>
                  <div className="text-xs text-muted-foreground/60 mt-2 font-mono">
                    {new Date(a.createdAt).toLocaleString()}
                    {a.entityType && a.entityId ? ` • ${a.entityType}:${a.entityId}` : ""}
                  </div>
                </div>

                {isAdmin && !a.resolvedAt && (
                  <Button
                    variant="outline"
                    className="bg-transparent border-white/10 text-white hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/50"
                    size="sm"
                    onClick={() => resolveMutation.mutate(a.id)}
                    disabled={resolveMutation.isPending}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}


