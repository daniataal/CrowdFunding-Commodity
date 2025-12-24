"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">Get answers and reach out for assistance</p>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10 pr-4"
          />
        </div>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">FAQs</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          {faqs.map((category, idx) => {
            const Icon = category.icon
            return (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-emerald-500" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, qIdx) => (
                      <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                        <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-500" />
                  Live Chat
                </CardTitle>
                <CardDescription>Get instant help from our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500">Start Chat</Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">Average response time: 2 minutes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-emerald-500" />
                  Email Support
                </CardTitle>
                <CardDescription>Send us a detailed message</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Send Email
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  support@commodityflow.com
                  <br />
                  Response within 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-emerald-500" />
                  Phone Support
                </CardTitle>
                <CardDescription>Speak with a specialist</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Call Now
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  +1 (888) 555-0123
                  <br />
                  Mon-Fri, 9AM-6PM EST
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-emerald-500" />
                  Help Center
                </CardTitle>
                <CardDescription>Browse our knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Visit Help Center
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  300+ articles and guides
                  <br />
                  Available 24/7
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>Fill out the form and we'll get back to you shortly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="How can we help?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe your issue or question..."
                />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500">Send Message</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-emerald-500" />
                <CardTitle>Getting Started Guide</CardTitle>
                <CardDescription>Complete walkthrough for new investors</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-emerald-500" />
                <CardTitle>Investment Strategies</CardTitle>
                <CardDescription>Learn about diversification and risk management</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-emerald-500" />
                <CardTitle>Tax Guide</CardTitle>
                <CardDescription>Understanding commodity investment taxation</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-emerald-500" />
                <CardTitle>Risk Disclosure</CardTitle>
                <CardDescription>Important information about investment risks</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-emerald-500" />
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>For developers building integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  View Docs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-emerald-500" />
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Step-by-step platform tutorials</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Watch Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
