"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function JobsCard({ isAdmin }: { isAdmin: boolean }) {
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const run = async (job: "ALERT_SCAN" | "KYC_SYNC") => {
    setIsRunning(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Job failed")
      setResult({ job, data: json.data })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="border-2 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">Ops Jobs</div>
          <div className="text-sm text-muted-foreground">Manual triggers (cron-ready endpoints under the hood)</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={!isAdmin || isRunning}
          onClick={() => run("ALERT_SCAN")}
        >
          Run Alert Scan
        </Button>
        <Button variant="outline" className="bg-transparent" disabled={!isAdmin || isRunning} onClick={() => run("KYC_SYNC")}>
          Run KYC Sync (placeholder)
        </Button>
      </div>

      {!isAdmin && <div className="mt-3 text-sm text-muted-foreground">Auditors have read-only access.</div>}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="text-muted-foreground">Last run: {result.job}</div>
          <div className="max-h-56 overflow-auto rounded border p-3 bg-muted/20">
            <pre className="text-xs">{JSON.stringify(result.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </Card>
  )
}


