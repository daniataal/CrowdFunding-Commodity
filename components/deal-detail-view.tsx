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
        <h1 className="text-2xl font-bold tracking-tight text-white mb-3">{commodity.name}</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-border bg-muted">{commodity.type}</Badge>
          <Badge
            variant="outline"
            className={
              commodity.risk === "Low"
                ? "border-green-500/50 bg-green-500/10 text-green-500"
                : commodity.risk === "Medium"
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-primary/50 bg-primary/10 text-primary"
            }
          >
            {commodity.risk} Risk
          </Badge>
        </div>
      </div>

      <Tabs value={detailsTab} onValueChange={(v) => setDetailsTab(v as any)} className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="financials" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Financials</TabsTrigger>
          <TabsTrigger value="logistics" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Logistics</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="financials" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-6 border border-white/10 bg-[#0A0A0A] rounded-2xl">
            <h3 className="font-semibold mb-6 flex items-center text-white text-lg">
              <span className="text-accent mr-2">$</span> Cost Breakdown
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Required</span>
                <span className="font-bold text-white text-base">${commodity.amountRequired.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Already Funded</span>
                <span className="font-bold text-primary text-base">${commodity.currentAmount.toLocaleString()}</span>
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

          <Card className="relative overflow-hidden border-primary/20 bg-primary/5 p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10" />
            <h3 className="relative mb-5 flex items-center font-semibold">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Investment Calculator
            </h3>

            {!isAuthed && (
              <Alert className="mb-4 bg-background/50 relative z-10 border-border">
                <AlertDescription>
                  Please <Link className="underline hover:text-primary" href="/login">log in</Link> to invest.
                </AlertDescription>
              </Alert>
            )}

            {isAuthed && !kycApproved && (
              <Alert className="mb-4 border-accent/50 bg-accent/10 relative z-10">
                <AlertDescription className="text-accent">
                  KYC approval is required before investing.
                </AlertDescription>
              </Alert>
            )}

            <div className="relative space-y-4 mix-blend-normal">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium">Investment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10000"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="mt-2 h-12 border-border bg-background"
                  disabled={!isAuthed || !kycApproved}
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  Min ${minInvestment.toLocaleString()}
                  {maxInvestment !== null ? ` • Max $${maxInvestment.toLocaleString()}` : ""}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-background p-5 border border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Projected Return</p>
                  <div className="mt-1 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <p className="text-3xl font-bold text-accent">${projectedReturn}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="mt-1 text-3xl font-bold">
                    $
                    {investAmount
                      ? (Number.parseFloat(investAmount) + Number.parseFloat(projectedReturn)).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={ackRisk}
                    onCheckedChange={(v) => setAckRisk(Boolean(v))}
                    disabled={!isAuthed || !kycApproved}
                    className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded mt-0.5"
                  />
                  <div className="text-sm text-muted-foreground leading-tight">
                    I accept the <Link className="text-primary hover:underline" href="/legal/risk-disclosure">Risk Disclosure</Link>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={ackTerms}
                    onCheckedChange={(v) => setAckTerms(Boolean(v))}
                    disabled={!isAuthed || !kycApproved}
                    className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded mt-0.5"
                  />
                  <div className="text-sm text-muted-foreground leading-tight">
                    I agree to the <Link className="text-primary hover:underline" href="/legal/terms">Terms of Service</Link>
                  </div>
                </div>
              </div>

              {investMutation.error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded border border-red-500/20">{(investMutation.error as Error).message}</div>}

              {(minViolation || maxViolation || remainingViolation) && (
                <div className="mt-3 text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">
                  {minViolation && `Below minimum ($${minInvestment.toLocaleString()}). `}
                  {maxViolation && maxInvestment !== null && `Above maximum ($${maxInvestment.toLocaleString()}). `}
                  {remainingViolation && "Exceeds remaining funding."}
                </div>
              )}

              <Button
                className="h-12 w-full bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                size="lg"
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

        <TabsContent value="logistics" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-border bg-muted/30 p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Live Tracking</h3>
            <div className="rounded-xl overflow-hidden border border-border h-64 relative shadow-sm">
              {hasCoords ? (
                <ShipmentMap
                  originCoordinates={{ lat: commodity.originLat as number, lng: commodity.originLng as number }}
                  destinationCoordinates={{ lat: commodity.destLat as number, lng: commodity.destLng as number }}
                  departureDate={effectiveDepartureDate}
                  arrivalDate={effectiveArrivalDate}
                  vesselName={vesselName}
                  vehicleType={vehicleType}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
                  Tracking unavailable
                </div>
              )}
            </div>
          </Card>

          <Card className="border-border bg-muted/30 p-6">
            <h3 className="mb-5 flex items-center font-semibold">
              <MapPin className="mr-2 h-5 w-5 text-accent" />
              Shipping Route
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                <div>
                  <p className="font-semibold">Origin</p>
                  <p className="text-sm text-muted-foreground">{commodity.origin}</p>
                </div>
              </div>
              <div className="ml-2 h-12 w-0.5 bg-gradient-to-b from-green-500 to-primary" />
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20" />
                <div>
                  <p className="font-semibold">Destination</p>
                  <p className="text-sm text-muted-foreground">{commodity.destination}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border bg-muted/30 p-6">
            <h3 className="mb-5 flex items-center font-semibold">
              <Truck className="mr-2 h-5 w-5 text-accent" />
              Shipping Manifest
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipment ID</span>
                <code className="rounded-md bg-muted px-3 py-1 text-sm font-mono text-foreground border border-border">{commodity.shipmentId ?? "—"}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transport Method</span>
                <span className="font-semibold">{commodity.transportMethod ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Duration</span>
                <span className="font-semibold">{commodity.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance Provider</span>
                <span className="font-semibold">Lloyd's of London</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                  <Card className="cursor-pointer border-border bg-muted/30 p-5 transition-all hover:border-primary/50 hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{d.name}</h4>
                        <p className="text-sm text-muted-foreground">{typeLabels[d.type]}</p>
                      </div>
                      <Badge className={d.verified ? "border-green-500/30 bg-green-500/10 text-green-500" : "border-border bg-muted text-muted-foreground"}>
                        {d.verified ? "Verified" : "Active"}
                      </Badge>
                    </div>
                  </Card>
                </a>
              )
            })
          ) : (
            <div className="text-center p-12 text-muted-foreground border border-dashed border-border rounded-xl">No documents avaliable</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


