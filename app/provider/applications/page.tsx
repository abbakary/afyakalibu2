"use client"

import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Building2, Stethoscope, HeartPulse, UserCheck, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Loader2, ShieldCheck, AlertTriangle, ExternalLink,
  FileText, Eye, ShieldAlert, Award, Calendar, BadgeCheck, X, FileCheck, Check,
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────
interface DocumentAttachment {
  id?: string
  type: string
  label: string
  url: string
  uploadedAt?: string
  verified?: boolean
  verificationNotes?: string
}

interface PaymentRecord {
  id: string
  paymentReference: string
  amountPaid: number
  paymentMethod: string
  billingCycle: string
  recordedAt: string
  recordedBy: string
  validUntil: string
  notes?: string
}

interface ApplicationMessage {
  id: string
  sender: string
  senderName: string
  body: string
  category: string
  sentAt: string
}

interface DpoDetails {
  name: string
  title?: string
  email: string
  phone: string
  pdpcRegistrationNumber?: string
}

interface Application {
  id: string
  applicationType: "organization" | "solo_dermatologist" | "nurse" | "facility_doctor"
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewNotes?: string
  verificationLevel?: number
  verifiedItems?: string[]
  provisionedTenantId?: string

  // Common identity
  fullName?: string
  dateOfBirth?: string
  nidaNumber?: string
  nationality?: string
  email?: string
  phone?: string
  region?: string
  district?: string
  village?: string
  passportPhotoUrl?: string

  // Professional & Regulatory
  professionalTitle?: string
  specialty?: string
  mctRegistrationNumber?: string
  tnmcRegistrationNumber?: string
  licenceNumber?: string
  licenceExpiry?: string
  specialistQualification?: string
  nursingQualification?: string

  // Practice & Facility
  practiceName?: string
  practiceAddress?: string
  practiceRegNumber?: string
  tinNumber?: string
  facilityName?: string
  facilityRegNumber?: string
  facilityType?: string

  // Indemnity Insurance
  indemnityInsurer?: string
  indemnityPolicyNumber?: string
  indemnityExpiry?: string
  indemnityCoverage?: string

  // Org specific
  orgName?: string
  orgType?: string
  orgRegNumber?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  contactTitle?: string
  dpo?: DpoDetails
  plan?: string

  // Subscription & Payment tracking
  selectedPackage?: {
    packageName: string
    amount: number
    currency: string
    billingCycle: string
  }
  paymentStatus?: "pending_verification" | "paid" | "overdue" | "grace_period" | "blocked"
  serviceAccess?: "active" | "blocked"
  paymentReference?: string
  amountPaid?: number
  paymentExpiryDate?: string
  paymentHistory?: PaymentRecord[]
  messages?: ApplicationMessage[]

  // Documents
  documents?: DocumentAttachment[]
}

// Full 16-point Document Requirement Checklist for Solo Dermatologists
const SOLO_REQUIRED_DOCUMENTS = [
  { type: "identity_doc", label: "Government identity document (NIDA / Passport)" },
  { type: "passport_photo", label: "Passport photograph" },
  { type: "medical_degree", label: "Medical degree certificate (MD / MBChB)" },
  { type: "internship_cert", label: "Internship completion evidence" },
  { type: "practising_licence", label: "MCT registration & practising licence" },
  { type: "specialist_cert", label: "Dermatology specialist qualification (MMed)" },
  { type: "cv", label: "Current Curriculum Vitae (CV)" },
  { type: "practice_doc", label: "Practice / TRA TIN registration document" },
  { type: "indemnity_policy", label: "Professional indemnity insurance policy" },
]

// Verification Checklists per Role
const SOLO_CHECKLIST = [
  "identity_nida_verified",
  "passport_photo_confirmed",
  "mct_registration_verified",
  "practising_licence_valid",
  "specialist_mmed_verified",
  "practice_tin_verified",
  "indemnity_insurance_valid",
  "telemedicine_responsibility_signed",
]

const ORG_CHECKLIST = [
  "org_registration_verified",
  "facility_license_verified",
  "contact_person_verified",
  "privacy_policy_accepted",
]

const NURSE_CHECKLIST = [
  "identity_nida_verified",
  "tnmc_registration_verified",
  "facility_affiliation_confirmed",
]

const DOCTOR_CHECKLIST = [
  "identity_nida_verified",
  "mct_registration_verified",
  "facility_affiliation_confirmed",
]

