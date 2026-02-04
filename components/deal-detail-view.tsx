"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CommodityDocument, DocumentType, MarketplaceCommodity } from "@/lib/domain"
import { DollarSign, TrendingUp, MapPin, Truck, FileText, Shield, Calendar, Link as LinkIcon } from "lucide-react"
import { ShipmentMap } from "@/components/shipment-map"
import type { ShipmentEvent } from "@/lib/domain"
import { MetalsValueCalculator } from "@/components/metals-value-calculator"

const typeLabels: Record<DocumentType, string> = {
  BILL_OF_LADING: "Bill of Lading",
  INSURANCE_CERTIFICATE: "Insurance Certificate",
  QUALITY_CERTIFICATION: "Quality Certification",
  COMMODITY_CONTRACT: "Commodity Contract",
  KYC_ID: "KYC ID",
  KYC_PROOF_OF_ADDRESS: "KYC Proof of Address",
  OTHER: "Other",
}

function docIcon(type: DocumentType) {
  switch (type) {
    case "INSURANCE_CERTIFICATE":
      return Shield
    case "COMMODITY_CONTRACT":
      return Calendar
    default:
      return FileText
  }
}

function fundedPct(current: number, required: number) {
  return required > 0 ? (current / required) * 100 : 0
}

export function DealDetailView({ commodity }: { commodity: MarketplaceCommodity }) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [investAmount, setInvestAmount] = useState("")
  const [ackRisk, setAckRisk] = useState(false)
  const [ackTerms, setAckTerms] = useState(false)
  const [detailsTab, setDetailsTab] = useState<"financials" | "logistics" | "documents">("financials")

  const commodityId = commodity.id
  const fundedPercentage = fundedPct(commodity.currentAmount, commodity.amountRequired)
  const remainingAmount = commodity.amountRequired - commodity.currentAmount
  const minInvestment = commodity.minInvestment ?? 1000
  const maxInvestment = commodity.maxInvestment ?? null
  const platformFeeBps = commodity.platformFeeBps ?? 150
  const hasCoords =
    commodity.originLat != null && commodity.originLng != null && commodity.destLat != null && commodity.destLng != null

  const arrivalDate = useMemo(() => {
    if (commodity.maturityDate) return new Date(commodity.maturityDate)
    return new Date(Date.now() + commodity.duration * 24 * 60 * 60 * 1000)
  }, [commodity.maturityDate, commodity.duration])

  const departureDate = useMemo(() => {
    // If we have an explicit maturity date, infer departure by subtracting duration.
    if (commodity.maturityDate) {
      const d = new Date(commodity.maturityDate)
      return new Date(d.getTime() - commodity.duration * 24 * 60 * 60 * 1000)
    }
    return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }, [commodity.maturityDate, commodity.duration])

  const transport = String(commodity.transportMethod ?? "").toLowerCase()
  const vehicleType =
    commodity.type === "Metals" && (transport.includes("brink") || transport.includes("armored"))
      ? "armored"
      : commodity.type === "Metals" && (transport.includes("air") || transport.includes("jet") || transport.includes("plane"))
        ? "plane"
        : commodity.type === "Metals"
          ? "plane"
          : transport.includes("air") || transport.includes("plane")
            ? "plane"
            : "ship"
  const vesselName = commodity.shipmentId ?? `${commodity.name} ${vehicleType === "plane" ? "Jet" : "Vessel"}`

  const kycStatus = (session?.user as any)?.kycStatus as string | undefined
  const isAuthed = !!session?.user
  const kycApproved = kycStatus === "APPROVED"

  const docsQuery = useQuery({
    queryKey: ["commodities", commodityId, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/commodities/${commodityId}/documents`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load documents")
      return json.data as CommodityDocument[]
    },
  })

  const shipmentEventsQuery = useQuery({
    queryKey: ["commodities", commodityId, "shipment-events"],
    queryFn: async () => {
      const res = await fetch(`/api/commodities/${commodityId}/shipment-events`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load shipment events")
      return json.data as ShipmentEvent[]
    },
  })

  const { effectiveDepartureDate, effectiveArrivalDate } = useMemo(() => {
    const events = shipmentEventsQuery.data ?? []
    const departed = events.find((e) => e.type === "DEPARTED")
    const arrived = [...events].reverse().find((e) => e.type === "ARRIVED")
    const now = new Date()
    const arrivedAt = arrived ? new Date(arrived.occurredAt) : null
    const arrivedPast = Boolean(arrivedAt && arrivedAt <= now)
    return {
      effectiveDepartureDate: departed ? new Date(departed.occurredAt) : departureDate,
      effectiveArrivalDate: arrived ? new Date(arrived.occurredAt) : arrivalDate,
    }
  }, [shipmentEventsQuery.data, departureDate, arrivalDate])

  const projectedReturn = useMemo(() => {
    const amount = Number.parseFloat(investAmount)
    if (!Number.isFinite(amount) || amount <= 0) return "0.00"
    const value = amount * (Number(commodity.targetApy ?? 0) / 100) * (Number(commodity.duration ?? 0) / 365)
    return value.toFixed(2)
  }, [investAmount, commodity.targetApy, commodity.duration])

  const amountNum = Number.parseFloat(investAmount)
  const isAmountValid = Number.isFinite(amountNum) && amountNum > 0
  const fee = isAmountValid ? (amountNum * platformFeeBps) / 10000 : 0
  const totalDebit = isAmountValid ? amountNum + fee : 0
  const minViolation = isAmountValid && amountNum < minInvestment
  const maxViolation = isAmountValid && maxInvestment !== null && amountNum > maxInvestment
  const remainingViolation = isAmountValid && amountNum > remainingAmount

  const investMutation = useMutation({
    mutationFn: async () => {
      const amount = Number.parseFloat(investAmount)
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount")
      if (amount < minInvestment) throw new Error(`Minimum investment is $${minInvestment.toLocaleString()}`)
      if (maxInvestment !== null && amount > maxInvestment) throw new Error(`Maximum investment is $${maxInvestment.toLocaleString()}`)
      if (amount > remainingAmount) throw new Error("Investment exceeds remaining funding amount")
      if (!ackRisk || !ackTerms) throw new Error("Please accept the Risk Disclosure and Terms to continue")
      const idem =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const res = await fetch("/api/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idem },
        body: JSON.stringify({ commodityId, amount, ackRisk: true, ackTerms: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Investment failed")
      return json
    },
    onSuccess: async () => {
      setInvestAmount("")
      setAckRisk(false)
      setAckTerms(false)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["marketplace", "commodities"] }),
        qc.invalidateQueries({ queryKey: ["public", "marketplace", "commodities"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "summary"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "shipments"] }),
        qc.invalidateQueries({ queryKey: ["activity"] }),
        qc.invalidateQueries({ queryKey: ["commodities", commodityId] }),
      ])
    },
  })

  return (
    <div className="w-full max-w-2xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">{commodity.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/10 text-muted-foreground bg-white/5 uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-md">
            {commodity.type}
          </Badge>
          <Badge
            variant="outline"
            className={
              commodity.risk === "Low"
                ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-2.5 py-1 rounded-md"
                : commodity.risk === "Medium"
                  ? "border-amber-500/20 text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded-md"
                  : "border-red-500/20 text-red-500 bg-red-500/5 px-2.5 py-1 rounded-md"
            }
          >
            {commodity.risk} Risk
          </Badge>
        </div>
      </div>

      <Tabs value={detailsTab} onValueChange={(v) => setDetailsTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 rounded-xl p-1 h-12">
          <TabsTrigger value="financials" className="rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">Financials</TabsTrigger>
          <TabsTrigger value="logistics" className="rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">Logistics</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="financials" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-6 border border-white/10 bg-[#0A0A0A] rounded-2xl">
            <h3 className="font-semibold mb-6 flex items-center text-white text-lg">
              <span className="text-amber-500 mr-2">$</span> Cost Breakdown
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Required</span>
                <span className="font-bold text-white text-base">${commodity.amountRequired.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Already Funded</span>
                <span className="font-bold text-emerald-500 text-base">${commodity.currentAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-bold text-white text-base">${remainingAmount.toLocaleString()}</span>
              </div>

              <div className="py-1">
                <Progress value={fundedPercentage} className="h-2 bg-white/5 [&>div]:bg-[#ef5f54]" />
              </div>

              <div className="h-px bg-white/5 my-4" />

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Insurance Coverage</span>
                <span className="font-bold text-white">${commodity.insuranceValue ? commodity.insuranceValue.toLocaleString() : "—"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Target APY</span>
                <span className="font-bold text-[#ef5f54] text-base">{commodity.targetApy}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-bold text-white text-base">{commodity.duration} days</span>
              </div>
            </div>
          </Card>

          <Card className="border border-white/10 bg-[#0A0A0A] p-6 relative overflow-hidden rounded-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#ef5f54]/10 rounded-full blur-[80px] pointer-events-none" />

            <h3 className="font-semibold mb-6 flex items-center text-white text-lg relative z-10">
              <TrendingUp className="h-5 w-5 mr-3 text-[#ef5f54]" />
              Investment Calculator
            </h3>

            {!isAuthed && (
              <Alert className="mb-4 border-white/10 bg-white/5 relative z-10 rounded-xl">
                <AlertDescription className="text-white">
                  Please <Link className="underline hover:text-[#ef5f54]" href="/login">log in</Link> to invest.
                </AlertDescription>
              </Alert>
            )}

            {isAuthed && !kycApproved && (
              <Alert className="mb-4 border-amber-500/20 bg-amber-500/10 backdrop-blur-sm relative z-10 rounded-xl">
                <AlertDescription className="text-amber-500">
                  KYC approval is required before investing.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6 relative z-10">
              <div>
                <Label htmlFor="amount" className="text-white font-medium mb-2 block">Investment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10000"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/30 h-12 rounded-xl focus:border-[#ef5f54]/50 focus:ring-[#ef5f54]/20"
                  disabled={!isAuthed || !kycApproved}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 p-5 bg-black/40 rounded-xl border border-white/5">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Projected Return</div>
                  <div className="text-2xl font-bold text-[#ef5f54] flex items-center gap-2">
                    <span className="text-lg">✨</span> ${projectedReturn}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Value</div>
                  <div className="text-2xl font-bold text-white">
                    $
                    {investAmount
                      ? (Number.parseFloat(investAmount) + Number.parseFloat(projectedReturn)).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={ackRisk}
                    onCheckedChange={(v) => setAckRisk(Boolean(v))}
                    disabled={!isAuthed || !kycApproved}
                    className="border-white/20 data-[state=checked]:bg-[#ef5f54] data-[state=checked]:border-[#ef5f54] rounded mt-0.5"
                  />
                  <div className="text-sm text-muted-foreground leading-tight">
                    I accept the <Link className="text-white hover:underline" href="/legal/risk-disclosure">Risk Disclosure</Link>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={ackTerms}
                    onCheckedChange={(v) => setAckTerms(Boolean(v))}
                    disabled={!isAuthed || !kycApproved}
                    className="border-white/20 data-[state=checked]:bg-[#ef5f54] data-[state=checked]:border-[#ef5f54] rounded mt-0.5"
                  />
                  <div className="text-sm text-muted-foreground leading-tight">
                    I agree to the <Link className="text-white hover:underline" href="/legal/terms">Terms of Service</Link>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-[#ef5f54] hover:bg-[#d64f44] text-white font-bold h-12 text-base rounded-xl shadow-[0_4px_20px_rgba(239,95,84,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => investMutation.mutate()}
                disabled={!isAuthed || !kycApproved || investMutation.isPending || !ackRisk || !ackTerms || !isAmountValid}
              >
                {investMutation.isPending ? "Processing..." : "Invest Now"}
              </Button>
            </div>
          </Card>

          {commodity.type === "Metals" && (
            <MetalsValueCalculator
              grossWeightTroyOz={commodity.grossWeightTroyOz ?? null}
              purityPercent={commodity.purityPercent ?? null}
              metalLabel={commodity.name}
            />
          )}
        </TabsContent>

        <TabsContent value="logistics" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-6 border border-white/10 bg-[#0A0A0A] rounded-2xl">
            <h3 className="font-semibold mb-6 flex items-center text-white text-lg">
              <MapPin className="h-5 w-5 mr-3 text-amber-500" />
              Shipping Route
            </h3>

            <div className="relative pl-2 py-2 mb-8">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500 via-white/20 to-emerald-500/50" />

              <div className="relative mb-10 flex items-start gap-6">
                <div className="relative z-10 h-6 w-6 rounded-full bg-[#0A0A0A] border-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0" />
                <div>
                  <div className="font-bold text-white text-lg mb-1">Origin</div>
                  <div className="text-muted-foreground text-sm">{commodity.origin}</div>
                  <div className="text-xs text-muted-foreground/50 mt-1">Departed: {effectiveDepartureDate.toLocaleDateString()}</div>
                </div>
              </div>

              <div className="relative flex items-start gap-6">
                <div className="relative z-10 h-6 w-6 rounded-full bg-[#0A0A0A] border-4 border-[#ef5f54] shadow-[0_0_15px_rgba(239,95,84,0.4)] shrink-0" />
                <div>
                  <div className="font-bold text-white text-lg mb-1">Destination</div>
                  <div className="text-muted-foreground text-sm">{commodity.destination}</div>
                  <div className="text-xs text-muted-foreground/50 mt-1">Arrival: {effectiveArrivalDate.toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {hasCoords && (
              <div className="rounded-xl overflow-hidden border border-white/10 h-64 mt-6 relative shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent pointer-events-none z-10" />
                <ShipmentMap
                  originCoordinates={{ lat: commodity.originLat as number, lng: commodity.originLng as number }}
                  destinationCoordinates={{ lat: commodity.destLat as number, lng: commodity.destLng as number }}
                  departureDate={effectiveDepartureDate}
                  arrivalDate={effectiveArrivalDate}
                  vesselName={vesselName}
                  vehicleType={vehicleType}
                />
              </div>
            )}
          </Card>

          <Card className="p-6 border border-white/10 bg-[#0A0A0A] rounded-2xl">
            <h3 className="font-semibold mb-6 flex items-center text-white text-lg">
              <Truck className="h-5 w-5 mr-3 text-amber-500" />
              Shipping Manifest
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-muted-foreground text-sm">Shipment ID</span>
                <code className="text-sm font-mono text-white tracking-wider">{commodity.shipmentId ?? "PENDING"}</code>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-muted-foreground text-sm">Transport Method</span>
                <span className="font-bold text-white text-sm uppercase tracking-wide">{commodity.transportMethod ?? "Standard"}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-muted-foreground text-sm">Estimated Duration</span>
                <span className="font-bold text-white text-sm">{commodity.duration} days</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-muted-foreground text-sm">Insurance Provider</span>
                <span className="font-bold text-white text-sm">Lloyd's of London</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {docsQuery.isLoading ? (
            <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">Loading documents...</div>
          ) : docsQuery.data && docsQuery.data.length > 0 ? (
            docsQuery.data.map((d) => {
              const Icon = docIcon(d.type)
              return (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={async (e) => {
                    if (!d.url.startsWith("/api/documents/")) return
                    e.preventDefault()
                    const res = await fetch(d.url)
                    const json = await res.json()
                    if (json?.data?.url) window.open(json.data.url, "_blank", "noopener,noreferrer")
                  }}
                  className="block group"
                >
                  <Card className="p-5 border border-white/10 bg-[#0A0A0A] hover:bg-white/[0.03] hover:border-white/20 transition-all rounded-2xl flex items-center gap-5">
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Icon className="h-6 w-6 text-[#ef5f54]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-base truncate mb-1 group-hover:text-[#ef5f54] transition-colors">{d.name}</h4>
                      <p className="text-sm text-muted-foreground">{typeLabels[d.type]}</p>
                    </div>
                    <Badge className={d.verified ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-muted-foreground border-white/10"}>
                      {d.verified ? "Verified" : "Active"}
                    </Badge>
                  </Card>
                </a>
              )
            })
          ) : (
            <div className="text-center p-12 text-muted-foreground border border-white/10 rounded-2xl border-dashed">No documents avaliable</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


