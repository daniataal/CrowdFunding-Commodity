"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ArrowRight, CheckCircle2 } from "lucide-react"

interface OnboardingTourProps {
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to CommodityFlow",
      description: "Your gateway to institutional-grade commodity investments",
      content:
        "Get started with fractional ownership of real commodities backed by physical assets and blockchain transparency.",
    },
    {
      title: "Explore the Marketplace",
      description: "Browse and filter investment opportunities",
      content:
        "Find commodities that match your risk profile and investment goals. Each listing shows detailed information including expected returns, duration, and shipment tracking.",
    },
    {
      title: "Track Your Portfolio",
      description: "Monitor your investments in real-time",
      content:
        "View your total portfolio value, individual investment performance, and transaction history all in one place. Get real-time updates on shipment status.",
    },
    {
      title: "Manage Your Wallet",
      description: "Deposits, withdrawals, and transactions",
      content:
        "Easily add funds to invest, withdraw your earnings, and track all financial activity. Multiple payment methods supported with secure processing.",
    },
    {
      title: "Stay Informed",
      description: "Notifications and activity feed",
      content:
        "Receive instant notifications about dividends, shipment updates, and market alerts. Track your complete investment history in the Activity section.",
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="relative w-full max-w-2xl border-2 border-primary/20 shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={onSkip}
        >
          <X className="h-5 w-5" />
        </Button>

        <CardHeader>
          <div className="mb-4 flex items-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors ${idx <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
              />
            ))}
          </div>
          <CardTitle className="text-2xl">{step.title}</CardTitle>
          <CardDescription className="text-base">{step.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{step.content}</p>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onSkip} className="bg-transparent">
                Skip Tour
              </Button>
              <Button onClick={handleNext} className="gap-2 bg-primary hover:bg-primary/90">
                {currentStep < steps.length - 1 ? (
                  <>
                    Next <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Get Started <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
