"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type Approval = {
  id: string
  action: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  entityType?: string | null
  entityId?: string | null
  requestedBy: string
  approvedBy?: string | null
  approvedAt?: string | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  createdAt: string
  payload: any
}

export function ApprovalsCard({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient()

  const approvalsQuery = useQuery({
    queryKey: ["admin", "approvals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/approvals")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load approvals")
      return json.data as Approval[]
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/approvals/${id}/approve`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Approve failed")
      return json
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "approvals"] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/approvals/${id}/reject`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Reject failed")
      return json
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "approvals"] })
    },
  })

  const items = (approvalsQuery.data ?? []).filter((a) => a.status === "PENDING")

  return (
    <Card className="border-border bg-card rounded-2xl relative overflow-hidden group hover:shadow-sm transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />
      <div className="p-6 relative z-10 w-full">
        <div className="font-bold text-foreground text-lg">Two-person approvals</div>
        <div className="text-sm text-muted-foreground mt-1">High-risk admin actions require a second admin approval</div>

        <div className="mt-6 space-y-2">
          {approvalsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading approvals…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No pending approvals.</div>
          ) : (
            items.map((a) => (
              <div key={a.id} className="rounded-xl border border-border/50 bg-muted/20 p-4 flex items-start justify-between gap-4 hover:bg-muted/40 transition-colors">
                <div className="min-w-0">
                  <div className="font-bold text-foreground text-base mb-1">{a.action}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {new Date(a.createdAt).toLocaleString()} • requestedBy <span className="text-foreground">{a.requestedBy}</span>
                    {a.entityType && a.entityId ? ` • ${a.entityType}:${a.entityId}` : ""}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:text-primary"
                      size="sm"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(a.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                      size="sm"
                      disabled={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(a.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}


