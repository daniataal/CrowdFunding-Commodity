import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a template for this demo deployment. Replace with a production privacy policy and DPA as needed.
        </p>
      </div>

      <Card className="border-2 bg-card/50 backdrop-blur p-6">
        <div className="space-y-6 text-sm leading-6">
          <section className="space-y-2">
            <h2 className="text-base font-semibold">1. Data we collect</h2>
            <p className="text-muted-foreground">
              Account data (name, email), verification documents (for KYC), transaction activity, and basic device/log
              data used for security and fraud prevention.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">2. How we use data</h2>
            <p className="text-muted-foreground">
              To operate the platform, process transactions, verify identity, secure accounts, and meet legal and
              regulatory requirements.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">3. Sharing</h2>
            <p className="text-muted-foreground">
              We may share data with service providers (e.g., KYC vendors, hosting, analytics) and when required by law.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">4. Retention</h2>
            <p className="text-muted-foreground">
              We retain data as necessary for providing services and meeting compliance obligations (often multiple
              years for financial records).
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold">5. Your rights</h2>
            <p className="text-muted-foreground">
              Depending on your jurisdiction, you may have rights to access, correct, delete, or port your data. Contact
              support for requests.
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