export default function ApplicationsPage() {
  const { refresh: refreshGlobalData } = useData()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [search, setSearch] = useState<string>("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocumentAttachment | null>(null)

  async function loadApplications() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<Application[]>("/applications")
      setApplications(data)
      if (data.length > 0 && !expandedId) {
        setExpandedId(data[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const filtered = useMemo(() => {
    return applications.filter(a => {
      if (filterType !== "all" && a.applicationType !== filterType) return false
      if (filterStatus !== "all" && a.status !== filterStatus) return false
      if (filterPayment !== "all") {
        const pStat = a.paymentStatus ?? "pending_verification"
        if (filterPayment === "blocked" && a.serviceAccess !== "blocked") return false
        if (filterPayment !== "blocked" && pStat !== filterPayment) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const name = (a.orgName || a.fullName || "").toLowerCase()
        const email = (a.contactEmail || a.email || "").toLowerCase()
        const ref = (a.mctRegistrationNumber || a.tnmcRegistrationNumber || "").toLowerCase()
        if (!name.includes(q) && !email.includes(q) && !ref.includes(q)) return false
      }
      return true
    })
  }, [applications, filterType, filterStatus, filterPayment, search])

  const pendingCount = applications.filter(a => a.status === "pending").length

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Clinical Professional & Provider Verification"
        description="Verify regulatory credentials, inspect uploaded documents in-page, and manage client subscription payments."
      >
        <Button onClick={loadApplications} variant="outline" size="sm" className="gap-1.5 font-bold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          Refresh List
        </Button>
      </PageHeader>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, MCT or TNMC number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
          >
            <option value="all">All Account Types</option>
            <option value="solo_dermatologist">Solo Dermatologist</option>
            <option value="organization">Organisation / Health Facility</option>
            <option value="facility_doctor">Facility Doctor</option>
            <option value="nurse">Nurse / Health Worker</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
          >
            <option value="all">All Statuses ({applications.length})</option>
            <option value="pending">Pending Review ({pendingCount})</option>
            <option value="approved">Approved & Provisioned</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending_verification">Pending Payment Verification</option>
            <option value="paid">Payment Verified (Paid)</option>
            <option value="overdue">Overdue</option>
            <option value="blocked">Service Blocked</option>
          </select>
        </div>
      </Card>

      {/* Applications List */}
      {loading ? (
        <Card className="flex h-48 items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </Card>
      ) : error ? (
        <Card className="p-6 text-center text-destructive">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-80" />
          <p className="font-bold text-sm">{error}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40 text-primary" />
          <p className="font-bold text-sm text-foreground">No verification applications found</p>
          <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              expanded={expandedId === app.id}
              onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
              onReviewed={updated => {
                setApplications(prev => prev.map(a => a.id === updated.id ? updated : a))
              }}
              onPreviewDoc={doc => setActivePreviewDoc(doc)}
            />
          ))}
        </div>
      )}

      {/* Interactive In-Page Professional Document Previewer */}
      {activePreviewDoc && (
        <InPageDocumentWorkspaceModal
          doc={activePreviewDoc}
          onClose={() => setActivePreviewDoc(null)}
        />
      )}
    </div>
  )
}

