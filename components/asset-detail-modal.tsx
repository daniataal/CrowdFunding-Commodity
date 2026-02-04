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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0A0A0A] border-white/10 p-0 sm:p-0 gap-0">
        <div className="p-6">
          {!commodity ? (
            <div className="py-8 text-sm text-muted-foreground text-center">Select a marketplace deal to view details.</div>
          ) : showSuccess ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in duration-500 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <Shield className="h-12 w-12 text-emerald-500" />
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
                  <span className="font-bold text-emerald-500">
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
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20" onClick={resetModal}>
                  View Portfolio
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="mb-6">
                <DialogTitle className="text-3xl font-bold text-white">{commodity.name}</DialogTitle>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="border-white/10 text-muted-foreground bg-white/5 uppercase tracking-wider text-[10px]">{commodity.type}</Badge>
                  {commodity.grossWeightTroyOz && <Badge variant="outline" className="border-white/10 text-muted-foreground bg-white/5">{commodity.grossWeightTroyOz} oz</Badge>}
                  <Badge
                    variant="outline"
                    className={
                      commodity.risk === "Low"
                        ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                        : commodity.risk === "Medium"
                          ? "border-amber-500/20 text-amber-500 bg-amber-500/5"
                          : "border-red-500/20 text-red-500 bg-red-500/5"
                    }
                  >
                    {commodity.risk} Risk
                  </Badge>
                </div>
              </DialogHeader>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  {commodity.status !== "FUNDING" ? "Shipment tracking is available for funded deals." : "Funding in progress."}
                </div>
                {commodity.status !== "FUNDING" && (
                  <Button
                    variant="outline"
                    className="bg-transparent border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                    onClick={() => {
                      setDetailsTab("logistics")
                      setTimeout(() => {
                        document.getElementById("modal-logistics-map")?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }, 0)
                    }}
                  >
                    Track Shipment
                  </Button>
                )}
              </div>

              <Tabs value={detailsTab} onValueChange={(v) => setDetailsTab(v as any)} className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="logistics">Logistics</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="financials" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="p-6 border border-white/10 bg-white/5">
                    <h3 className="font-semibold mb-6 flex items-center text-white text-lg">
                      <DollarSign className="h-5 w-5 mr-3 text-emerald-500" />
                      Cost Breakdown
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Required</span>
                        <span className="font-bold text-white">${commodity.amountRequired.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Already Funded</span>
                        <span className="font-bold text-emerald-500">${commodity.currentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-bold text-white">${remainingAmount.toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <span>Progress</span>
                          <span>{fundedPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={fundedPercentage} className="h-2 bg-white/5" />
                      </div>

                      <div className="flex justify-between pt-4 border-t border-white/10">
                        <span className="text-muted-foreground">Insurance Coverage</span>
                        <span className="font-medium text-white">${commodity.insuranceValue?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target APY</span>
                        <span className="font-bold text-emerald-500">{commodity.targetApy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium text-white">{commodity.duration} days</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-white/10 bg-[#0A0A0A] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
                    <h3 className="font-semibold mb-6 flex items-center text-white text-lg relative z-10">
                      <TrendingUp className="h-5 w-5 mr-3 text-emerald-500" />
                      Investment Calculator
                    </h3>
                    <div className="space-y-6 relative z-10">
                      {!kycApproved && (
                        <Alert className="border-amber-500/20 bg-amber-500/10 backdrop-blur-sm">
                          <AlertDescription className="text-amber-500">
                            KYC approval is required before investing.{" "}
                            <Link className="underline hover:text-amber-400" href="/kyc-verification">
                              Complete verification
                            </Link>
                            .
                          </AlertDescription>
                        </Alert>
                      )}
                      <div>
                        <Label htmlFor="amount" className="text-muted-foreground">Investment Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="10000"
                          value={investAmount}
                          onChange={(e) => setInvestAmount(e.target.value)}
                          className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 h-12 text-lg"
                          disabled={!kycApproved}
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                          Min ${minInvestment.toLocaleString()}
                          {maxInvestment !== null ? ` • Max $${maxInvestment.toLocaleString()}` : ""} • Remaining $
                          {remainingAmount.toLocaleString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Projected Return</p>
                          <p className="text-2xl font-bold text-emerald-500">${projectedReturn}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                          <p className="text-2xl font-bold text-white">
                            $
                            {investAmount
                              ? (Number.parseFloat(investAmount) + Number.parseFloat(projectedReturn)).toFixed(2)
                              : "0.00"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 p-5 bg-white/[0.02]">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Platform fee</span>
                          <span className="font-medium text-white">{(platformFeeBps / 100).toFixed(2)}%</span>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Principal</span>
                            <span className="font-medium text-white">${isAmountValid ? amountNum.toFixed(2) : "0.00"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="font-medium text-white">${fee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                            <span className="text-muted-foreground">Total wallet debit</span>
                            <span className="font-bold text-white">${totalDebit.toFixed(2)}</span>
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

                      <div className="space-y-4 rounded-xl border border-white/10 p-5 bg-white/[0.02]">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={ackRisk}
                            onCheckedChange={(v) => setAckRisk(Boolean(v))}
                            disabled={!kycApproved}
                            aria-label="Acknowledge risk disclosure"
                            className="border-white/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <div className="text-sm text-muted-foreground leading-tight">
                            I have read and understand the{" "}
                            <Link className="underline hover:text-white" href="/legal/risk-disclosure" target="_blank">
                              Risk Disclosure
                            </Link>
                            .
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={ackTerms}
                            onCheckedChange={(v) => setAckTerms(Boolean(v))}
                            disabled={!kycApproved}
                            aria-label="Accept terms of service"
                            className="border-white/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <div className="text-sm text-muted-foreground leading-tight">
                            I agree to the{" "}
                            <Link className="underline hover:text-white" href="/legal/terms" target="_blank">
                              Terms of Service
                            </Link>
                            .
                          </div>
                        </div>
                      </div>
                      {investMutation.error && (
                        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded border border-red-500/20">{(investMutation.error as Error).message}</div>
                      )}
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-lg shadow-lg shadow-emerald-500/20"
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
                        {investMutation.isPending ? "Processing Investment..." : "Confirm Investment"}
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="logistics" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card id="modal-logistics-map" className="p-6 border border-white/10 bg-[#0A0A0A]">
                    <h3 className="font-semibold mb-4 text-white">Logistics Map</h3>
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
                      <div className="text-sm text-muted-foreground">No coordinates available for this deal yet.</div>
                    )}
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

                  <Card className="p-6 border border-white/10 bg-[#0A0A0A]">
                    <h3 className="font-semibold mb-4 flex items-center text-white">
                      <MapPin className="h-5 w-5 mr-2 text-amber-500" />
                      Shipping Route
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <div>
                          <p className="font-semibold text-white">Origin</p>
                          <p className="text-sm text-muted-foreground">{commodity.origin}</p>
                        </div>
                      </div>
                      <div className="ml-1.5 h-12 w-0.5 bg-white/10" />
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-3 rounded-full border-2 border-white" />
                        <div>
                          <p className="font-semibold text-white">Destination</p>
                          <p className="text-sm text-muted-foreground">{commodity.destination}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-white/10 bg-[#0A0A0A]">
                    <h3 className="font-semibold mb-4 flex items-center text-white">
                      <Truck className="h-5 w-5 mr-2 text-amber-500" />
                      Shipping Manifest
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipment ID</span>
                        <code className="text-sm bg-white/5 px-2 py-1 rounded text-white border border-white/10">{commodity.shipmentId}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport Method</span>
                        <span className="font-medium text-white">{commodity.transportMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Duration</span>
                        <span className="font-medium text-white">{commodity.duration} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Insurance Provider</span>
                        <span className="font-medium text-white">Lloyd's of London</span>
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

                <TabsContent value="documents" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {docsQuery.isLoading ? (
                    <Card className="p-12 border border-white/10 bg-[#0A0A0A] text-sm text-muted-foreground flex items-center justify-center">Loading documents…</Card>
                  ) : docsQuery.isError ? (
                    <Card className="p-6 border border-red-500/20 bg-red-500/5 text-sm text-red-400">
                      {(docsQuery.error as Error).message === "Unauthorized" ? (
                        <span>
                          Please <Link className="underline hover:text-red-300" href="/login">log in</Link> to view verified deal documents.
                        </span>
                      ) : (docsQuery.error as Error).message === "KYC approval required" ? (
                        <span>
                          KYC approval is required to view verified deal documents.{" "}
                          <Link className="underline hover:text-red-300" href="/kyc-verification">Complete verification</Link>.
                        </span>
                      ) : (
                        <span>Failed to load documents.</span>
                      )}
                    </Card>
                  ) : (docsQuery.data?.length ?? 0) === 0 ? (
                    <Card className="p-12 border border-white/10 bg-[#0A0A0A] text-sm text-muted-foreground text-center">No verified documents available yet.</Card>
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
                            <Card className="p-4 border border-white/10 bg-[#0A0A0A] hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                                  <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold truncate text-white group-hover:text-primary transition-colors">{d.name}</h4>
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    {typeLabels[d.type]}
                                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                                      <LinkIcon className="h-3 w-3" />
                                      Open
                                    </span>
                                  </p>
                                </div>
                                <Badge className="bg-emerald-600/20 text-emerald-500 border border-emerald-600/30 hover:bg-emerald-600/30">Verified</Badge>
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
