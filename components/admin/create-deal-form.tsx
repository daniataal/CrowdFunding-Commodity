"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Info, ChevronRight, ChevronLeft, Check, Lock, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { COMMODITY_TEMPLATES, ICON_TO_IMAGE } from "@/lib/commodity-catalog"
import { Progress } from "@/components/ui/progress"

const STEPS = [
  { id: "basics", title: "Deal Basics" },
  { id: "shipping", title: "Logistics" },
  { id: "details", title: "Specifications" },
  { id: "financials", title: "Financials" },
  { id: "review", title: "Review" },
]

export function CreateDealForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    templateKey: "",
    name: "",
    type: "",
    icon: "",
    risk: "Medium",
    targetApy: "",
    duration: "",
    minInvestment: "1000",
    maxInvestment: "",
    platformFeeBps: "150",
    amountRequired: "",
    description: "",
    origin: "",
    destination: "",
    originLat: "",
    originLng: "",
    destLat: "",
    destLng: "",
    shipmentId: "",
    insuranceValue: "",
    transportMethod: "",
    riskScore: "5.0", // Default calculated later
    maturityDate: "",
    metalForm: "",
    purityPreset: "",
    purityPercent: "",
    karat: "",
    grossWeightTroyOz: "",
    refineryName: "",
    refineryLocation: "",
  })

  // Auto-fill effect when template is selected
  const handleTemplateSelect = (value: string) => {
    const t = COMMODITY_TEMPLATES.find((x) => x.key === value)
    if (!t) return

    setFormData((prev) => ({
      ...prev,
      templateKey: value,
      name: t.name,
      type: t.type,
      icon: t.icon,
      // Only override if not already set or if template has specific default
      risk: t.risk ?? prev.risk,
      targetApy: t.targetApy !== undefined ? String(t.targetApy) : prev.targetApy,
      duration: t.duration !== undefined ? String(t.duration) : prev.duration,
      insuranceValue: t.insuranceValue !== undefined ? String(t.insuranceValue) : prev.insuranceValue,
      transportMethod: t.transportMethod ?? prev.transportMethod,
      metalForm: (t as any).metalForm ?? prev.metalForm,
      purityPercent: (t as any).purityPercent !== undefined ? String((t as any).purityPercent) : prev.purityPercent,
      karat: (t as any).karat !== undefined ? String((t as any).karat) : prev.karat,
      grossWeightTroyOz: (t as any).grossWeightTroyOz !== undefined ? String((t as any).grossWeightTroyOz) : prev.grossWeightTroyOz,
      refineryName: (t as any).refineryName ?? prev.refineryName,
      refineryLocation: (t as any).refineryLocation ?? prev.refineryLocation,
    }))
  }

  // Auto-geocode function (background)
  const geocodeLocation = async (location: string, type: "origin" | "dest") => {
    if (!location || location.length < 3) return
    try {
      const res = await fetch(`/api/geocode?query=${encodeURIComponent(location)}`)
      if (res.ok) {
        const json = await res.json()
        setFormData((prev) => ({
          ...prev,
          [type === "origin" ? "originLat" : "destLat"]: String(json.data.lat),
          [type === "origin" ? "originLng" : "destLng"]: String(json.data.lng),
        }))
      }
    } catch (e) {
      console.error("Silent geocoding failed", e)
    }
  }

  const handleNext = () => {
    // Basic validation per step could go here
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setError("")
    setIsLoading(true)

    // Final data prep
    const payload = {
      ...formData,
      // Auto-generate shipment ID if missing
      shipmentId: formData.shipmentId || `SHP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    }

    try {
      const response = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create deal")
        setIsLoading(false)
        return
      }

      router.push("/admin/deals")
      router.refresh()
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Deal Basics
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label>Select Commodity Template</Label>
              <Select value={formData.templateKey} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Begin by choosing a commodity..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMODITY_TEMPLATES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        <Badge variant="outline" className="text-xs">{t.type}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the asset..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Value Required ($)</Label>
                <Input
                  type="number"
                  value={formData.amountRequired}
                  onChange={(e) => setFormData({ ...formData, amountRequired: e.target.value })}
                  placeholder="e.g. 250000"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (Days)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 90"
                />
              </div>
            </div>

            {(formData.templateKey && formData.icon) && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <img
                  src={ICON_TO_IMAGE[formData.icon as keyof typeof ICON_TO_IMAGE]}
                  alt="Preview"
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div>
                  <p className="font-medium">Marketplace Preview</p>
                  <p className="text-sm text-muted-foreground">This image will appear on the listing card.</p>
                </div>
              </div>
            )}
          </div>
        )

      case 1: // Logistics
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Origin Location</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    onBlur={() => geocodeLocation(formData.origin, "origin")}
                    placeholder="City, Country"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Coordinates calculated automatically.</p>
              </div>
              <div className="space-y-2">
                <Label>Destination Location</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    onBlur={() => geocodeLocation(formData.destination, "dest")}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Transport Method</Label>
              <Select value={formData.transportMethod} onValueChange={(v) => setFormData({ ...formData, transportMethod: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transport..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ocean Freight">Ocean Freight</SelectItem>
                  <SelectItem value="Air Cargo">Air Cargo</SelectItem>
                  <SelectItem value="Armored Truck">Armored Truck</SelectItem>
                  <SelectItem value="Rail Freight">Rail Freight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Collapsible className="border rounded-md p-4 bg-muted/20">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full">
                <ChevronRight className="h-4 w-4" />
                Advanced Shipment Details
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Shipment ID (Optional)</Label>
                  <Input
                    value={formData.shipmentId}
                    onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
                    placeholder="Leave blank to auto-generate"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origin Coords (Lat, Lng)</Label>
                    <div className="flex gap-2">
                      <Input value={formData.originLat} readOnly className="bg-muted" placeholder="0.00" />
                      <Input value={formData.originLng} readOnly className="bg-muted" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dest Coords (Lat, Lng)</Label>
                    <div className="flex gap-2">
                      <Input value={formData.destLat} readOnly className="bg-muted" placeholder="0.00" />
                      <Input value={formData.destLng} readOnly className="bg-muted" placeholder="0.00" />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )

      case 2: // Specs / Metals
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {formData.type === "Metals" ? (
              <>
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg text-amber-900">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Precious Metals Verification
                  </h4>
                  <p className="text-sm mt-1">
                    Please ensure all refinery details match the LBMA Good Delivery Rules.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Form</Label>
                    <Select value={formData.metalForm} onValueChange={(v) => setFormData({ ...formData, metalForm: v })}>
                      <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BULLION">Bullion</SelectItem>
                        <SelectItem value="DORE">Doré</SelectItem>
                        <SelectItem value="SCRAP">Scrap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (Troy Oz)</Label>
                    <Input
                      type="number"
                      value={formData.grossWeightTroyOz}
                      onChange={(e) => setFormData({ ...formData, grossWeightTroyOz: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Refinery Name</Label>
                  <Input
                    value={formData.refineryName}
                    onChange={(e) => setFormData({ ...formData, refineryName: e.target.value })}
                    placeholder="e.g. PAMP Suisse"
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>No specific technical specifications needed for {formData.type || "this commodity"}.</p>
                <p className="text-sm">Click Next to proceed to financials.</p>
              </div>
            )}
          </div>
        )

      case 3: // Financials
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label>Target APY (%)</Label>
              <Input
                type="number"
                step="0.1"
                className="text-lg font-semibold text-emerald-600"
                value={formData.targetApy}
                onChange={(e) => setFormData({ ...formData, targetApy: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Annualized Percentage Yield expected for investors.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min. Investment ($)</Label>
                <Input
                  type="number"
                  value={formData.minInvestment}
                  onChange={(e) => setFormData({ ...formData, minInvestment: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max. Investment ($)</Label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={formData.maxInvestment}
                  onChange={(e) => setFormData({ ...formData, maxInvestment: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Platform Fee (bps)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Basis points. 150 bps = 1.5% fee.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                value={formData.platformFeeBps}
                onChange={(e) => setFormData({ ...formData, platformFeeBps: e.target.value })}
              />
            </div>
          </div>
        )

      case 4: // Review
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Alert className="bg-muted/50">
              <Check className="h-4 w-4 text-emerald-600" />
              <AlertDescription>Review your deal details before publishing to the marketplace.</AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-y-4 text-sm border p-4 rounded-lg">
              <div className="text-muted-foreground">Commodity</div>
              <div className="font-medium text-right">{formData.name}</div>

              <div className="text-muted-foreground">Amount Required</div>
              <div className="font-medium text-right">${Number(formData.amountRequired).toLocaleString()}</div>

              <div className="text-muted-foreground">Route</div>
              <div className="font-medium text-right">{formData.origin} → {formData.destination}</div>

              <div className="text-muted-foreground">APY / Duration</div>
              <div className="font-medium text-right">{formData.targetApy}% / {formData.duration} days</div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By clicking "Publish Deal", the listing will become visible to all KYC-verified investors immediately.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i <= currentStep ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                  }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs mt-2 ${i <= currentStep ? "text-emerald-700 font-medium" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <Progress value={(currentStep / (STEPS.length - 1)) * 100} className="h-2" />
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>Step {currentStep + 1} of {STEPS.length}</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {renderStepContent()}
        </CardContent>

        <CardFooter className="flex justify-between bg-muted/20 p-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!formData.templateKey || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 w-32"
          >
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : currentStep === STEPS.length - 1 ? "Publish Deal" : <span className="flex items-center">Next <ChevronRight className="ml-2 h-4 w-4" /></span>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

