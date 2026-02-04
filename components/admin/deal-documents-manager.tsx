"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CommodityDocument, DocumentType } from "@/lib/domain"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { toast } from "@/hooks/use-toast"
import { FileText, Shield, Calendar, Link as LinkIcon, Trash2 } from "lucide-react"

const typeLabels: Record<DocumentType, string> = {
  BILL_OF_LADING: "Bill of Lading",
  INSURANCE_CERTIFICATE: "Insurance Certificate",
  QUALITY_CERTIFICATION: "Quality Certification",
  COMMODITY_CONTRACT: "Commodity Contract",
  KYC_ID: "KYC ID",
  KYC_PROOF_OF_ADDRESS: "KYC Proof of Address",
  OTHER: "Other",
}

function docIcon(type: DocumentType) {
  switch (type) {
    case "INSURANCE_CERTIFICATE":
      return Shield
    case "COMMODITY_CONTRACT":
      return Calendar
    default:
      return FileText
  }
}

export function DealDocumentsManager({ commodityId, isAdmin }: { commodityId: string; isAdmin: boolean }) {
  const qc = useQueryClient()
  const [docType, setDocType] = useState<DocumentType>("BILL_OF_LADING")
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const docsQuery = useQuery({
    queryKey: ["admin", "deals", commodityId, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/deals/${commodityId}/documents`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load documents")
      return json.data as CommodityDocument[]
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      fd.set("type", docType)
      if (name.trim()) fd.set("name", name.trim())
      if (url.trim()) fd.set("url", url.trim())
      if (file) fd.set("file", file)

      const res = await fetch(`/api/admin/deals/${commodityId}/documents`, { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Upload failed")
      return json.data as CommodityDocument
    },
    onSuccess: async () => {
      setName("")
      setUrl("")
      setFile(null)
      await qc.invalidateQueries({ queryKey: ["admin", "deals", commodityId, "documents"] })
      toast({ title: "Document added", description: "Uploaded successfully (verification optional)." })
    },
    onError: (e) => toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" }),
  })

  const verifyMutation = useMutation({
    mutationFn: async ({ docId, verified }: { docId: string; verified: boolean }) => {
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Update failed")
      return json.data as CommodityDocument
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "deals", commodityId, "documents"] })
    },
    onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch(`/api/admin/documents/${docId}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || "Delete failed")
      return true
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "deals", commodityId, "documents"] })
      toast({ title: "Document deleted" })
    },
    onError: (e) => toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" }),
  })

  const docs = docsQuery.data ?? []

  const summary = useMemo(() => {
    const verified = docs.filter((d) => d.verified).length
    return `${verified}/${docs.length} verified`
  }, [docs])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-foreground">Documents</div>
          <div className="text-sm text-muted-foreground">{summary}</div>
        </div>
      </div>

      {isAdmin && (
        <Card className="p-6 border-border bg-card relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative z-10">
            <div className="font-medium mb-4 text-foreground">Add document</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                  <SelectTrigger className="mt-2 bg-background border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BILL_OF_LADING">Bill of Lading</SelectItem>
                    <SelectItem value="INSURANCE_CERTIFICATE">Insurance Certificate</SelectItem>
                    <SelectItem value="QUALITY_CERTIFICATION">Quality Certification</SelectItem>
                    <SelectItem value="COMMODITY_CONTRACT">Commodity Contract</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Name (optional)</Label>
                <Input className="mt-2 bg-background border-border" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. bill-of-lading.pdf" />
              </div>

              <div className="md:col-span-2">
                <Label>Upload file (recommended)</Label>
                <Input
                  className="mt-2 bg-background border-border"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Stored locally under <code className="bg-muted px-1 rounded">/public/uploads/commodities</code> for dev. Use S3 in production.
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Or link by URL</Label>
                <Input className="mt-2 bg-background border-border" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Adding..." : "Add Document"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {docsQuery.isLoading ? (
        <Card className="p-4 border-border bg-card text-sm text-muted-foreground">Loading documents…</Card>
      ) : docs.length === 0 ? (
        <Card className="p-4 border-border bg-card text-sm text-muted-foreground">No documents yet.</Card>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => {
            const Icon = docIcon(d.type)
            return (
              <Card key={d.id} className="p-4 border-border bg-card shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate text-foreground">{d.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {typeLabels[d.type]} • {new Date(d.createdAt).toLocaleString()}
                      </div>
                      <a
                        className="text-sm text-primary hover:underline underline-offset-4 inline-flex items-center gap-1 mt-1 font-medium"
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <LinkIcon className="h-4 w-4" /> Open
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {d.verified ? (
                      <Badge className="bg-emerald-600/20 text-emerald-500 border-emerald-600/30">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-border">Unverified</Badge>
                    )}

                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent border-border hover:bg-muted text-foreground"
                          onClick={() => verifyMutation.mutate({ docId: d.id, verified: !d.verified })}
                          disabled={verifyMutation.isPending}
                        >
                          {d.verified ? "Unverify" : "Verify"}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20">
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the document record. If it was uploaded locally (under <code>/uploads</code>), the file will be deleted too.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(d.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}


