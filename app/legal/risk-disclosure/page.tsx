import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

export default function RiskDisclosurePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Risk Disclosure</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a template disclosure for demo purposes. Replace with counsel-reviewed disclosures for your offering.
        </p>
      </div>

      <Alert className="mb-6 border-2 bg-card/50 backdrop-blur">
        <ShieldAlert />
        <AlertTitle>Not investment advice</AlertTitle>
        <AlertDescription>
          Content provided on this platform is for informational purposes only and does not constitute investment,
          legal, or tax advice.
        </AlertDescription>
      </Alert>

      <Card className="border-2 bg-card/50 backdrop-blur p-6">
        <div className="space-y-6 text-sm leading-6">
          <section className="space-y-2">
            <h2 className="text-base font-semibold">1. Loss of principal</h2>
            <p className="text-muted-foreground">
              Investments may lose value. You could lose some or all of your invested capital.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">2. Commodity & price risk</h2>
            <p className="text-muted-foreground">
              Commodity prices can be volatile and influenced by supply/demand, weather, geopolitics, regulation, and
              macroeconomic factors.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">3. Logistics & operational risk</h2>
            <p className="text-muted-foreground">
              Shipments can be delayed, damaged, seized, or otherwise impacted by transit incidents, port congestion,
              customs, or sanctions.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">4. Counterparty & credit risk</h2>
            <p className="text-muted-foreground">
              Buyers, suppliers, brokers, insurers, and other counterparties may fail to perform obligations.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">5. Regulatory & tax risk</h2>
            <p className="text-muted-foreground">
              Laws and regulations may change. Tax treatment may vary by jurisdiction and individual circumstances.
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


