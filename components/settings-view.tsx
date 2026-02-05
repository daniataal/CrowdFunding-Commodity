"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Lock, Bell, Palette, Shield, CreditCard, Save, Upload, FileText, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CommodityDocument, KycStatus, UserProfile, WalletTransaction } from "@/lib/domain"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SettingsView({
  defaultTab = "profile",
}: {
  defaultTab?: "profile" | "kyc" | "security" | "notifications" | "preferences" | "billing"
}) {
  const { data: session, update } = useSession()
  const user = session?.user
  const [isSaving, setIsSaving] = useState(false)
  const qc = useQueryClient()
  const { toast } = useToast()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  // Profile state
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [bio, setBio] = useState("")

  // Security state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [investmentAlerts, setInvestmentAlerts] = useState(true)
  const [marketUpdates, setMarketUpdates] = useState(false)
  const [weeklyReport, setWeeklyReport] = useState(true)

  // Preferences state
  const [currency, setCurrency] = useState("USD")
  const [timezone, setTimezone] = useState("America/New_York")
  const [language, setLanguage] = useState("en")

  // KYC state
  const [idFile, setIdFile] = useState<File | null>(null)
  const [addressFile, setAddressFile] = useState<File | null>(null)
  const [kycError, setKycError] = useState("")

  const profileQuery = useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load profile")
      return json.data as UserProfile
    },
  })

  const kycDocsQuery = useQuery({
    queryKey: ["user", "kyc", "documents"],
    queryFn: async () => {
      const res = await fetch("/api/user/kyc")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load KYC documents")
      return json.data as CommodityDocument[]
    },
  })

  const currentSessionQuery = useQuery({
    queryKey: ["security", "current-session"],
    queryFn: async () => {
      const res = await fetch("/api/sessions/current")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load session")
      return json.data as { userAgent: string | null; ip: string | null; lastSeenAt: string }
    },
  })

  const billingTransactionsQuery = useQuery({
    queryKey: ["billing", "transactions"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/transactions")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load transactions")
      return json.data as WalletTransaction[]
    },
  })

  useEffect(() => {
    const p = profileQuery.data
    if (!p) return
    setName(p.name ?? "")
    setEmail(p.email ?? "")
    setPhone(p.phone ?? "")
    setCompany(p.company ?? "")
    setBio(p.bio ?? "")
    setTwoFactorEnabled(!!p.twoFactorEnabled)
    setEmailNotifications(!!p.emailNotifications)
    setPushNotifications(!!p.pushNotifications)
    setInvestmentAlerts(!!p.investmentAlerts)
    setMarketUpdates(!!p.marketUpdates)
    setWeeklyReport(!!p.weeklyReport)
    setCurrency(p.currency ?? "USD")
    setTimezone(p.timezone ?? "America/New_York")
    setLanguage(p.language ?? "en")
  }, [profileQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phone || null,
          company: company || null,
          bio: bio || null,
          twoFactorEnabled,
          emailNotifications,
          pushNotifications,
          investmentAlerts,
          marketUpdates,
          weeklyReport,
          currency,
          timezone,
          language,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save profile")
      return json.data as UserProfile
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["user", "profile"] })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to update password")
      return true
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!file.type.startsWith("image/")) throw new Error("Photo must be an image")
      if (file.size > 2 * 1024 * 1024) throw new Error("Max size is 2MB")

      const formData = new FormData()
      formData.append("avatar", file)
      const res = await fetch("/api/user/avatar", { method: "POST", body: formData })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || "Failed to upload photo")
      return (json as any).data as { avatar: string }
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["user", "profile"] })
      await update({ avatar: data.avatar })
      toast({ title: "Photo updated", description: "Your profile photo has been updated." })
    },
    onError: (e) => {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" })
    },
  })

  const uploadKycMutation = useMutation({
    mutationFn: async () => {
      if (!idFile || !addressFile) throw new Error("Please upload both documents")
      const formData = new FormData()
      formData.append("idDocument", idFile)
      formData.append("addressDocument", addressFile)
      const res = await fetch("/api/kyc/upload", { method: "POST", body: formData })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || "Failed to upload documents")
      return true
    },
    onSuccess: async () => {
      setIdFile(null)
      setAddressFile(null)
      setKycError("")
      await Promise.all([qc.invalidateQueries({ queryKey: ["user", "profile"] }), qc.invalidateQueries({ queryKey: ["user", "kyc", "documents"] })])
      await update({ kycStatus: "PENDING" })
      toast({ title: "KYC submitted", description: "Your documents were submitted for review." })
    },
    onError: (e) => {
      setKycError((e as Error).message)
      toast({ title: "KYC upload failed", description: (e as Error).message, variant: "destructive" })
    },
  })

  const kycStatus = (profileQuery.data?.kycStatus ?? session?.user?.kycStatus ?? "NOT_STARTED") as KycStatus
  // IMPORTANT: if a file input is disabled, our Input component sets `pointer-events-none`,
  // which prevents the OS file picker from opening. Match /kyc-verification: only lock when APPROVED.
  const kycFilePickDisabled = kycStatus === "APPROVED"
  const kycSubmitDisabled = kycStatus === "APPROVED"

  const kycStatusBadge = useMemo(() => {
    const cls =
      kycStatus === "APPROVED"
        ? "border-primary/50 text-primary"
        : kycStatus === "PENDING"
          ? "border-accent/50 text-accent"
          : kycStatus === "REJECTED"
            ? "border-red-500/50 text-red-500"
            : "border-slate-500/30 text-muted-foreground"
    return (
      <Badge variant="outline" className={cls}>
        {kycStatus}
      </Badge>
    )
  }, [kycStatus])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveMutation.mutateAsync()
      toast({ title: "Saved", description: "Your settings have been updated." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Missing fields", description: "Please fill in all password fields.", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please confirm your new password.", variant: "destructive" })
      return
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({ title: "Password updated", description: "Your password has been changed successfully." })
    } catch (e) {
      toast({
        title: "Password update failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-[#0A0A0A] border border-white/10 p-1 h-auto rounded-xl gap-1">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 rounded-lg">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 rounded-lg">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">KYC</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 rounded-lg">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 rounded-lg">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 rounded-lg">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 rounded-lg">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px]" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription className="text-muted-foreground">Update your personal information and profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10">
              <div className="flex items-center gap-8">
                <Avatar className="h-28 w-28 border-2 border-white/10 shadow-xl">
                  <AvatarImage src={profileQuery.data?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-[#151515] text-3xl text-primary font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadAvatarMutation.isPending}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null
                      e.currentTarget.value = ""
                      if (!f) return
                      uploadAvatarMutation.mutate(f)
                    }}
                  />
                  <Button
                    variant="outline"
                    className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white mb-2"
                    disabled={uploadAvatarMutation.isPending}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {uploadAvatarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadAvatarMutation.isPending ? "Uploading..." : "Upload Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email changes are not supported yet.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-white">Company</Label>
                  <Input
                    id="company"
                    placeholder="Acme Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <textarea
                  id="bio"
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus-visible:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 px-8"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">Account Type</CardTitle>
              <CardDescription className="text-muted-foreground">Your current account status and verification level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-6">
                <div>
                  <div className="font-bold text-white text-lg">Individual Investor</div>
                  <div className="text-sm text-muted-foreground">Standard investment limits apply</div>
                </div>
                <Button
                  variant="outline"
                  className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() =>
                    toast({
                      title: "Upgrade",
                      description: "Institutional upgrades aren’t available yet. Please contact support for help.",
                    })
                  }
                >
                  Upgrade to Institutional
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC Tab */}
        <TabsContent value="kyc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KYC Verification</CardTitle>
              <CardDescription>Upload identification documents to verify your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <div className="font-semibold">Verification status</div>
                  <div className="text-sm text-muted-foreground">
                    {kycStatus === "APPROVED"
                      ? "Verified — full access enabled."
                      : kycStatus === "PENDING"
                        ? "Under review — we’ll notify you once complete."
                        : kycStatus === "REJECTED"
                          ? "Rejected — please resubmit clear documents."
                          : "Not started — please submit documents."}
                  </div>
                </div>
                {kycStatusBadge}
              </div>

              {kycStatus === "REJECTED" && (
                <Alert variant="destructive">
                  <AlertDescription>Your previous submission was rejected. Please upload new documents.</AlertDescription>
                </Alert>
              )}

              {kycStatus === "PENDING" && (
                <Alert className="bg-accent/10 border-accent/20">
                  <AlertDescription className="text-accent">
                    Your documents are being reviewed. You can still resubmit if you need to correct something.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="border-2 p-4">
                <div className="font-medium">Upload documents</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Accepted formats: JPG, PNG, PDF (Max 5MB)
                </div>

                {kycError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{kycError}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="kyc-id">Government-Issued ID</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="kyc-id"
                        type="file"
                        accept="image/*,.pdf"
                        disabled={kycFilePickDisabled || uploadKycMutation.isPending}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null
                          if (f && f.size > 5 * 1024 * 1024) return setKycError("File size must be less than 5MB")
                          if (f && !f.type.startsWith("image/") && f.type !== "application/pdf") return setKycError("File must be an image or PDF")
                          setKycError("")
                          setIdFile(f)
                        }}
                        className="flex-1"
                      />
                      {idFile && (
                        <Badge variant="outline" className="gap-2">
                          <FileText className="h-3 w-3" />
                          {idFile.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kyc-address">Proof of Address</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="kyc-address"
                        type="file"
                        accept="image/*,.pdf"
                        disabled={kycFilePickDisabled || uploadKycMutation.isPending}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null
                          if (f && f.size > 5 * 1024 * 1024) return setKycError("File size must be less than 5MB")
                          if (f && !f.type.startsWith("image/") && f.type !== "application/pdf") return setKycError("File must be an image or PDF")
                          setKycError("")
                          setAddressFile(f)
                        }}
                        className="flex-1"
                      />
                      {addressFile && (
                        <Badge variant="outline" className="gap-2">
                          <FileText className="h-3 w-3" />
                          {addressFile.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      disabled={kycSubmitDisabled || uploadKycMutation.isPending || !idFile || !addressFile}
                      onClick={() => uploadKycMutation.mutate()}
                    >
                      {uploadKycMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Documents
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-2 p-4">
                <div className="font-medium">Submitted documents</div>
                <div className="text-sm text-muted-foreground mt-1">Visible to you and the admin review team.</div>

                {kycDocsQuery.isLoading ? (
                  <div className="mt-4 text-sm text-muted-foreground">Loading documents…</div>
                ) : kycDocsQuery.isError ? (
                  <div className="mt-4 text-sm text-muted-foreground">Unable to load documents.</div>
                ) : (kycDocsQuery.data?.length ?? 0) === 0 ? (
                  <div className="mt-4 text-sm text-muted-foreground">No documents uploaded yet.</div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {(kycDocsQuery.data ?? []).map((d) => (
                      <div key={d.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{d.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {d.type} • {new Date(d.createdAt).toLocaleString()}
                          </div>
                          <a className="text-sm text-primary underline underline-offset-4" href={d.url} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        </div>
                        <div className="shrink-0">
                          {d.verified ? (
                            <Badge className="bg-primary">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Ensure your account is using a strong password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Enable 2FA</div>
                  <div className="text-sm text-muted-foreground">
                    Protect your account with two-factor authentication
                  </div>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>
              {twoFactorEnabled && (
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                    <Shield className="h-4 w-4" />
                    2FA Enabled
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with authenticator app verification
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-transparent"
                    onClick={() =>
                      toast({
                        title: "2FA",
                        description: "Advanced 2FA management is coming soon. For now, use the toggle and save.",
                      })
                    }
                  >
                    Manage 2FA Settings
                  </Button>
                </div>
              )}
              <div className="pt-2">
                <Button variant="outline" className="bg-transparent" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Security Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active sessions across devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSessionQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading session…</div>
              ) : currentSessionQuery.isError ? (
                <div className="text-sm text-muted-foreground">Unable to load session</div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="font-medium">Current Session</div>
                    <div className="text-sm text-muted-foreground">
                      {(currentSessionQuery.data?.userAgent ?? "Unknown device")}
                      {currentSessionQuery.data?.ip ? ` • ${currentSessionQuery.data.ip}` : ""}
                    </div>
                  </div>
                  <div className="text-xs text-primary">Active now</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure how you receive email updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Investment Alerts</div>
                  <div className="text-sm text-muted-foreground">Get notified about your investments</div>
                </div>
                <Switch checked={investmentAlerts} onCheckedChange={setInvestmentAlerts} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Market Updates</div>
                  <div className="text-sm text-muted-foreground">Daily market movements and trends</div>
                </div>
                <Switch checked={marketUpdates} onCheckedChange={setMarketUpdates} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Weekly Report</div>
                  <div className="text-sm text-muted-foreground">Summary of your portfolio performance</div>
                </div>
                <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage browser and mobile push notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive real-time push notifications</div>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </CardContent>
          </Card>

          <div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving ? "Saving..." : "Save Notification Settings"}
            </Button>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize how information is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-border bg-card shadow-xl">
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-border bg-card shadow-xl">
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-border bg-card shadow-xl">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Payment methods are not configured for this deployment yet.
              </div>
              <Button variant="outline" className="w-full bg-transparent" disabled>
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {billingTransactionsQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading transactions…</div>
              ) : billingTransactionsQuery.isError ? (
                <div className="text-sm text-muted-foreground">Unable to load transactions</div>
              ) : (billingTransactionsQuery.data?.length ?? 0) === 0 ? (
                <div className="text-sm text-muted-foreground">No transactions yet</div>
              ) : (
                <div className="space-y-2">
                  {(billingTransactionsQuery.data ?? []).slice(0, 10).map((t) => {
                    const title = t.commodity?.name || t.description || t.type
                    const date = new Date(t.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                    const amount = new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: currency || "USD",
                    }).format(t.amount)

                    const statusColor =
                      t.status === "COMPLETED"
                        ? "text-primary"
                        : t.status === "PENDING"
                          ? "text-accent"
                          : "text-red-500"

                    return (
                      <div key={t.id} className="flex items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0">
                        <div>
                          <div className="font-medium">{title}</div>
                          <div className="text-sm text-muted-foreground">{date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{amount}</div>
                          <div className={`text-xs ${statusColor}`}>{t.status}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
