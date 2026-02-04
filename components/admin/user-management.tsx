"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AdminUserDetail, AdminUserSummary, AuditLogItem, DocumentType, KycStatus, UserRole } from "@/lib/domain"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Loader2, Search, UserPlus, ShieldCheck, ShieldX, KeyRound, UserX, UserCheck, ExternalLink } from "lucide-react"

const typeLabels: Record<DocumentType, string> = {
  BILL_OF_LADING: "Bill of Lading",
  INSURANCE_CERTIFICATE: "Insurance Certificate",
  QUALITY_CERTIFICATION: "Quality Certification",
  COMMODITY_CONTRACT: "Commodity Contract",
  KYC_ID: "KYC ID",
  KYC_PROOF_OF_ADDRESS: "KYC Proof of Address",
  OTHER: "Other",
}

function kycBadge(status: KycStatus) {
  const cls =
    status === "APPROVED"
      ? "border-emerald-500/50 text-emerald-500"
      : status === "PENDING"
        ? "border-amber-500/50 text-amber-500"
        : status === "REJECTED"
          ? "border-red-500/50 text-red-500"
          : "border-slate-500/30 text-muted-foreground"
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  )
}

function money(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function UserManagement({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient()

  const [q, setQ] = useState("")
  const [role, setRole] = useState<UserRole | "all">("all")
  const [kycStatus, setKycStatus] = useState<KycStatus | "all">("all")
  const [disabled, setDisabled] = useState<"all" | "true" | "false">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [createOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserSummary | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ["admin", "users", { q, role, kycStatus, disabled, page, pageSize }],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (q.trim()) sp.set("q", q.trim())
      if (role !== "all") sp.set("role", role)
      if (kycStatus !== "all") sp.set("kycStatus", kycStatus)
      if (disabled !== "all") sp.set("disabled", disabled)
      sp.set("page", String(page))
      sp.set("pageSize", String(pageSize))

      const res = await fetch(`/api/admin/users?${sp.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load users")
      return json as { data: AdminUserSummary[]; total: number; page: number; pageSize: number }
    },
  })

  const users = listQuery.data?.data ?? []
  const total = listQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const selectedId = selectedUserId

  const detailQuery = useQuery({
    queryKey: ["admin", "users", selectedId, "detail"],
    enabled: !!selectedId && detailOpen,
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${selectedId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load user")
      return (json.data as AdminUserDetail)
    },
  })

  const logsQuery = useQuery({
    queryKey: ["admin", "users", selectedId, "audit-logs"],
    enabled: !!selectedId && detailOpen,
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${selectedId}/audit-logs`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load audit logs")
      return (json.data as AuditLogItem[])
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: {
      email: string
      name: string
      role: UserRole
      kycStatus?: KycStatus
      phone?: string
      company?: string
    }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Create failed")
      return json as { data: AdminUserSummary; tempPassword: string | null }
    },
    onSuccess: async (data) => {
      setCreateOpen(false)
      setPage(1)
      await qc.invalidateQueries({ queryKey: ["admin", "users"] })
      toast({
        title: "User created",
        description: data.tempPassword
          ? `Temporary password: ${data.tempPassword} (copy it now)`
          : "User created successfully.",
      })
    },
    onError: (e) => toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      userId,
      patch,
    }: {
      userId: string
      patch: Partial<
        Pick<AdminUserDetail, "email" | "name" | "role" | "kycStatus" | "phone" | "company" | "disabled"> & {
          walletFrozen: boolean
        }
      >
    }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Update failed")
      return json.data as AdminUserSummary
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "users"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "detail"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "audit-logs"] }),
      ])
      toast({ title: "User updated" })
    },
    onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
  })

  const disableMutation = useMutation({
    mutationFn: async ({ userId, disabled }: { userId: string; disabled: boolean }) => {
      const res = disabled
        ? await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
        : await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disabled: false }),
        })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || "Update failed")
      return true
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "users"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "detail"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "audit-logs"] }),
      ])
      toast({ title: "User status updated" })
    },
    onError: (e) => toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" }),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/password-reset`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Reset failed")
      return json as { tempPassword: string | null }
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "audit-logs"] })
      toast({
        title: "Password reset",
        description: data.tempPassword ? `Temporary password: ${data.tempPassword} (copy it now)` : "Password updated.",
      })
    },
    onError: (e) =>
      toast({ title: "Password reset failed", description: (e as Error).message, variant: "destructive" }),
  })

  const walletAdjustMutation = useMutation({
    mutationFn: async ({
      userId,
      amount,
      type,
      reason,
    }: {
      userId: string
      amount: number
      type: "REFUND" | "PAYOUT" | "DIVIDEND" | "DEPOSIT" | "WITHDRAWAL" | "INVESTMENT"
      reason: string
    }) => {
      const res = await fetch(`/api/admin/users/${userId}/wallet-adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type, reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Wallet adjustment failed")
      return json.data as { transactionId: string; newBalance: number }
    },
    onSuccess: async (data) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "users"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "detail"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "audit-logs"] }),
      ])
      toast({ title: "Wallet adjusted", description: `New balance: ${money(data.newBalance)}` })
    },
    onError: (e) => toast({ title: "Wallet adjustment failed", description: (e as Error).message, variant: "destructive" }),
  })

  const kycActionMutation = useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: string; action: "approve" | "reject"; reason?: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || "KYC action failed")
      return true
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "users"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "detail"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "audit-logs"] }),
      ])
      toast({ title: "KYC updated" })
    },
    onError: (e) => toast({ title: "KYC action failed", description: (e as Error).message, variant: "destructive" }),
  })

  const verifyDocMutation = useMutation({
    mutationFn: async ({ docId, verified }: { docId: string; verified: boolean }) => {
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Update failed")
      return true
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "detail"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users", selectedId, "audit-logs"] }),
      ])
    },
    onError: (e) => toast({ title: "Document update failed", description: (e as Error).message, variant: "destructive" }),
  })

  const [docViewer, setDocViewer] = useState<{ url: string; name: string } | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [walletAdjustOpen, setWalletAdjustOpen] = useState(false)
  const [walletAdjustAmount, setWalletAdjustAmount] = useState("")
  const [walletAdjustType, setWalletAdjustType] = useState<"REFUND" | "PAYOUT" | "DIVIDEND" | "DEPOSIT" | "WITHDRAWAL" | "INVESTMENT">("REFUND")
  const [walletAdjustReason, setWalletAdjustReason] = useState("")

  const summary = useMemo(() => {
    const disabledCount = users.filter((u) => u.disabled).length
    return `${total.toLocaleString()} users • ${disabledCount.toLocaleString()} disabled`
  }, [users, total])

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">User Management</h2>
          <p className="text-muted-foreground">{summary}</p>
        </div>

        {isAdmin && (
          <Button className="bg-primary hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      <Card className="border border-white/10 bg-[#0A0A0A] p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Label className="sr-only">Search</Label>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 rounded-xl"
                placeholder="Search by name, email, or id…"
              />
            </div>
          </div>

          <div>
            <Label className="sr-only">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as any)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="AUDITOR">AUDITOR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="sr-only">KYC</Label>
            <Select
              value={kycStatus}
              onValueChange={(v) => {
                setKycStatus(v as any)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                <SelectValue placeholder="KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="NOT_STARTED">NOT_STARTED</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="APPROVED">APPROVED</SelectItem>
                <SelectItem value="REJECTED">REJECTED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="sr-only">Status</Label>
            <Select
              value={disabled}
              onValueChange={(v) => {
                setDisabled(v as any)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="false">Active</SelectItem>
                <SelectItem value="true">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 relative z-10">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white rounded-xl">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border-white/10 text-white hover:bg-white/10 rounded-xl">
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="border-white/10 text-white hover:bg-white/10 rounded-xl"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border border-white/10 bg-[#0A0A0A] rounded-2xl overflow-hidden">
        {listQuery.isLoading ? (
          <div className="p-8 text-sm text-muted-foreground flex items-center gap-2 justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading users…
          </div>
        ) : listQuery.isError ? (
          <div className="p-8 text-sm text-red-500 text-center">{(listQuery.error as Error).message}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">No users found.</div>
        ) : (
          <Table>
            <TableHeader className="bg-white/[0.02] border-b border-white/5">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                <TableHead className="text-muted-foreground font-medium">KYC</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Wallet</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Investments</TableHead>
                <TableHead className="text-muted-foreground font-medium">Joined</TableHead>
                <TableHead className="text-muted-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="cursor-pointer border-white/5 hover:bg-white/[0.03] transition-colors" onClick={() => {
                  setSelectedUserId(u.id)
                  setDetailOpen(true)
                }}>
                  <TableCell className="font-bold text-white">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/10 text-muted-foreground bg-white/5">{u.role}</Badge>
                  </TableCell>
                  <TableCell>{kycBadge(u.kycStatus)}</TableCell>
                  <TableCell>
                    {u.disabled ? (
                      <Badge variant="outline" className="border-red-500/20 text-red-500 bg-red-500/5">
                        Disabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-white">{money(u.walletBalance)}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{u._count.investments}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent border-white/10 text-white hover:bg-white/10"
                        onClick={() => {
                          setSelectedUserId(u.id)
                          setDetailOpen(true)
                        }}
                      >
                        View
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/10" onClick={() => setEditingUser(u)}>
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="bg-transparent border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
                                <KeyRound className="h-4 w-4 mr-1" />
                                Reset PW
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reset password?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This generates a temporary password for the user. You’ll need to copy it and share it securely.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => resetPasswordMutation.mutate(u.id)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  Reset
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className={`bg-transparent ${u.disabled ? "border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10" : "border-red-500/20 text-red-500 hover:bg-red-500/10"}`}>
                                {u.disabled ? <UserCheck className="h-4 w-4 mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
                                {u.disabled ? "Enable" : "Disable"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{u.disabled ? "Enable user?" : "Disable user?"}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {u.disabled
                                    ? "This will allow the user to sign in again."
                                    : "The user will be blocked from signing in and from most actions."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => disableMutation.mutate({ userId: u.id, disabled: !u.disabled })}
                                  className={u.disabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                                >
                                  {u.disabled ? "Enable" : "Disable"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateOrEditUserDialog
        open={createOpen || !!editingUser}
        mode={editingUser ? "edit" : "create"}
        isAdmin={isAdmin}
        user={editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditingUser(null)
          }
        }}
        onCreate={(payload) => createMutation.mutate(payload)}
        onUpdate={(userId, patch) => updateMutation.mutate({ userId, patch })}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <Sheet open={detailOpen} onOpenChange={(open) => setDetailOpen(open)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User details</SheetTitle>
            <SheetDescription>
              {selectedId ? <span className="font-mono text-xs">{selectedId}</span> : "Select a user"}
            </SheetDescription>
          </SheetHeader>

          {detailQuery.isLoading ? (
            <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : detailQuery.isError ? (
            <div className="mt-6 text-sm text-red-500">{(detailQuery.error as Error).message}</div>
          ) : !detailQuery.data ? (
            <div className="mt-6 text-sm text-muted-foreground">No user selected.</div>
          ) : (
            <div className="mt-6 space-y-4">
              <Card className="border border-white/10 p-6 bg-[#0A0A0A] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
                <div className="flex items-start justify-between gap-6 relative z-10">
                  <div className="flex-1">
                    <div className="text-xl font-bold text-white mb-1 tracking-tight">{detailQuery.data.name}</div>
                    <div className="text-sm text-muted-foreground mb-4 font-mono">{detailQuery.data.email}</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-muted-foreground font-mono">{detailQuery.data.role}</Badge>
                      {kycBadge(detailQuery.data.kycStatus)}
                      {detailQuery.data.disabled ? (
                        <Badge variant="outline" className="border-red-500/20 text-red-500 bg-red-500/5">
                          Disabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Wallet</div>
                        <div className="font-bold text-white text-lg">{money(detailQuery.data.walletBalance)}</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Wallet status</div>
                        <div className="font-medium text-base">
                          {(detailQuery.data as any).walletFrozen ? (
                            <span className="text-red-500 flex items-center gap-1"><ShieldX className="h-4 w-4" /> Frozen</span>
                          ) : (
                            <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Active</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Investments</div>
                        <div className="font-medium text-white">{detailQuery.data._count.investments}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Joined</div>
                        <div className="font-medium text-white">{new Date(detailQuery.data.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-xs">Last Updated</div>
                        <div className="font-medium text-white">{new Date(detailQuery.data.updatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="bg-transparent border-white/10 hover:bg-white/10 text-white" onClick={() => setEditingUser(detailQuery.data)}>
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className={(detailQuery.data as any).walletFrozen ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"}
                        onClick={() => {
                          if (!selectedId) return
                          updateMutation.mutate({
                            userId: selectedId,
                            patch: { walletFrozen: !(detailQuery.data as any).walletFrozen } as any,
                          })
                        }}
                        disabled={updateMutation.isPending}
                      >
                        {(detailQuery.data as any).walletFrozen ? "Unfreeze wallet" : "Freeze wallet"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white/10 hover:bg-white/10 text-white"
                        onClick={() => {
                          setWalletAdjustOpen(true)
                          setWalletAdjustAmount("")
                          setWalletAdjustType("REFUND")
                          setWalletAdjustReason("")
                        }}
                        disabled={walletAdjustMutation.isPending}
                      >
                        Adjust wallet
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                        onClick={() => selectedId && resetPasswordMutation.mutate(selectedId)}
                        disabled={resetPasswordMutation.isPending}
                      >
                        <KeyRound className="h-3 w-3 mr-1" />
                        Reset PW
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className={detailQuery.data.disabled ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"}
                        onClick={() =>
                          selectedId && disableMutation.mutate({ userId: selectedId, disabled: !detailQuery.data.disabled })
                        }
                        disabled={disableMutation.isPending}
                      >
                        {detailQuery.data.disabled ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                        {detailQuery.data.disabled ? "Enable" : "Disable"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Tabs defaultValue="kyc">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="kyc">KYC</TabsTrigger>
                  <TabsTrigger value="audit">Audit log</TabsTrigger>
                </TabsList>

                <TabsContent value="kyc" className="mt-4 space-y-4">
                  <Card className="border border-white/10 p-6 bg-[#0A0A0A]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">KYC Review</div>
                        <div className="text-sm text-muted-foreground">Documents submitted by the user</div>
                      </div>
                      {isAdmin && detailQuery.data.kycStatus === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                            onClick={() => selectedId && kycActionMutation.mutate({ userId: selectedId, action: "approve" })}
                            disabled={kycActionMutation.isPending}
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                            onClick={() => setRejectOpen(true)}
                            disabled={kycActionMutation.isPending}
                          >
                            <ShieldX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      {detailQuery.data.kycDocuments.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No KYC documents uploaded yet.</div>
                      ) : (
                        <div className="space-y-2">
                          {detailQuery.data.kycDocuments.map((d) => (
                            <Card key={d.id} className="border border-white/10 p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium truncate text-white">{d.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="border-white/10 bg-white/5 text-muted-foreground text-[10px] h-5">{typeLabels[d.type as DocumentType]}</Badge>
                                    <span>{new Date(d.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs bg-transparent border-white/10 hover:bg-white/10 text-white"
                                      onClick={() => setDocViewer({ url: d.url, name: d.name })}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    <a className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4" href={d.url} target="_blank" rel="noreferrer">
                                      Open in new tab
                                    </a>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {d.verified ? (
                                    <Badge className="bg-emerald-600/20 text-emerald-500 border-emerald-600/30">Verified</Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-white/20 text-muted-foreground">Unverified</Badge>
                                  )}
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs bg-transparent border-white/10 hover:bg-white/10"
                                      onClick={() => verifyDocMutation.mutate({ docId: d.id, verified: !d.verified })}
                                      disabled={verifyDocMutation.isPending}
                                    >
                                      {d.verified ? "Unverify" : "Verify"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="audit" className="mt-4 space-y-3">
                  <Card className="border border-white/10 p-6 bg-[#0A0A0A]">
                    <div className="font-semibold text-white">Audit trail</div>
                    <div className="text-sm text-muted-foreground">Recent actions on this user</div>
                  </Card>
                  {logsQuery.isLoading ? (
                    <Card className="border-2 p-4 text-sm text-muted-foreground">Loading audit logs…</Card>
                  ) : logsQuery.isError ? (
                    <Card className="border-2 p-4 text-sm text-red-500">{(logsQuery.error as Error).message}</Card>
                  ) : (logsQuery.data?.length ?? 0) === 0 ? (
                    <Card className="border-2 p-4 text-sm text-muted-foreground">No audit logs yet.</Card>
                  ) : (
                    <div className="space-y-2">
                      {(logsQuery.data ?? []).map((l) => (
                        <Card key={l.id} className="border border-white/10 p-4 bg-white/[0.02]">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 w-full">
                              <div className="font-medium text-white">{l.action}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {l.actor ? `${l.actor.name} (${l.actor.email})` : "Unknown actor"} •{" "}
                                {new Date(l.createdAt).toLocaleString()}
                              </div>
                              {l.changes && (
                                <pre className="mt-3 text-xs bg-black/50 border border-white/5 rounded-lg p-3 overflow-x-auto font-mono text-gray-300">
                                  {JSON.stringify(l.changes, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!docViewer} onOpenChange={(open) => !open && setDocViewer(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{docViewer?.name ?? "Document"}</DialogTitle>
          </DialogHeader>
          {docViewer?.url ? (
            <div className="h-[70vh]">
              <iframe title={docViewer.name} src={docViewer.url} className="w-full h-full rounded border" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No document URL.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Document is blurry / missing address…" />
            <div className="text-xs text-muted-foreground">This will be recorded in the audit log.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!selectedId) return
                kycActionMutation.mutate({ userId: selectedId, action: "reject", reason: rejectReason.trim() || undefined })
                setRejectReason("")
                setRejectOpen(false)
              }}
              disabled={kycActionMutation.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={walletAdjustOpen} onOpenChange={setWalletAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Creates a correction transaction and updates the user wallet balance immediately.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={walletAdjustType} onValueChange={(v) => setWalletAdjustType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REFUND">REFUND</SelectItem>
                    <SelectItem value="PAYOUT">PAYOUT</SelectItem>
                    <SelectItem value="DIVIDEND">DIVIDEND</SelectItem>
                    <SelectItem value="DEPOSIT">DEPOSIT</SelectItem>
                    <SelectItem value="WITHDRAWAL">WITHDRAWAL</SelectItem>
                    <SelectItem value="INVESTMENT">INVESTMENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={walletAdjustAmount}
                  onChange={(e) => setWalletAdjustAmount(e.target.value)}
                  placeholder="Use negative to debit"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={walletAdjustReason} onChange={(e) => setWalletAdjustReason(e.target.value)} placeholder="e.g. Bank transfer failed; reversing deposit" />
              <div className="text-xs text-muted-foreground">This will be recorded in the audit log.</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletAdjustOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (!selectedId) return
                const amt = Number.parseFloat(walletAdjustAmount)
                if (!Number.isFinite(amt) || amt === 0) {
                  toast({ title: "Invalid amount", description: "Enter a non-zero amount.", variant: "destructive" })
                  return
                }
                if (!walletAdjustReason.trim()) {
                  toast({ title: "Reason required", description: "Enter a reason for the adjustment.", variant: "destructive" })
                  return
                }
                walletAdjustMutation.mutate({
                  userId: selectedId,
                  amount: amt,
                  type: walletAdjustType,
                  reason: walletAdjustReason.trim(),
                })
                setWalletAdjustOpen(false)
              }}
              disabled={walletAdjustMutation.isPending}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateOrEditUserDialog({
  open,
  onOpenChange,
  mode,
  user,
  isAdmin,
  onCreate,
  onUpdate,
  isSaving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  user: (AdminUserSummary & Partial<Pick<AdminUserDetail, "phone" | "company">>) | null
  isAdmin: boolean
  onCreate: (payload: { email: string; name: string; role: UserRole; kycStatus?: KycStatus; phone?: string; company?: string }) => void
  onUpdate: (
    userId: string,
    patch: Partial<{ email: string; name: string; role: UserRole; kycStatus: KycStatus; phone: string | null; company: string | null; disabled: boolean }>
  ) => void
  isSaving: boolean
}) {
  const [email, setEmail] = useState(user?.email ?? "")
  const [name, setName] = useState(user?.name ?? "")
  const [role, setRole] = useState<UserRole>(user?.role ?? "USER")
  const [kycStatus, setKycStatus] = useState<KycStatus>(user?.kycStatus ?? "NOT_STARTED")
  const [phone, setPhone] = useState<string>(user?.phone ?? "")
  const [company, setCompany] = useState<string>(user?.company ?? "")

  // When switching users/mode/open, reset fields.
  useEffect(() => {
    if (!open) return
    if (mode === "edit" && user) {
      setEmail(user.email)
      setName(user.name)
      setRole(user.role)
      setKycStatus(user.kycStatus)
      setPhone(user.phone ?? "")
      setCompany(user.company ?? "")
      return
    }
    if (mode === "create") {
      setEmail("")
      setName("")
      setRole("USER")
      setKycStatus("NOT_STARTED")
      setPhone("")
      setCompany("")
    }
  }, [open, mode, user?.id])

  const title = mode === "create" ? "Add user" : "Edit user"

  const canSave = isAdmin && email.trim() && name.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!isAdmin ? (
          <div className="text-sm text-muted-foreground">Auditors have read-only access.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="AUDITOR">AUDITOR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>KYC Status</Label>
                <Select value={kycStatus} onValueChange={(v) => setKycStatus(v as KycStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="KYC status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">NOT_STARTED</SelectItem>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="APPROVED">APPROVED</SelectItem>
                    <SelectItem value="REJECTED">REJECTED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1…" />
              </div>
              <div>
                <Label>Company (optional)</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {mode === "create" ? "A temporary password will be generated and shown once." : "Password resets are done from the user actions menu."}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={!canSave || isSaving}
            onClick={() => {
              if (!isAdmin) return
              if (mode === "create") {
                onCreate({
                  email: email.trim(),
                  name: name.trim(),
                  role,
                  kycStatus,
                  ...(phone.trim() ? { phone: phone.trim() } : {}),
                  ...(company.trim() ? { company: company.trim() } : {}),
                })
              } else if (mode === "edit" && user) {
                onUpdate(user.id, {
                  email: email.trim(),
                  name: name.trim(),
                  role,
                  kycStatus,
                  phone: phone.trim() ? phone.trim() : null,
                  company: company.trim() ? company.trim() : null,
                })
                onOpenChange(false)
              }
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : mode === "create" ? (
              "Create"
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


