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
    <Card className="border-2 p-6">
      <div className="font-semibold">Two-person approvals</div>
      <div className="text-sm text-muted-foreground">High-risk admin actions require a second admin approval</div>

      <div className="mt-4 space-y-2">
        {approvalsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading approvals…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No pending approvals.</div>
        ) : (
          items.map((a) => (
            <div key={a.id} className="rounded border p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{a.action}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()} • requestedBy {a.requestedBy}
                  {a.entityType && a.entityId ? ` • ${a.entityType}:${a.entityId}` : ""}
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(a.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent text-red-500"
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
    </Card>
  )
}


