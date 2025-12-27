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
    <Card className="border-2 p-4 bg-card/50">
      <div className="font-semibold">LBMA Spot Value (Estimator)</div>
      <div className="text-sm text-muted-foreground">
        Enter the current {metalLabel} spot price (USD per troy oz). We calculate fine ounces from weight × purity.
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="spot">Spot price (USD / troy oz)</Label>
          <Input id="spot" value={spot} onChange={(e) => setSpot(e.target.value)} placeholder="e.g. 2650.50" />
          <div className="text-xs text-muted-foreground">
            Source: LBMA (use your internal feed / vendor). This UI is an estimator, not a pricing oracle.
          </div>
        </div>

        <div className="space-y-2">
          <Label>Calculated</Label>
          <div className="text-sm">
            <div>
              Gross weight: <span className="font-medium">{weight.toLocaleString()} oz t</span>
            </div>
            <div>
              Purity: <span className="font-medium">{purity.toLocaleString()}%</span>
            </div>
            <div>
              Fine ounces: <span className="font-medium">{fineOz.toFixed(4)} oz t</span>
            </div>
            <div className="pt-2 border-t mt-2">
              Estimated value:{" "}
              <span className="font-semibold">
                {estValue > 0 ? `$${estValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}


