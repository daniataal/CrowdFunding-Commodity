"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LogisticsSyncCard({ isAdmin }: { isAdmin: boolean }) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Array<{ id: string; shipmentId: string; events: any[] }> | null>(null)

  return (
    <Card className="border-2 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">Logistics Sync (Placeholder)</div>
          <div className="text-sm text-muted-foreground">
            Simulates pulling shipment events from MarineTraffic (or similar). In production this would be cron-driven.
          </div>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={!isAdmin || isSyncing}
          onClick={async () => {
            setError(null)
            setIsSyncing(true)
            try {
              const res = await fetch("/api/admin/logistics/sync", { method: "POST" })
              const json = await res.json()
              if (!res.ok) throw new Error(json.error || "Sync failed")
              setResult(json.data)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setIsSyncing(false)
            }
          }}
        >
          {isSyncing ? "Syncing..." : "Sync Logistics"}
        </Button>
      </div>

      {!isAdmin && (
        <div className="mt-3 text-sm text-muted-foreground">Auditors have read-only access.</div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="text-muted-foreground">Updated deals: {result.length}</div>
          <div className="max-h-56 overflow-auto rounded border p-3 bg-muted/20">
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </Card>
  )
}


