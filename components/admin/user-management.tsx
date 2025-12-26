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
      patch: Partial<Pick<AdminUserDetail, "email" | "name" | "role" | "kycStatus" | "phone" | "company" | "disabled">>
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

  const summary = useMemo(() => {
    const disabledCount = users.filter((u) => u.disabled).length
    return `${total.toLocaleString()} users • ${disabledCount.toLocaleString()} disabled`
  }, [users, total])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">{summary}</p>
        </div>

        {isAdmin && (
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      <Card className="border-2 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
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
                className="pl-9"
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
              <SelectTrigger>
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
              <SelectTrigger>
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
              <SelectTrigger>
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

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-2">
        {listQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
          </div>
        ) : listQuery.isError ? (
          <div className="p-6 text-sm text-red-500">{(listQuery.error as Error).message}</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No users found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Wallet</TableHead>
                <TableHead className="text-right">Investments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => {
                  setSelectedUserId(u.id)
                  setDetailOpen(true)
                }}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>{kycBadge(u.kycStatus)}</TableCell>
                  <TableCell>
                    {u.disabled ? (
                      <Badge variant="outline" className="border-red-500/50 text-red-500">
                        Disabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{money(u.walletBalance)}</TableCell>
                  <TableCell className="text-right">{u._count.investments}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(u.id)
                          setDetailOpen(true)
                        }}
                      >
                        View
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditingUser(u)}>
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-amber-500">
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
                                  className="bg-amber-600 hover:bg-amber-700"
                                >
                                  Reset
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className={u.disabled ? "text-emerald-500" : "text-red-500"}>
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
                                  className={u.disabled ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
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
              <Card className="border-2 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold">{detailQuery.data.name}</div>
                    <div className="text-sm text-muted-foreground">{detailQuery.data.email}</div>
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <Badge variant="outline">{detailQuery.data.role}</Badge>
                      {kycBadge(detailQuery.data.kycStatus)}
                      {detailQuery.data.disabled ? (
                        <Badge variant="outline" className="border-red-500/50 text-red-500">
                          Disabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Wallet</div>
                        <div className="font-medium">{money(detailQuery.data.walletBalance)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Investments</div>
                        <div className="font-medium">{detailQuery.data._count.investments}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Joined</div>
                        <div className="font-medium">{new Date(detailQuery.data.createdAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Updated</div>
                        <div className="font-medium">{new Date(detailQuery.data.updatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button variant="outline" onClick={() => setEditingUser(detailQuery.data)}>
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        className="text-amber-500"
                        onClick={() => selectedId && resetPasswordMutation.mutate(selectedId)}
                        disabled={resetPasswordMutation.isPending}
                      >
                        <KeyRound className="h-4 w-4 mr-1" />
                        Reset PW
                      </Button>

                      <Button
                        variant="outline"
                        className={detailQuery.data.disabled ? "text-emerald-500" : "text-red-500"}
                        onClick={() =>
                          selectedId && disableMutation.mutate({ userId: selectedId, disabled: !detailQuery.data.disabled })
                        }
                        disabled={disableMutation.isPending}
                      >
                        {detailQuery.data.disabled ? <UserCheck className="h-4 w-4 mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
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
                  <Card className="border-2 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">KYC Review</div>
                        <div className="text-sm text-muted-foreground">Documents submitted by the user</div>
                      </div>
                      {isAdmin && detailQuery.data.kycStatus === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => selectedId && kycActionMutation.mutate({ userId: selectedId, action: "approve" })}
                            disabled={kycActionMutation.isPending}
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
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
                            <Card key={d.id} className="border p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{d.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {typeLabels[d.type as DocumentType]} • {new Date(d.createdAt).toLocaleString()}
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDocViewer({ url: d.url, name: d.name })}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    <a className="text-sm text-primary underline underline-offset-4" href={d.url} target="_blank" rel="noreferrer">
                                      Open in new tab
                                    </a>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {d.verified ? (
                                    <Badge className="bg-emerald-600">Verified</Badge>
                                  ) : (
                                    <Badge variant="outline">Unverified</Badge>
                                  )}
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="outline"
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
                  <Card className="border-2 p-4">
                    <div className="font-semibold">Audit trail</div>
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
                        <Card key={l.id} className="border p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-medium">{l.action}</div>
                              <div className="text-xs text-muted-foreground">
                                {l.actor ? `${l.actor.name} (${l.actor.email})` : "Unknown actor"} •{" "}
                                {new Date(l.createdAt).toLocaleString()}
                              </div>
                              {l.changes && (
                                <pre className="mt-2 text-xs bg-muted/40 rounded p-2 overflow-x-auto">
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


