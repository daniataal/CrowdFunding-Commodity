"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MetalsValueCalculator({
  grossWeightTroyOz,
  purityPercent,
  metalLabel,
}: {
  grossWeightTroyOz?: number | null
  purityPercent?: number | null
  metalLabel: string
}) {
  const [spot, setSpot] = useState("")

  const weight = grossWeightTroyOz ?? 0
  const purity = purityPercent ?? 0

  const fineOz = useMemo(() => (weight > 0 && purity > 0 ? (weight * purity) / 100 : 0), [weight, purity])
  const spotNum = Number.parseFloat(spot)
  const estValue = useMemo(() => (Number.isFinite(spotNum) && fineOz > 0 ? fineOz * spotNum : 0), [fineOz, spotNum])

  return (
    <Card className="border border-white/10 p-6 bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
      <div className="font-semibold text-white mb-2 relative z-10">LBMA Spot Value (Estimator)</div>
      <div className="text-sm text-muted-foreground relative z-10">
        Enter the current {metalLabel} spot price (USD per troy oz). We calculate fine ounces from weight × purity.
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 relative z-10">
        <div className="space-y-3">
          <Label htmlFor="spot" className="text-muted-foreground">Spot price (USD / troy oz)</Label>
          <Input
            id="spot"
            value={spot}
            onChange={(e) => setSpot(e.target.value)}
            placeholder="e.g. 2650.50"
            className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 h-10"
          />
          <div className="text-xs text-muted-foreground leading-relaxed">
            Source: LBMA (use your internal feed / vendor). This UI is an estimator, not a pricing oracle.
          </div>
        </div>

        <div className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
          <Label className="text-muted-foreground">Calculated Breakdown</Label>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross weight</span>
              <span className="font-medium text-white">{weight.toLocaleString()} oz t</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purity</span>
              <span className="font-medium text-white">{purity.toLocaleString()}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fine ounces</span>
              <span className="font-medium text-white">{fineOz.toFixed(4)} oz t</span>
            </div>
            <div className="pt-3 border-t border-white/10 mt-3 flex justify-between items-center">
              <span className="text-muted-foreground">Estimated value</span>

              <span className="font-bold text-amber-500 text-lg">
                {estValue > 0 ? `$${estValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}


