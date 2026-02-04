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
    <Card className="border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />
      <div className="p-6 relative z-10 w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-bold text-white text-lg">Ops Jobs</div>
            <div className="text-sm text-muted-foreground mt-1">Manual triggers (cron-ready endpoints under the hood)</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="bg-primary hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl"
            disabled={!isAdmin || isRunning}
            onClick={() => run("ALERT_SCAN")}
          >
            Run Alert Scan
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl"
            disabled={!isAdmin || isRunning}
            onClick={() => run("KYC_SYNC")}
          >
            Run KYC Sync (placeholder)
          </Button>
        </div>

        {!isAdmin && <div className="mt-3 text-sm text-muted-foreground">Auditors have read-only access.</div>}

        {error && (
          <Alert variant="destructive" className="mt-4 border-red-900/50 bg-red-900/10 text-red-500">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="text-muted-foreground">Last run: {result.job}</div>
            <div className="max-h-56 overflow-auto rounded-xl border border-white/10 p-4 bg-black/50 text-emerald-400 font-mono">
              <pre className="text-xs">{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}