// ── Application Detail & Inspection Card ─────────────────────────────────────
function ApplicationCard({
  app, expanded, onToggle, onReviewed, onPreviewDoc,
}: {
  app: Application
  expanded: boolean
  onToggle: () => void
  onReviewed: (app: Application) => void
  onPreviewDoc: (doc: DocumentAttachment) => void
}) {
  const atype = app.applicationType
  const isOrg = atype === "organization"
  const isSolo = atype === "solo_dermatologist"
  const isDoctor = atype === "facility_doctor"

  const checklist = isSolo ? SOLO_CHECKLIST
    : isOrg ? ORG_CHECKLIST
    : isDoctor ? DOCTOR_CHECKLIST
    : NURSE_CHECKLIST

  const checklistLabels: Record<string, string> = {
    identity_nida_verified: "Government Identity Document (NIDA / Passport) Verified",
    passport_photo_confirmed: "Passport Photograph Confirmed",
    mct_registration_verified: "MCT Registration Verified on mct.go.tz",
    tnmc_registration_verified: "TNMC Registration Verified on tnmc.go.tz",
    practising_licence_valid: "Active MCT / TNMC Practising Licence Valid",
    specialist_mmed_verified: "Dermatology Specialist Qualification (MMed) Verified",
    practice_tin_verified: "Practice / TRA TIN Registration Document Verified",
    indemnity_insurance_valid: "Professional Indemnity Insurance Active",
    telemedicine_responsibility_signed: "Telemedicine Clinical Responsibility Agreement Signed",
    org_registration_verified: "Hospital / Clinic Registration Verified",
    facility_license_verified: "Ministry of Health Facility License Verified",
    contact_person_verified: "Authorized Contact Administrator Verified",
    privacy_policy_accepted: "Tanzania Data Protection / PDPC Policy Accepted",
    facility_affiliation_confirmed: "Dispensary / Hospital Affiliation Confirmed",
  }

  const [verifiedItems, setVerifiedItems] = useState<string[]>(app.verifiedItems ?? [])
  const [documents, setDocuments] = useState<DocumentAttachment[]>(app.documents ?? [])
  const [reviewNotes, setReviewNotes] = useState(app.reviewNotes ?? "")
  const [submitting, setSubmitting] = useState(false)

  // Payment Recording Modal & Messaging State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [paymentRef, setPaymentRef] = useState("")
  const [paymentAmount, setPaymentAmount] = useState(app.selectedPackage?.amount || (isSolo ? 350000 : 600000))
  const [paymentMethod, setPaymentMethod] = useState("M-Pesa")
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().split("T")[0]
  })

  const [messageText, setMessageText] = useState("")
  const [selectedDocForWorkspace, setSelectedDocForWorkspace] = useState<DocumentAttachment | null>(documents[0] || null)

  const expiryStatus = getLicenceExpiryStatus(app.licenceExpiry)

  async function recordPayment() {
    if (!paymentRef.trim()) {
      toast.error("Please enter a payment reference code")
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch<{ application: Application }>(`/applications/${app.id}/record-payment`, {
        method: "POST",
        body: JSON.stringify({
          paymentReference: paymentRef.trim(),
          amountPaid: paymentAmount,
          paymentMethod,
          validUntil,
        }),
      })
      toast.success("External payment recorded & verified successfully")
      setShowPaymentModal(false)
      onReviewed(res.application)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment recording failed")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleBlock() {
    setSubmitting(true)
    try {
      const res = await apiFetch<{ application: Application }>(`/applications/${app.id}/toggle-service-block`, {
        method: "POST",
        body: JSON.stringify({ reason: "Provider service management" }),
      })
      toast.success(res.application.serviceAccess === "blocked" ? "Service blocked for client" : "Service restored for client")
      onReviewed(res.application)
    } catch (e) {
      toast.error("Failed to toggle service block")
    } finally {
      setSubmitting(false)
    }
  }

  async function sendMessage() {
    if (!messageText.trim()) return
    setSubmitting(true)
    try {
      const res = await apiFetch<{ application: Application }>(`/applications/${app.id}/send-message`, {
        method: "POST",
        body: JSON.stringify({ message: messageText.trim() }),
      })
      toast.success("Message sent to client web dashboard inbox")
      setMessageText("")
      setShowMessageModal(false)
      onReviewed(res.application)
    } catch (e) {
      toast.error("Failed to send message")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleDocVerified(docId: string, type: string) {
    const doc = documents.find(d => d.id === docId || d.type === type)
    const newStatus = !(doc?.verified)
    try {
      const res = await apiFetch<{ application: Application }>(`/applications/${app.id}/verify-document`, {
        method: "POST",
        body: JSON.stringify({ docType: type || docId, verified: newStatus }),
      })
      setDocuments(res.application.documents || [])
      onReviewed(res.application)
      toast.success(newStatus ? "Document marked as verified" : "Document marked as unverified")
    } catch {
      setDocuments(prev => prev.map(d => (d.id === docId || d.type === type) ? { ...d, verified: newStatus } : d))
    }
  }

  async function doReview(status: "approved" | "rejected") {
    if (status === "rejected" && !reviewNotes.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }

    const level = calculateVerificationLevel(verifiedItems.length, checklist.length, atype)

    setSubmitting(true)
    try {
      const res = await apiFetch<{ application: Application }>(`/applications/${app.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes.trim() || undefined,
          verificationLevel: status === "approved" ? Math.max(level, 4) : level,
          verifiedItems,
          documents,
        }),
      })
      toast.success(status === "approved" ? "Application approved — Credentials provisioned" : "Application rejected")
      onReviewed(res.application)
      // Refresh global db so the new tenant appears in Organizations list immediately
      if (status === "approved") {
        refreshGlobalData().catch(() => null)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Review failed")
    } finally {
      setSubmitting(false)
    }
  }

  const name = isOrg ? app.orgName : app.fullName
  const email = isOrg ? app.contactEmail : app.email
  const verifiedCount = verifiedItems.length
  const totalChecks = checklist.length
  const pkg = app.selectedPackage || { packageName: isSolo ? "Solo Pro Specialist" : "Rural Clinic Hub", amount: isSolo ? 350000 : 250000, currency: "TZS", billingCycle: "monthly" }
  const isBlocked = app.serviceAccess === "blocked"
  const pStat = app.paymentStatus || "pending_verification"

  return (
    <Card className={cn("overflow-hidden transition-all", expanded ? "ring-2 ring-primary/40 shadow-md" : "")}>
      {/* Row Header */}
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors">
        {app.passportPhotoUrl ? (
          <img src={app.passportPhotoUrl} alt={name} className="h-11 w-11 shrink-0 rounded-xl object-cover border border-border" />
        ) : (
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold",
            isOrg ? "bg-indigo-100 text-indigo-700"
            : isSolo ? "bg-teal-100 text-teal-700"
            : isDoctor ? "bg-blue-100 text-blue-700"
            : "bg-emerald-100 text-emerald-700")}>
            {isOrg ? <Building2 className="h-5 w-5" />
              : isSolo ? <Stethoscope className="h-5 w-5" />
              : isDoctor ? <UserCheck className="h-5 w-5" />
              : <HeartPulse className="h-5 w-5" />}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="font-bold text-sm text-foreground">{name}</p>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
              isOrg ? "bg-indigo-100 text-indigo-800"
              : isSolo ? "bg-teal-100 text-teal-800"
              : isDoctor ? "bg-blue-100 text-blue-800"
              : "bg-emerald-100 text-emerald-800")}>
              {isOrg ? "Organisation" : isSolo ? "Solo Dermatologist" : isDoctor ? "Facility Doctor" : "Nurse / Health Worker"}
            </span>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
              Level {app.verificationLevel ?? 0} Verification
            </span>

            {/* Payment Badge */}
            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border",
              pStat === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : isBlocked ? "bg-red-100 text-red-800 border-red-300"
              : "bg-amber-50 text-amber-800 border-amber-300"
            )}>
              {isBlocked ? "Service Blocked" : pStat === "paid" ? "Payment Verified" : "Payment Pending"}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">
            {email} · {app.region} · Submitted {formatDate(app.submittedAt)}
            {app.mctRegistrationNumber && ` · MCT: ${app.mctRegistrationNumber}`}
            {` · Package: ${pkg.packageName} (${pkg.currency} ${pkg.amount.toLocaleString()})`}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {expiryStatus && (
            <span className={cn("hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold", expiryStatus.bg, expiryStatus.color)}>
              <Calendar className="h-3 w-3" />
              {expiryStatus.label}
            </span>
          )}
          <StatusBadge status={app.status} />
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Verification & Professional Document Preview Workspace */}
      {expanded && (
        <div className="border-t border-border px-5 pb-6 pt-5 bg-slate-50/50 space-y-6">

          {/* 1. SUBSCRIPTION PACKAGE & PAYMENT MANAGEMENT WORKSPACE */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Client Subscription Package & External Payment Tracking
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Package: <strong className="text-slate-900">{pkg.packageName}</strong> ({pkg.currency} {pkg.amount.toLocaleString()}/{pkg.billingCycle})
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={() => setShowPaymentModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Record Payment
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowMessageModal(true)} className="text-xs gap-1.5 font-semibold">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Send Notice
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleBlock}
                  className={cn("text-xs font-bold gap-1.5", isBlocked ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50" : "text-destructive border-destructive/30 hover:bg-destructive/10")}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {isBlocked ? "Unblock Service" : "Block Service"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="rounded-lg bg-slate-50 p-2.5 border">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Payment Status</span>
                <p className={cn("font-bold mt-0.5", pStat === "paid" ? "text-emerald-700" : "text-amber-700")}>
                  {pStat === "paid" ? "✓ Paid & Active" : "⚠ Pending Verification"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Service Access</span>
                <p className={cn("font-bold mt-0.5", isBlocked ? "text-destructive" : "text-emerald-700")}>
                  {isBlocked ? "✕ Blocked by Provider" : "✓ Active Access"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Payment Reference</span>
                <p className="font-mono font-semibold text-slate-800 mt-0.5 truncate">{app.paymentReference || "N/A"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Valid Until Expiry</span>
                <p className="font-semibold text-slate-800 mt-0.5">{app.paymentExpiryDate ? formatDate(app.paymentExpiryDate) : "30 Days Trial"}</p>
              </div>
            </div>
          </div>

          {/* 2. PROFESSIONAL IN-PAGE DOCUMENT WORKSPACE (Direct embedded preview without opening tabs) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" /> Professional In-Page Regulatory Document Inspection Workspace
              </h4>
              <span className="text-xs text-muted-foreground font-medium">({documents.length} attached documents)</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Document List Sidebar */}
              <div className="lg:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {(isSolo ? SOLO_REQUIRED_DOCUMENTS : []).map(req => {
                  const uploaded = documents.find(d => d.type === req.type || d.label.toLowerCase().includes(req.label.toLowerCase().slice(0, 8)))
                  const isSelected = selectedDocForWorkspace?.type === req.type || (uploaded && selectedDocForWorkspace?.url === uploaded.url)

                  return (
                    <div
                      key={req.type}
                      onClick={() => uploaded && setSelectedDocForWorkspace(uploaded)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all cursor-pointer",
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-slate-200 bg-white hover:bg-slate-50",
                        !uploaded && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {uploaded ? (
                          <FileCheck className={cn("h-4 w-4 shrink-0", uploaded.verified ? "text-emerald-600" : "text-primary")} />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{req.label}</p>
                          <p className="text-[10px] text-muted-foreground">{uploaded ? (uploaded.verified ? "✓ Verified" : "Attached — Click to preview") : "Not attached"}</p>
                        </div>
                      </div>

                      {uploaded && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              uploaded.id && toggleDocVerified(uploaded.id, req.type)
                            }}
                            className={cn("rounded px-2 py-0.5 text-[10px] font-bold transition-colors",
                              uploaded.verified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                            )}
                          >
                            {uploaded.verified ? "Verified" : "Verify"}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Embedded In-Page Viewer Box */}
              <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-200 bg-slate-950/90 text-white p-3 min-h-[380px]">
                {selectedDocForWorkspace ? (
                  <div className="flex flex-col h-full space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-teal-400 shrink-0" />
                        <span className="font-bold text-slate-100 truncate">{selectedDocForWorkspace.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDocVerified(selectedDocForWorkspace.id || "", selectedDocForWorkspace.type)}
                          className={cn("rounded px-2.5 py-1 text-[11px] font-bold transition-colors",
                            selectedDocForWorkspace.verified ? "bg-emerald-600 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
                          )}
                        >
                          {selectedDocForWorkspace.verified ? "✓ Verified" : "Approve Document"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onPreviewDoc(selectedDocForWorkspace)}
                          className="rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          Fullscreen
                        </button>
                      </div>
                    </div>

                    {/* Preview Workspace Canvas */}
                    <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-lg overflow-auto p-2 min-h-[300px]">
                      {selectedDocForWorkspace.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) || selectedDocForWorkspace.type === "passport_photo" ? (
                        <img
                          src={selectedDocForWorkspace.url}
                          alt={selectedDocForWorkspace.label}
                          className="max-h-[320px] w-auto object-contain rounded border border-slate-800 shadow-xl"
                        />
                      ) : (
                        <iframe
                          src={selectedDocForWorkspace.url}
                          title={selectedDocForWorkspace.label}
                          className="w-full h-[320px] rounded border-0 bg-white"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2">
                    <FileText className="h-12 w-12 text-slate-600" />
                    <p className="font-semibold text-xs text-slate-300">Select any document on the left to inspect in-page</p>
                    <p className="text-[11px] text-slate-500">Live preview supports NIDA ID, MCT licence certificates, MMed diplomas, and PDFs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. VERIFICATION CHECKLIST & APPROVAL ACTIONS */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Verification Checklist ({verifiedCount}/{totalChecks})
                  </h4>
                  <span className="text-xs font-bold text-primary">Level {calculateVerificationLevel(verifiedCount, totalChecks, atype)} / 5</span>
                </div>

                <div className="space-y-2">
                  {checklist.map(item => (
                    <label key={item} className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors text-xs font-medium",
                      verifiedItems.includes(item) ? "border-emerald-300 bg-emerald-50/50 text-slate-900" : "border-border text-muted-foreground hover:border-primary/40",
                      app.status !== "pending" ? "pointer-events-none opacity-70" : "",
                    )}>
                      <input
                        type="checkbox"
                        disabled={app.status !== "pending"}
                        checked={verifiedItems.includes(item)}
                        onChange={e => setVerifiedItems(prev =>
                          e.target.checked ? [...prev, item] : prev.filter(i => i !== item)
                        )}
                        className="accent-primary"
                      />
                      <span className="flex-1">{checklistLabels[item]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              {app.status === "pending" && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                      Compliance Reviewer Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      rows={3}
                      placeholder="Enter verification notes, MCT search results, or reasons for rejection…"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => doReview("approved")}
                      disabled={submitting || verifiedCount < 3}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve & Provision Account
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => doReview("rejected")}
                      disabled={submitting}
                      className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {app.status !== "pending" && (
                <div className={cn("rounded-xl p-4 text-xs font-medium border",
                  app.status === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-destructive/10 border-destructive/20 text-destructive")}>
                  <p className="font-bold mb-1">{app.status === "approved" ? "✓ Account Provisioned & Verified" : "✕ Application Rejected"}</p>
                  {app.reviewNotes && <p>{app.reviewNotes}</p>}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Record External Payment — {name}</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Payment Reference (M-Pesa / Bank Ref)</label>
                <input
                  type="text"
                  placeholder="e.g. MPESA-89312049"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Amount Paid (TZS)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="M-Pesa">M-Pesa (Vodacom)</option>
                  <option value="Tigo Pesa">Tigo Pesa</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Bank Wire">CRDB / NMB Bank Wire</option>
                  <option value="Government Control Number">Government Control Number</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Valid Until Expiry Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button size="sm" onClick={recordPayment} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Save Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Provider Notice Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Send Payment / Provider Notice to Client Inbox</h3>
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              rows={4}
              placeholder="e.g. Please submit your monthly subscription payment of TZS 350,000 via M-Pesa to prevent service interruption..."
              className="w-full rounded-lg border px-3 py-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowMessageModal(false)}>Cancel</Button>
              <Button size="sm" onClick={sendMessage} disabled={submitting || !messageText.trim()} className="bg-primary text-white font-bold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Message"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── In-Page Document Preview Workspace Modal ──────────────────────────────────
function InPageDocumentWorkspaceModal({ doc, onClose }: { doc: DocumentAttachment; onClose: () => void }) {
  const isImage = doc.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) || doc.type === "passport_photo"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-slate-900 text-sm">{doc.label}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-950 flex items-center justify-center p-4 min-h-[400px]">
          {isImage ? (
            <img src={doc.url} alt={doc.label} className="max-h-[550px] w-auto rounded-lg object-contain shadow-2xl" />
          ) : (
            <iframe src={doc.url} title={doc.label} className="w-full h-[550px] rounded-lg border-0 bg-white" />
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <span className="text-slate-500">Document Type: <strong className="text-slate-800">{doc.type}</strong></span>
          <a href={doc.url} download className="text-primary font-semibold hover:underline flex items-center gap-1">
            <ExternalLink className="h-3.5 w-3.5" /> Download File
          </a>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Application["status"] }) {
  return (
    <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase",
      status === "pending" ? "bg-amber-100 text-amber-800"
      : status === "approved" ? "bg-emerald-100 text-emerald-800"
      : "bg-destructive/10 text-destructive"
    )}>
      {status === "pending" ? <Clock className="h-3 w-3" />
        : status === "approved" ? <ShieldCheck className="h-3 w-3" />
        : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <dt className="text-muted-foreground font-normal">{label}:</dt>
      <dd className="font-semibold text-foreground truncate">{value}</dd>
    </div>
  )
}

function getLicenceExpiryStatus(expiryIso?: string) {
  if (!expiryIso) return null
  const exp = new Date(expiryIso)
  const now = new Date()
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24))

  if (diffDays <= 0) {
    return { label: "Licence Expired", bg: "bg-red-100", color: "text-red-800" }
  } else if (diffDays <= 30) {
    return { label: `Licence Renewal Urgent (${diffDays}d)`, bg: "bg-orange-100", color: "text-orange-800" }
  } else if (diffDays <= 90) {
    return { label: `Licence Renewal Required (${diffDays}d)`, bg: "bg-amber-100", color: "text-amber-800" }
  } else {
    return { label: `Licence Valid (${diffDays}d)`, bg: "bg-emerald-100", color: "text-emerald-800" }
  }
}

function calculateVerificationLevel(verifiedCount: number, total: number, atype: string): number {
  if (verifiedCount === 0) return 0
  const pct = verifiedCount / total
  if (pct >= 0.95) return 5
  if (pct >= 0.75) return 4
  if (pct >= 0.5) return 3
  if (pct >= 0.25) return 2
  return 1
}
