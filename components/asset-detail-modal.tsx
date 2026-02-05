"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { MapPin, FileText, DollarSign, TrendingUp, Shield, Truck, Calendar, Link as LinkIcon } from "lucide-react"
import type { CommodityDocument, DocumentType, MarketplaceCommodity } from "@/lib/domain"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ShipmentMap } from "@/components/shipment-map"
import type { ShipmentEvent } from "@/lib/domain"

interface AssetDetailModalProps {
  commodity: MarketplaceCommodity | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function AssetDetailModal({ commodity, open, onOpenChange }: AssetDetailModalProps) {
  const [investAmount, setInvestAmount] = useState("")
  const [ackRisk, setAckRisk] = useState(false)
  const [ackTerms, setAckTerms] = useState(false)
  const [detailsTab, setDetailsTab] = useState<"financials" | "logistics" | "documents">("financials")
  const qc = useQueryClient()
  const { data: session } = useSession()
  const commodityId = commodity?.id

  const arrivalDate = commodity?.maturityDate
    ? new Date(commodity.maturityDate)
    : new Date(Date.now() + (commodity?.duration ?? 0) * 24 * 60 * 60 * 1000)
  const departureDate = commodity?.maturityDate
    ? new Date(new Date(commodity.maturityDate).getTime() - (commodity?.duration ?? 0) * 24 * 60 * 60 * 1000)
    : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  const docsQuery = useQuery({
    queryKey: ["commodities", commodityId, "documents"],
    enabled: !!commodityId && open,
    queryFn: async () => {
      const res = await fetch(`/api/commodities/${commodityId}/documents`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load documents")
      return json.data as CommodityDocument[]
    },
  })

  const shipmentEventsQuery = useQuery({
    queryKey: ["commodities", commodityId, "shipment-events"],
    enabled: !!commodityId && open,
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
    return {
      effectiveDepartureDate: departed ? new Date(departed.occurredAt) : departureDate,
      effectiveArrivalDate: arrived ? new Date(arrived.occurredAt) : arrivalDate,
    }
  }, [shipmentEventsQuery.data, departureDate, arrivalDate])

  const fundedPercentage =
    commodity && commodity.amountRequired > 0 ? (commodity.currentAmount / commodity.amountRequired) * 100 : 0
  const remainingAmount = commodity ? commodity.amountRequired - commodity.currentAmount : 0
  const minInvestment = commodity?.minInvestment ?? 1000
  const maxInvestment = commodity?.maxInvestment ?? null
  const platformFeeBps = commodity?.platformFeeBps ?? 150
  const hasCoords =
    commodity?.originLat != null && commodity?.originLng != null && commodity?.destLat != null && commodity?.destLng != null
  const projectedReturn = investAmount
    ? (
      Number.parseFloat(investAmount) *
      (Number(commodity?.targetApy ?? 0) / 100) *
      (Number(commodity?.duration ?? 0) / 365)
    ).toFixed(2)
    : "0.00"

  const amountNum = Number.parseFloat(investAmount)
  const isAmountValid = Number.isFinite(amountNum) && amountNum > 0
  const fee = isAmountValid ? (amountNum * platformFeeBps) / 10000 : 0
  const totalDebit = isAmountValid ? amountNum + fee : 0
  const minViolation = isAmountValid && amountNum < minInvestment
  const maxViolation = isAmountValid && maxInvestment !== null && amountNum > maxInvestment
  const remainingViolation = isAmountValid && amountNum > remainingAmount

  const [showSuccess, setShowSuccess] = useState(false)

  const investMutation = useMutation({
    mutationFn: async () => {
      if (!commodityId) throw new Error("No commodity selected")
      const amount = Number.parseFloat(investAmount)
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount")
      if (amount < minInvestment) throw new Error(`Minimum investment is $${minInvestment.toLocaleString()}`)
      if (maxInvestment !== null && amount > maxInvestment) throw new Error(`Maximum investment is $${maxInvestment.toLocaleString()}`)
      if (amount > remainingAmount) throw new Error("Investment exceeds remaining funding amount")
      const kycStatus = (session?.user as any)?.kycStatus as string | undefined
      if (kycStatus !== "APPROVED") throw new Error("KYC approval is required before investing")
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
      setShowSuccess(true)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["marketplace", "commodities"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "summary"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "shipments"] }),
        qc.invalidateQueries({ queryKey: ["activity"] }),
      ])
    },
  })

  const resetModal = () => {
    setShowSuccess(false)
    setInvestAmount("")
    setAckRisk(false)
    setAckTerms(false)
    onOpenChange(false)
  }

  const kycApproved = (session?.user as any)?.kycStatus === "APPROVED"
  const transport = String(commodity?.transportMethod ?? "").toLowerCase()
  const vehicleType =
    commodity?.type === "Metals" && (transport.includes("brink") || transport.includes("armored"))
      ? "armored"
      : commodity?.type === "Metals" && (transport.includes("air") || transport.includes("jet") || transport.includes("plane"))
        ? "plane"
        : commodity?.type === "Metals"
          ? "plane"
          : transport.includes("air") || transport.includes("plane")
            ? "plane"
            : "ship"
  const vesselName = commodity?.shipmentId ?? `${commodity?.name ?? "Shipment"} ${vehicleType === "plane" ? "Jet" : "Vessel"}`

  return (
    <Dialog open={open && !!commodity} onOpenChange={(v) => !v && resetModal()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border bg-card p-0 sm:p-0 gap-0">
        <div className="p-6">
          {!commodity ? (
            <div className="py-8 text-sm text-muted-foreground text-center">Select a marketplace deal to view details.</div>
          ) : showSuccess ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500 border border-primary/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2 relative z-10">
                <h2 className="text-4xl font-bold text-white tracking-tight">Investment Confirmed!</h2>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                  You have successfully invested <span className="text-white font-bold">${Number(investAmount).toLocaleString()}</span> in {commodity.name}.
                </p>
              </div>

              <Card className="w-full max-w-sm p-6 bg-white/5 border border-white/10 backdrop-blur-sm relative z-10">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs text-white/70 bg-white/5 px-2 py-1 rounded">{investMutation.data?.data?.investmentId?.slice(-8) ?? "PENDING"}...</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Ownership</span>
                  <span className="font-bold text-accent">
                    {((Number(investAmount) / commodity.amountRequired) * 100).toFixed(4)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Maturity</span>
                  <span className="text-white font-medium">{arrivalDate.toLocaleDateString()}</span>
                </div>
              </Card>

              <div className="flex gap-4 w-full max-w-xs relative z-10">
                <Button className="flex-1 bg-transparent border border-white/10 hover:bg-white/5 text-white" variant="outline" onClick={resetModal}>
                  Close
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" onClick={resetModal}>
                  View Portfolio
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <DialogTitle className="text-2xl font-bold tracking-tight mb-3">{commodity.name}</DialogTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-border bg-muted">{commodity.type}</Badge>
                  {commodity.grossWeightTroyOz && <Badge variant="outline" className="border-border bg-muted">{commodity.grossWeightTroyOz} oz</Badge>}
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

              {commodity.status !== "FUNDING" && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Shipment tracking available below.
                </div>
              )}

              <Tabs value={detailsTab} onValueChange={(v) => setDetailsTab(v as any)} className="mt-6 w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                  <TabsTrigger value="financials" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Financials</TabsTrigger>
                  <TabsTrigger value="logistics" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Logistics</TabsTrigger>
                  <TabsTrigger value="documents" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="financials" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="border-border bg-muted/30 p-6">
                    <h3 className="mb-5 flex items-center font-semibold">
                      <DollarSign className="mr-2 h-5 w-5 text-accent" />
                      Cost Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Required</span>
                        <span className="font-semibold">${commodity.amountRequired.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Already Funded</span>
                        <span className="font-semibold text-green-500">${commodity.currentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-semibold">${remainingAmount.toLocaleString()}</span>
                      </div>
                      <Progress value={fundedPercentage} className="h-2 bg-muted" />
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Insurance Coverage</span>
                          <span className="font-semibold">${commodity.insuranceValue?.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target APY</span>
                        <span className="font-semibold text-primary">{commodity.targetApy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-semibold">{commodity.duration} days</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden border-primary/20 bg-primary/5 p-6">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10" />
                    <h3 className="relative mb-5 flex items-center font-semibold">
                      <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                      Investment Calculator
                    </h3>

                    {!kycApproved && (
                      <Alert className="mb-4 border-amber-500/50 bg-amber-500/10 relative z-10">
                        <AlertDescription className="text-amber-500">
                          KYC approval is required before investing.{" "}
                          <Link className="underline hover:text-amber-600" href="/kyc-verification">
                            Complete verification
                          </Link>
                          .
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
                          disabled={!kycApproved}
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                          Min ${minInvestment.toLocaleString()}
                          {maxInvestment !== null ? ` • Max $${maxInvestment.toLocaleString()}` : ""} • Remaining ${remainingAmount.toLocaleString()}
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

                      <div className="rounded-xl border border-border/50 p-5 bg-background">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Platform fee</span>
                          <span className="font-medium">{(platformFeeBps / 100).toFixed(2)}%</span>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Principal</span>
                            <span className="font-medium">${isAmountValid ? amountNum.toFixed(2) : "0.00"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="font-medium">${fee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-3 mt-3">
                            <span className="text-muted-foreground">Total wallet debit</span>
                            <span className="font-bold">${totalDebit.toFixed(2)}</span>
                          </div>
                        </div>
                        {(minViolation || maxViolation || remainingViolation) && (
                          <div className="mt-3 text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">
                            {minViolation && `Below minimum ($${minInvestment.toLocaleString()}). `}
                            {maxViolation && maxInvestment !== null && `Above maximum ($${maxInvestment.toLocaleString()}). `}
                            {remainingViolation && "Exceeds remaining funding."}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={ackRisk}
                            onCheckedChange={(v) => setAckRisk(Boolean(v))}
                            disabled={!kycApproved}
                            className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded mt-0.5"
                          />
                          <div className="text-sm text-muted-foreground leading-tight">
                            I have read and understand the{" "}
                            <Link className="text-primary hover:underline" href="/legal/risk-disclosure" target="_blank">
                              Risk Disclosure
                            </Link>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={ackTerms}
                            onCheckedChange={(v) => setAckTerms(Boolean(v))}
                            disabled={!kycApproved}
                            className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded mt-0.5"
                          />
                          <div className="text-sm text-muted-foreground leading-tight">
                            I agree to the{" "}
                            <Link className="text-primary hover:underline" href="/legal/terms" target="_blank">
                              Terms of Service
                            </Link>
                          </div>
                        </div>
                      </div>

                      {investMutation.error && (
                        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded border border-red-500/20">{(investMutation.error as Error).message}</div>
                      )}

                      <Button
                        className="h-12 w-full bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                        size="lg"
                        onClick={() => investMutation.mutate()}
                        disabled={
                          investMutation.isPending ||
                          !kycApproved ||
                          !ackRisk ||
                          !ackTerms ||
                          !isAmountValid ||
                          minViolation ||
                          maxViolation ||
                          remainingViolation
                        }
                      >
                        {investMutation.isPending ? "Processing..." : "Invest Now"}
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="logistics" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card id="modal-logistics-map" className="border-border bg-muted/30 p-6">
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">Live Tracking</h3>
                    <div className="rounded-xl overflow-hidden border border-border h-64 relative shadow-sm">
                      {hasCoords && commodity ? (
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
                    {commodity && (
                      <div className="mt-4 space-y-2">
                        {shipmentEventsQuery.isError ? (
                          <div className="text-sm text-muted-foreground">
                            {(shipmentEventsQuery.error as Error).message === "Unauthorized" ? (
                              <span>
                                Please <Link className="underline" href="/login">log in</Link> to view shipment tracking.
                              </span>
                            ) : (shipmentEventsQuery.error as Error).message === "KYC approval required" ? (
                              <span>
                                KYC approval is required to view shipment tracking.{" "}
                                <Link className="underline" href="/kyc-verification">Complete verification</Link>.
                              </span>
                            ) : (
                              <span>Shipment events unavailable.</span>
                            )}
                          </div>
                        ) : null}

                        {(() => {
                          const events = shipmentEventsQuery.data ?? []
                          const departed = events.find((e) => e.type === "DEPARTED")
                          const arrived = [...events].reverse().find((e) => e.type === "ARRIVED")
                          const now = new Date()
                          const departedAt = departed ? new Date(departed.occurredAt) : departureDate
                          const arrivedAt = arrived ? new Date(arrived.occurredAt) : arrivalDate
                          const arrivedPast = Boolean(arrived && arrivedAt <= now)
                          const inTransitState = now < departedAt ? "Pending" : arrivedPast ? "Completed" : "Active"
                          return (
                            <>
                              <div className="flex items-center justify-between text-sm">
                                <div className="font-medium">Departed {commodity.origin}</div>
                                <div className="text-muted-foreground">{departedAt.toLocaleDateString()}</div>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="font-medium">Currently in transit</div>
                                <div className="text-muted-foreground">{inTransitState}</div>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="font-medium">
                                  {arrivedPast ? "Arrived" : "Estimated arrival"} {commodity.destination}
                                </div>
                                <div className="text-muted-foreground">{arrivedAt.toLocaleDateString()}</div>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}
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
                        <code className="rounded-md bg-muted px-3 py-1 text-sm font-mono text-foreground border border-border">{commodity.shipmentId}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport Method</span>
                        <span className="font-semibold">{commodity.transportMethod}</span>
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

                  <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Route Optimization</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This shipment follows the most efficient trade route with minimal transit time and optimal customs
                        clearance.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {docsQuery.isLoading ? (
                    <Card className="p-12 border border-border bg-muted/10 text-sm text-muted-foreground flex items-center justify-center">Loading documents…</Card>
                  ) : docsQuery.isError ? (
                    <Card className="p-6 border border-red-500/20 bg-red-500/5 text-sm text-red-500">
                      {(docsQuery.error as Error).message === "Unauthorized" ? (
                        <span>
                          Please <Link className="underline hover:text-red-600" href="/login">log in</Link> to view verified deal documents.
                        </span>
                      ) : (docsQuery.error as Error).message === "KYC approval required" ? (
                        <span>
                          KYC approval is required to view verified deal documents.{" "}
                          <Link className="underline hover:text-red-600" href="/kyc-verification">Complete verification</Link>.
                        </span>
                      ) : (
                        <span>Failed to load documents.</span>
                      )}
                    </Card>
                  ) : (docsQuery.data?.length ?? 0) === 0 ? (
                    <Card className="p-12 border border-dashed border-border bg-muted/10 text-sm text-muted-foreground text-center">No verified documents available yet.</Card>
                  ) : (
                    <div className="space-y-3">
                      {(docsQuery.data ?? []).map((d) => {
                        const Icon = docIcon(d.type)
                        return (
                          <a
                            key={d.id}
                            href={d.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={async (e) => {
                              // Convert signed-url endpoint → expiring download link.
                              if (!d.url.startsWith("/api/documents/")) return
                              e.preventDefault()
                              const res = await fetch(d.url)
                              const json = await res.json()
                              if (!res.ok) throw new Error(json.error || "Failed to get download link")
                              window.open(json.data.url, "_blank", "noopener,noreferrer")
                            }}
                          >
                            <Card className="cursor-pointer border-border bg-muted/30 p-5 transition-all hover:border-primary/50 hover:bg-muted/50">
                              <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                                  <Icon className="h-7 w-7 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{d.name}</h4>
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    {typeLabels[d.type]}
                                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                      <LinkIcon className="h-3 w-3" />
                                      Open
                                    </span>
                                  </p>
                                </div>
                                <Badge className="border-green-500/30 bg-green-500/10 text-green-500">Verified</Badge>
                              </div>
                            </Card>
                          </a>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
