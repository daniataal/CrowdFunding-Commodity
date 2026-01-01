import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { HowItWorksView } from "@/components/how-it-works-view"

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main>
                <HowItWorksView />
            </main>
            <PublicFooter />
        </div>
    )
}
