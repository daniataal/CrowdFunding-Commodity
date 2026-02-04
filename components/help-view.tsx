"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  HelpCircle,
  Shield,
  DollarSign,
  TrendingUp,
} from "lucide-react"

export function HelpView() {
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const faqs = [
    {
      category: "Getting Started",
      icon: BookOpen,
      questions: [
        {
          q: "How do I start investing in commodities?",
          a: "To begin investing, browse our Marketplace to find commodities that match your risk profile and investment goals. Each listing shows detailed information including expected returns, duration, and risk level. Click 'Invest Now' to commit funds to a shipment.",
        },
        {
          q: "What is the minimum investment amount?",
          a: "The minimum investment varies by commodity but typically starts at $1,000. Each listing displays its specific minimum and maximum investment amounts. You can invest in multiple shipments to diversify your portfolio.",
        },
        {
          q: "How long does it take to see returns?",
          a: "Investment durations range from 30 to 90 days depending on the commodity and shipping route. Returns are distributed within 5 business days after the shipment is successfully sold and settled.",
        },
      ],
    },
    {
      category: "Payments & Security",
      icon: Shield,
      questions: [
        {
          q: "How secure is my investment?",
          a: "All investments are backed by physical commodities with full insurance coverage. We use blockchain technology for transparent tracking and employ bank-level encryption to protect your account. Each shipment is insured for its full value plus margins.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept bank transfers (ACH), wire transfers, and major credit cards. All transactions are processed through secure, PCI-compliant payment gateways. Funds typically clear within 1-3 business days.",
        },
        {
          q: "How do I withdraw my earnings?",
          a: "Navigate to your Wallet, click 'Withdraw', and enter your desired amount. Withdrawals are processed to your verified bank account within 3-5 business days. Minimum withdrawal amount is $100.",
        },
      ],
    },
    {
      category: "Investments",
      icon: TrendingUp,
      questions: [
        {
          q: "What happens if a shipment is delayed?",
          a: "Delays are rare but can occur due to weather or customs. You'll receive real-time notifications about any status changes. Insurance covers extended storage costs, and adjusted returns are calculated fairly based on the actual completion date.",
        },
        {
          q: "Can I sell my investment before completion?",
          a: "Yes, through our secondary market feature (coming soon). You can list your stake for other investors to purchase, though prices may vary based on market conditions and shipment progress.",
        },
        {
          q: "How are returns calculated?",
          a: "Returns are based on the difference between the purchase price and final sale price of the commodity, minus operational costs. Your percentage return depends on your stake in the shipment and the actual market price at destination.",
        },
      ],
    },
    {
      category: "Account Management",
      icon: DollarSign,
      questions: [
        {
          q: "How do I verify my account?",
          a: "Go to Settings > Security and complete identity verification by uploading a government-issued ID. Verification typically takes 24-48 hours and is required for investments over $10,000.",
        },
        {
          q: "Can I have multiple accounts?",
          a: "Each person is limited to one individual account, but you can open additional institutional or corporate accounts for business entities with proper documentation.",
        },
        {
          q: "What are the fees?",
          a: "We charge a 1.5% platform fee on successful investments, deducted from returns. There are no deposit fees, and withdrawal fees are $5 per transaction. Detailed fee breakdowns are shown before each investment.",
        },
      ],
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
        <p className="text-muted-foreground">Get answers and reach out for assistance</p>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-4 bg-[#0A0A0A] border-white/10 text-white placeholder:text-muted-foreground/50 rounded-xl focus-visible:ring-primary/50 text-lg"
          />
        </div>
      </div>

      <Tabs defaultValue="faq" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 bg-[#0A0A0A] border border-white/10 p-1 h-auto rounded-xl gap-1">
          <TabsTrigger value="faq" className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">FAQs</TabsTrigger>
          <TabsTrigger value="contact" className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Contact Us</TabsTrigger>
          <TabsTrigger value="resources" className="h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          {faqs.map((category, idx) => {
            const Icon = category.icon
            return (
              <Card key={idx} className="border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, qIdx) => (
                      <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`} className="border-b border-white/5 last:border-0 px-6">
                        <AccordionTrigger className="text-left text-white hover:text-primary transition-colors py-4 text-base">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="contact" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "Live Chat", icon: MessageCircle, desc: "Get instant help", action: "Start Chat", onClick: () => toast({ title: "Live chat", description: "Live chat isn’t enabled in this deployment yet.", }) },
              { title: "Email Support", icon: Mail, desc: "Send us a message", action: "Send Email", onClick: () => { window.location.href = "mailto:support@commodityflow.com" } },
              { title: "Phone Support", icon: Phone, desc: "Speak with a specialist", action: "Call Now", onClick: () => toast({ title: "Phone support", description: "Phone calling isn’t available from the web app yet.", }) },
              { title: "Help Center", icon: HelpCircle, desc: "Browse knowledge base", action: "Visit Help Center", onClick: () => toast({ title: "Help Center", description: "The help center is coming soon.", }) }
            ].map((item, i) => (
              <Card key={i} className="border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                      <item.icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className={`w-full ${i === 0 ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
                    onClick={item.onClick}
                  >
                    {item.action}
                  </Button>
                  {(i === 0) && <p className="mt-3 text-center text-xs text-muted-foreground">Average response time: 2 minutes</p>}
                  {(i === 1) && <p className="mt-3 text-center text-xs text-muted-foreground">Response within 24 hours</p>}
                  {(i === 2) && <p className="mt-3 text-center text-xs text-muted-foreground">Mon-Fri, 9AM-6PM EST</p>}
                  {(i === 3) && <p className="mt-3 text-center text-xs text-muted-foreground">Available 24/7</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-white/10 bg-[#0A0A0A] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">Send us a message</CardTitle>
              <CardDescription className="text-muted-foreground">Fill out the form and we'll get back to you shortly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Name</label>
                  <Input placeholder="John Doe" className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Email</label>
                  <Input type="email" placeholder="john@example.com" className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Subject</label>
                <Input placeholder="How can we help?" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Message</label>
                <textarea
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus-visible:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Describe your issue or question..."
                />
              </div>
              <Button
                className="w-full bg-primary hover:bg-red-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-red-500/20"
                onClick={() =>
                  toast({
                    title: "Message sent",
                    description: "Thanks! Support messaging isn’t wired up yet, but your form looks good.",
                  })
                }
              >
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Getting Started Guide", desc: "Complete walkthrough", action: "Download PDF" },
              { title: "Investment Strategies", desc: "Diversification & risk", action: "Download PDF" },
              { title: "Tax Guide", desc: "Investment taxation", action: "Download PDF" },
              { title: "Risk Disclosure", desc: "Important risk info", action: "Download PDF" },
              { title: "API Documentation", desc: "For developers", action: "View Docs" },
              { title: "Video Tutorials", desc: "Platform tutorials", action: "Watch Now" }
            ].map((item, i) => (
              <Card key={i} className="border border-white/10 bg-[#0A0A0A] rounded-2xl group hover:border-primary/50 transition-all">
                <CardHeader>
                  <FileText className="mb-4 h-8 w-8 text-primary group-hover:text-white transition-colors" />
                  <CardTitle className="text-white group-hover:text-primary transition-colors">{item.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full bg-white/5 border-white/10 text-white hover:bg-primary hover:border-primary hover:text-white transition-all"
                    onClick={() =>
                      toast({
                        title: "Resource",
                        description: "Resources aren’t enabled yet for this deployment.",
                      })
                    }
                  >
                    {item.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
