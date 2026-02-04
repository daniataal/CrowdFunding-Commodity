import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          These terms are a template for this demo deployment. Replace with counsel-reviewed terms before production.
        </p>
      </div>

      <Card className="border-2 bg-card/50 backdrop-blur p-6">
        <div className="space-y-6 text-sm leading-6">
          <section className="space-y-2">
            <h2 className="text-base font-semibold">1. Platform overview</h2>
            <p className="text-muted-foreground">
              CommodityFlow provides a marketplace to fund commodity-related transactions. Offerings are not bank
              deposits and may be subject to loss of principal.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">2. Eligibility & KYC</h2>
            <p className="text-muted-foreground">
              You may be required to complete identity verification (KYC/AML) before investing. We may restrict or
              suspend accounts that fail verification or violate compliance requirements.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">3. Investments & risk</h2>
            <p className="text-muted-foreground">
              Commodity investments involve market, logistics, counterparty, FX, and regulatory risks. Target yields
              are estimates and are not guaranteed. Review the Risk Disclosure before investing.
            </p>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/legal/risk-disclosure">Read Risk Disclosure</Link>
            </Button>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">4. Fees</h2>
            <p className="text-muted-foreground">
              Fees may apply to investments, withdrawals, or other services. Any applicable fees should be disclosed at
              the point of transaction.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">5. Contact</h2>
            <p className="text-muted-foreground">
              For questions, contact support via the in-app Help view or email{" "}
              <a className="underline" href="mailto:support@commodityflow.com">
                support@commodityflow.com
              </a>
              .
            </p>
          </section>
        </div>
      </Card>

      <div className="mt-6 text-sm text-muted-foreground">
        <Link className="underline" href="/">
          Back to home
        </Link>
      </div>
    </div>
  )
}


