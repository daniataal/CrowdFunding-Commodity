"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export function SettlementStageControls({
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

  const canInspect = currentStatus === "ARRIVED"
  const canRelease = currentStatus === "INSPECTED"

  const postStage = async (stage: "INSPECTED" | "RELEASED") => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/deals/${dealId}/settlement-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update stage")
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="bg-transparent"
          disabled={!canManage || isSaving || !canInspect}
          onClick={() => postStage("INSPECTED")}
        >
          Mark Inspected
        </Button>
        <Button
          variant="outline"
          className="bg-transparent"
          disabled={!canManage || isSaving || !canRelease}
          onClick={() => postStage("RELEASED")}
        >
          Mark Released
        </Button>
      </div>

      {!canManage && <div className="text-sm text-muted-foreground">Auditors have read-only access.</div>}
      {canManage && !canInspect && !canRelease && (
        <div className="text-sm text-muted-foreground">Settlement staging starts after ARRIVED.</div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}


