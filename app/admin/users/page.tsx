import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApproveKycButton, RejectKycButton } from "@/components/admin/kyc-actions"
import { format } from "date-fns"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: { filter?: string }
}) {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const where: any = {}

  if (searchParams?.filter === "kyc_pending") {
    where.kycStatus = "PENDING"
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { investments: true, transactions: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">View and manage platform users</p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {searchParams?.filter === "kyc_pending"
              ? "Users with pending KYC verification"
              : "All platform users"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Investments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.kycStatus === "APPROVED"
                          ? "border-emerald-500/50 text-emerald-500"
                          : user.kycStatus === "PENDING"
                            ? "border-amber-500/50 text-amber-500"
                            : user.kycStatus === "REJECTED"
                              ? "border-red-500/50 text-red-500"
                              : ""
                      }
                    >
                      {user.kycStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>${Number(user.walletBalance).toLocaleString()}</TableCell>
                  <TableCell>{user._count.investments}</TableCell>
                  <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {isAdmin && user.kycStatus === "PENDING" && (
                      <div className="flex gap-2">
                        <ApproveKycButton userId={user.id} />
                        <RejectKycButton userId={user.id} />
                      </div>
                    )}
                    {!isAdmin && user.kycStatus === "PENDING" && (
                      <span className="text-xs text-muted-foreground">Pending (admin action required)</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

