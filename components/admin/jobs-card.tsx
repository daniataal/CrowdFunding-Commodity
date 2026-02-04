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
    <Card className="border-border bg-card rounded-2xl relative overflow-hidden group hover:shadow-sm transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />
      <div className="p-6 relative z-10 w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-bold text-foreground text-lg">Ops Jobs</div>
            <div className="text-sm text-muted-foreground mt-1">Manual triggers (cron-ready endpoints under the hood)</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl"
            disabled={!isAdmin || isRunning}
            onClick={() => run("ALERT_SCAN")}
          >
            Run Alert Scan
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border-border text-foreground hover:bg-muted rounded-xl"
            disabled={!isAdmin || isRunning}
            onClick={() => run("KYC_SYNC")}
          >
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
            <div className="max-h-56 overflow-auto rounded-xl border border-border p-4 bg-muted font-mono text-foreground">
              <pre className="text-xs">{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}


