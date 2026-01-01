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
    <Card className="border-2 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">System Alerts</div>
          <div className="text-sm text-muted-foreground">Operational warnings and compliance queues</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {alertsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading alerts…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No alerts.</div>
        ) : (
          items.map((a) => (
            <div key={a.id} className="rounded border p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      a.severity === "CRITICAL"
                        ? "text-red-500 font-semibold"
                        : a.severity === "WARNING"
                          ? "text-amber-500 font-semibold"
                          : "text-muted-foreground font-semibold"
                    }
                  >
                    {a.severity}
                  </span>
                  <span className="font-medium">{a.title}</span>
                  {a.resolvedAt ? <span className="text-xs text-muted-foreground">(resolved)</span> : null}
                </div>
                <div className="text-sm text-muted-foreground">{a.message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(a.createdAt).toLocaleString()}
                  {a.entityType && a.entityId ? ` • ${a.entityType}:${a.entityId}` : ""}
                </div>
              </div>

              {isAdmin && !a.resolvedAt && (
                <Button
                  variant="outline"
                  className="bg-transparent"
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
    </Card>
  )
}


