"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export function ShipmentArrivalControls({
  dealId,
  canManage,
  currentStatus,
}: {
  dealId: string
  canManage: boolean
  currentStatus: string
}) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="bg-transparent border-border hover:bg-muted text-foreground"
          disabled={!canManage || isSaving || currentStatus === "FUNDING"}
          onClick={async () => {
            setIsSaving(true)
            setError(null)
            try {
              const res = await fetch(`/api/admin/deals/${dealId}/shipment-events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "IN_TRANSIT" }),
              })
              const json = await res.json()
              if (!res.ok) throw new Error(json.error || "Failed to mark in transit")
              router.refresh()
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setIsSaving(false)
            }
          }}
        >
          Mark In Transit
        </Button>

        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
          disabled={!canManage || isSaving || currentStatus === "FUNDING"}
          onClick={async () => {
            setIsSaving(true)
            setError(null)
            try {
              const res = await fetch(`/api/admin/deals/${dealId}/shipment-events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "ARRIVED" }),
              })
              const json = await res.json()
              if (!res.ok) throw new Error(json.error || "Failed to mark arrived")
              router.refresh()
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setIsSaving(false)
            }
          }}
        >
          Mark Arrived
        </Button>
      </div>

      {!canManage && <div className="text-sm text-muted-foreground">Auditors have read-only access.</div>}
      {currentStatus === "FUNDING" && <div className="text-sm text-muted-foreground">Deal must be funded before shipment status changes.</div>}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}


