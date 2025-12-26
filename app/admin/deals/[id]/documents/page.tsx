import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DealDocumentsManager } from "@/components/admin/deal-documents-manager"

export const dynamic = "force-dynamic"

export default async function DealDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) redirect("/admin/deals")

  const session = await auth()
  if (!session?.user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "AUDITOR")) redirect("/")

  const commodity = await prisma.commodity.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!commodity) redirect("/admin/deals")

  const isAdmin = dbUser.role === "ADMIN"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deal Documents</h2>
          <p className="text-muted-foreground">{commodity.name}</p>
        </div>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href={`/admin/deals/${commodity.id}`}>Back to deal</Link>
        </Button>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Manage documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DealDocumentsManager commodityId={commodity.id} isAdmin={isAdmin} />
        </CardContent>
      </Card>
    </div>
  )
}


