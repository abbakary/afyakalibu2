"use client"

import { useEffect, useState, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { SKINLINK_PACKAGES, formatTZS, type SkinLinkPackage } from "@/lib/packages"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  CreditCard, Clock, CheckCircle2, ShieldOff, ShieldCheck, MessageSquare,
  Loader2, RefreshCw, X, Search, DollarSign, Package, Pencil, Globe, AlertTriangle,
} from "lucide-react"

interface PaymentRecord {
  id: string
  paymentReference: string
  amountPaid: number
  paymentMethod: string
  billingCycle: string
  recordedAt: string
  validUntil: string
}

interface Application {
  id: string
  orgName?: string
  fullName?: string
  contactEmail?: string
  email?: string
  selectedPackage?: { packageName: string; amount: number; currency: string; billingCycle: string }
  paymentStatus?: string
  serviceAccess?: string
  paymentReference?: string
  amountPaid?: number
  paymentExpiryDate?: string
  paymentHistory?: PaymentRecord[]
  packageUpdatedAt?: string
  packageUpdatedBy?: string
  status?: string
}

export default function SubscriptionsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [historyApp, setHistoryApp] = useState<string | null>(null)

  // Record Payment modal
  const [payModal, setPayModal] = useState<Application | null>(null)
  const [payRef, setPayRef] = useState("")
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState("M-Pesa")
  const [payUntil, setPayUntil] = useState("")

  // Update Package modal (per-client)
  const [pkgModal, setPkgModal] = useState<Application | null>(null)
  const [pkgSelected, setPkgSelected] = useState("")
  const [pkgCustomName, setPkgCustomName] = useState("")
  const [pkgCustomAmount, setPkgCustomAmount] = useState(0)
  const [pkgCycle, setPkgCycle] = useState("monthly")
  const [isCustomPkg, setIsCustomPkg] = useState(false)

  // Global package price editor
  const [globalPkgEdit, setGlobalPkgEdit] = useState<SkinLinkPackage | null>(null)
  const [globalPkgAmount, setGlobalPkgAmount] = useState(0)
  const [globalPkgCycle, setGlobalPkgCycle] = useState("monthly")
  const [globalPackages, setGlobalPackages] = useState<SkinLinkPackage[]>([...SKINLINK_PACKAGES])

  // Send Notice modal
  const [msgModal, setMsgModal] = useState<{ id: string; name: string } | null>(null)
  const [msgText, setMsgText] = useState("")

  function nextMonthDate() {
    const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split("T")[0]
  }

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await apiFetch<Application[]>("/applications")
      setApps(data.filter(a => a.status === "approved"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return apps
    const q = search.toLowerCase()
    return apps.filter(a =>
      (a.orgName || a.fullName || "").toLowerCase().includes(q) ||
      (a.contactEmail || a.email || "").toLowerCase().includes(q) ||
      (a.selectedPackage?.packageName || "").toLowerCase().includes(q)
    )
  }, [apps, search])

  const stats = useMemo(() => ({
    paid: apps.filter(a => a.paymentStatus === "paid").length,
    pending: apps.filter(a => !a.paymentStatus || a.paymentStatus === "pending_verification").length,
    blocked: apps.filter(a => a.serviceAccess === "blocked").length,
    totalRevenue: apps.reduce((s, a) => s + (a.amountPaid || 0), 0),
  }), [apps])

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function recordPayment() {
    if (!payModal || !payRef.trim()) { toast.error("Payment reference is required"); return }
    setActionLoading(payModal.id)
    try {
      await apiFetch(`/applications/${payModal.id}/record-payment`, {
        method: "POST",
        body: JSON.stringify({ paymentReference: payRef, amountPaid: payAmount, paymentMethod: payMethod, validUntil: payUntil }),
      })
      toast.success("Payment recorded — service is now active")
      setPayModal(null)
      await load(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment")
    } finally {
      setActionLoading(null)
    }
  }

  async function updatePackage() {
    if (!pkgModal) return
    const name = isCustomPkg ? pkgCustomName.trim() : pkgSelected
    const amount = isCustomPkg ? pkgCustomAmount : (globalPackages.find(p => p.name === pkgSelected)?.amount ?? 0)
    if (!name) { toast.error("Package name is required"); return }
    if (!amount) { toast.error("Package amount is required"); return }
    setActionLoading(pkgModal.id)
    try {
      await apiFetch(`/applications/${pkgModal.id}/update-package`, {
        method: "POST",
        body: JSON.stringify({ packageName: name, amount, currency: "TZS", billingCycle: pkgCycle }),
      })
      toast.success(`Package updated to "${name}"`)
      setPkgModal(null)
      await load(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update package")
    } finally {
      setActionLoading(null)
    }
  }

  async function updateGlobalPackage() {
    if (!globalPkgEdit) return
    if (!globalPkgAmount || globalPkgAmount <= 0) { toast.error("Amount must be greater than 0"); return }
    setActionLoading("global_" + globalPkgEdit.name)
    try {
      const res = await apiFetch<{ updatedApplications: number; message: string }>(
        `/applications/packages/${encodeURIComponent(globalPkgEdit.name)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            packageName: globalPkgEdit.name,
            amount: globalPkgAmount,
            currency: "TZS",
            billingCycle: globalPkgCycle,
          }),
        }
      )
      // Update local state so UI reflects immediately without reload
      setGlobalPackages(prev => prev.map(p =>
        p.name === globalPkgEdit.name ? { ...p, amount: globalPkgAmount, billingCycle: globalPkgCycle as "monthly" | "quarterly" | "annually" } : p
      ))
      toast.success(`"${globalPkgEdit.name}" updated globally`, {
        description: res.message,
      })
      setGlobalPkgEdit(null)
      await load(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update global package")
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleBlock(app: Application) {
    setActionLoading(app.id)
    try {
      const res = await apiFetch<{ serviceAccess: string }>(`/applications/${app.id}/toggle-service-block`, {
        method: "POST",
        body: JSON.stringify({ reason: "Payment management — Provider action" }),
      })
      toast.success(res.serviceAccess === "blocked" ? "Service blocked" : "Service restored")
      await load(false)
    } catch {
      toast.error("Failed to update service access")
    } finally {
      setActionLoading(null)
    }
  }

  async function sendMessage() {
    if (!msgModal || !msgText.trim()) return
    setActionLoading(msgModal.id)
    try {
      await apiFetch(`/applications/${msgModal.id}/send-message`, {
        method: "POST",
        body: JSON.stringify({ message: msgText.trim(), category: "payment_notice" }),
      })
      toast.success("Notice sent to client dashboard")
      setMsgModal(null); setMsgText("")
    } catch {
      toast.error("Failed to send message")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Subscriptions Management"
        description="Track client packages, record payments, update subscriptions, and manage service access."
        actions={
          <button onClick={() => load(false)} disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Revenue", value: `TZS ${stats.totalRevenue.toLocaleString()}`, icon: <DollarSign className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50", border: "border-emerald-400" },
          { label: "Active Subscriptions", value: stats.paid, icon: <CheckCircle2 className="h-5 w-5 text-teal-600" />, bg: "bg-teal-50", border: "border-teal-400" },
          { label: "Pending Payment", value: stats.pending, icon: <Clock className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50", border: "border-amber-400" },
          { label: "Blocked Clients", value: stats.blocked, icon: <ShieldOff className="h-5 w-5 text-rose-600" />, bg: "bg-rose-50", border: "border-rose-400" },
        ].map(s => (
          <Card key={s.label} className={cn("flex items-center gap-4 p-5 border-l-4", s.border)}>
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.bg)}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-semibold text-slate-700">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Global Package Catalogue */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-heading text-sm font-semibold">Global Package Catalogue</h3>
              <p className="text-xs text-muted-foreground">
                Editing a package price here updates it globally — all existing clients on that package are updated automatically.
              </p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {globalPackages.map(pkg => (
            <div key={pkg.name} className="flex items-center gap-4 px-5 py-3.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", pkg.badgeColor)}>{pkg.badge}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{pkg.name}</p>
                <p className="text-xs text-muted-foreground">{pkg.seats} · {pkg.forTypes.join(", ")}</p>
              </div>
              <p className="text-sm font-bold text-primary">
                {formatTZS(pkg.amount)}<span className="text-xs font-normal text-muted-foreground">/{pkg.billingCycle}</span>
              </p>
              <button
                onClick={() => { setGlobalPkgEdit(pkg); setGlobalPkgAmount(pkg.amount); setGlobalPkgCycle(pkg.billingCycle) }}
                className="flex items-center gap-1 rounded-md border border-primary/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
              >
                <Pencil className="h-3 w-3" /> Edit price
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search by client name, email, or package…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none" />
        </div>
      </Card>

      {/* Subscriptions List */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/30" />
          <p className="font-semibold text-slate-900">No approved subscriptions found</p>
          <p className="text-sm text-muted-foreground">Approve applications first to manage subscriptions here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const name = app.orgName || app.fullName || app.contactEmail || app.email || "—"
            const pkg = app.selectedPackage
            const isBlocked = app.serviceAccess === "blocked"
            const isPaid = app.paymentStatus === "paid"

            return (
              <Card key={app.id} className={cn("overflow-hidden", isBlocked && "border-rose-200 bg-rose-50/20")}>
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  {/* Status icon */}
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl mt-0.5",
                    isBlocked ? "bg-rose-50" : isPaid ? "bg-emerald-50" : "bg-amber-50")}>
                    {isBlocked ? <ShieldOff className="h-5 w-5 text-rose-600" />
                      : isPaid ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      : <Clock className="h-5 w-5 text-amber-600" />}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{name}</p>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border",
                        isBlocked ? "bg-rose-100 text-rose-800 border-rose-300"
                          : isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300")}>
                        {isBlocked ? "Blocked" : isPaid ? "Paid & Active" : "Payment Pending"}
                      </span>
                    </div>

                    {/* Package info box */}
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <Package className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1 text-xs">
                        <span className="font-semibold text-slate-900">{pkg?.packageName ?? "No package"}</span>
                        {pkg && <span className="ml-1.5 text-slate-500">· {pkg.currency} {pkg.amount.toLocaleString()}/{pkg.billingCycle}</span>}
                        {app.packageUpdatedAt && (
                          <span className="ml-2 text-[10px] text-slate-400">(updated {formatDate(app.packageUpdatedAt)} by {app.packageUpdatedBy})</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setPkgModal(app)
                          const existing = globalPackages.find(p => p.name === pkg?.packageName)
                          if (existing) { setPkgSelected(existing.name); setIsCustomPkg(false) }
                          else { setIsCustomPkg(true); setPkgCustomName(pkg?.packageName || ""); setPkgCustomAmount(pkg?.amount || 0) }
                          setPkgCycle(pkg?.billingCycle || "monthly")
                        }}
                        className="ml-2 flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-white px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Pencil className="h-3 w-3" /> Update
                      </button>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-500">
                      {app.paymentReference && `Ref: ${app.paymentReference}`}
                      {app.paymentExpiryDate && ` · Valid until: ${formatDate(app.paymentExpiryDate)}`}
                      {app.amountPaid ? ` · Last paid: TZS ${app.amountPaid.toLocaleString()}` : ""}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                      disabled={actionLoading === app.id}
                      onClick={() => { setPayModal(app); setPayAmount(pkg?.amount || 0); setPayRef(""); setPayUntil(nextMonthDate()) }}>
                      <CreditCard className="h-3.5 w-3.5" /> Record Payment
                    </Button>

                    <Button size="sm" variant="outline" className="text-xs gap-1.5"
                      disabled={actionLoading === app.id}
                      onClick={() => { setMsgModal({ id: app.id, name }); setMsgText("") }}>
                      <MessageSquare className="h-3.5 w-3.5 text-primary" /> Send Notice
                    </Button>

                    <Button size="sm" variant="outline"
                      className={cn("text-xs font-bold gap-1.5", isBlocked ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50" : "text-rose-700 border-rose-300 hover:bg-rose-50")}
                      disabled={actionLoading === app.id}
                      onClick={() => toggleBlock(app)}>
                      {actionLoading === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : isBlocked ? <><ShieldCheck className="h-3.5 w-3.5" /> Restore</>
                        : <><ShieldOff className="h-3.5 w-3.5" /> Block</>}
                    </Button>

                    {(app.paymentHistory?.length ?? 0) > 0 && (
                      <button onClick={() => setHistoryApp(historyApp === app.id ? null : app.id)}
                        className="text-xs font-medium text-primary hover:underline">
                        {historyApp === app.id ? "Hide" : `History (${app.paymentHistory!.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Payment History */}
                {historyApp === app.id && (app.paymentHistory?.length ?? 0) > 0 && (
                  <div className="border-t border-border bg-slate-50/50 px-5 pb-4 pt-3">
                    <p className="mb-2 text-xs font-bold uppercase text-slate-600">Payment History</p>
                    <div className="space-y-2">
                      {app.paymentHistory!.map(p => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-xs">
                          <div>
                            <span className="font-mono font-semibold text-slate-800">{p.paymentReference}</span>
                            <span className="text-slate-400"> · {p.paymentMethod} · {formatDate(p.recordedAt)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-700">TZS {p.amountPaid.toLocaleString()}</span>
                            <span className="ml-2 text-slate-400">until {formatDate(p.validUntil)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ══ UPDATE PACKAGE MODAL ══════════════════════════════════════════════════ */}
      {pkgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900">Update Subscription Package</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pkgModal.orgName || pkgModal.fullName || pkgModal.contactEmail}
                  {pkgModal.selectedPackage && (
                    <span className="ml-1 text-slate-400">· Current: {pkgModal.selectedPackage.packageName}</span>
                  )}
                </p>
              </div>
              <button onClick={() => setPkgModal(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Standard packages grid */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Standard Packages</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {globalPackages.map(p => (
                    <label key={p.name}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all",
                        !isCustomPkg && pkgSelected === p.name
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                      )}>
                      <input type="radio" name="pkg_select" className="accent-primary mt-0.5 shrink-0"
                        checked={!isCustomPkg && pkgSelected === p.name}
                        onChange={() => { setIsCustomPkg(false); setPkgSelected(p.name); setPkgCycle(p.billingCycle) }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900">{p.name}</span>
                          <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold shrink-0", p.badgeColor)}>{p.badge}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom / Negotiated package — always fully visible once radio selected */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">Custom / Negotiated</p>
                <div className={cn(
                  "rounded-xl border-2 transition-all",
                  isCustomPkg ? "border-primary bg-primary/3" : "border-dashed border-slate-300"
                )}>
                  {/* Radio + label row */}
                  <label className="flex cursor-pointer items-center gap-2 px-4 py-3 border-b border-dashed border-slate-200">
                    <input type="radio" name="pkg_select" className="accent-primary shrink-0"
                      checked={isCustomPkg}
                      onChange={() => { setIsCustomPkg(true); setPkgSelected("") }} />
                    <span className="text-sm font-bold text-slate-900">Custom / Negotiated Package</span>
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 ml-1">Custom</span>
                  </label>

                  {/* Input fields — always mounted, just greyed out when not active */}
                  <div className="grid gap-3 sm:grid-cols-2 p-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Package Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        value={pkgCustomName}
                        onChange={e => setPkgCustomName(e.target.value)}
                        onClick={() => { setIsCustomPkg(true); setPkgSelected("") }}
                        placeholder="e.g. Mission Hospital Special"
                        className={cn(
                          "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
                          isCustomPkg
                            ? "border-primary bg-white focus:border-primary"
                            : "border-slate-200 bg-slate-50 text-slate-400 focus:border-primary"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Amount (TZS) <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={pkgCustomAmount || ""}
                        onChange={e => setPkgCustomAmount(+e.target.value)}
                        onClick={() => { setIsCustomPkg(true); setPkgSelected("") }}
                        placeholder="e.g. 450000"
                        className={cn(
                          "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
                          isCustomPkg
                            ? "border-primary bg-white focus:border-primary"
                            : "border-slate-200 bg-slate-50 text-slate-400 focus:border-primary"
                        )}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description (optional)</label>
                      <input
                        onClick={() => { setIsCustomPkg(true); setPkgSelected("") }}
                        placeholder="e.g. Negotiated rate for faith-based facility"
                        className={cn(
                          "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
                          isCustomPkg
                            ? "border-slate-200 bg-white focus:border-primary"
                            : "border-slate-200 bg-slate-50 text-slate-400 focus:border-primary"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing cycle */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">Billing Cycle</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "monthly", label: "Monthly" },
                    { value: "quarterly", label: "Quarterly" },
                    { value: "annually", label: "Annually" },
                  ].map(c => (
                    <button key={c.value} type="button" onClick={() => setPkgCycle(c.value)}
                      className={cn(
                        "rounded-lg border py-2.5 text-sm font-semibold transition-colors",
                        pkgCycle === c.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-200 text-slate-600 hover:border-primary/40 hover:bg-slate-50"
                      )}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary preview */}
              {(pkgSelected || (isCustomPkg && pkgCustomName)) && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-0.5">New package preview</p>
                  <p className="text-sm font-bold text-emerald-900">
                    {isCustomPkg ? pkgCustomName : pkgSelected}
                    {" · "}TZS{" "}
                    {(isCustomPkg
                      ? pkgCustomAmount
                      : (globalPackages.find(p => p.name === pkgSelected)?.amount ?? 0)
                    ).toLocaleString()}
                    <span className="text-emerald-600 font-semibold text-xs ml-1">/{pkgCycle}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 shrink-0 bg-white rounded-b-2xl">
              <button onClick={() => setPkgModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <Button size="sm"
                disabled={
                  (!pkgSelected && !isCustomPkg) ||
                  (isCustomPkg && (!pkgCustomName.trim() || !pkgCustomAmount)) ||
                  actionLoading === pkgModal.id
                }
                onClick={updatePackage}
                className="gap-1.5 px-5">
                {actionLoading === pkgModal.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Package className="h-3.5 w-3.5" />}
                Save Package Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══ RECORD PAYMENT MODAL ════════════════════════════════════════════════ */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900">Record External Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {payModal.orgName || payModal.fullName || payModal.contactEmail}
                  {payModal.selectedPackage && ` · ${payModal.selectedPackage.packageName}`}
                </p>
              </div>
              <button onClick={() => setPayModal(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Reference (M-Pesa / Bank) *</label>
                <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. MPESA-SI8KABCXYZ"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (TZS)</label>
                  <input type="number" min={0} value={payAmount} onChange={e => setPayAmount(+e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                    {["M-Pesa","Airtel Money","Bank Transfer","Control Number","Cash","Cheque"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Valid Until</label>
                <input type="date" value={payUntil} onChange={e => setPayUntil(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              </div>
              {payModal.selectedPackage && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs">
                  <span className="font-semibold text-emerald-800">Package: </span>
                  <span className="text-emerald-700">{payModal.selectedPackage.packageName} — TZS {payModal.selectedPackage.amount.toLocaleString()}/{payModal.selectedPackage.billingCycle}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end border-t border-border px-6 py-4">
              <Button variant="outline" size="sm" onClick={() => setPayModal(null)}>Cancel</Button>
              <Button size="sm" disabled={!payRef.trim() || actionLoading === payModal.id} onClick={recordPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                {actionLoading === payModal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                Confirm & Record Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SEND NOTICE MODAL ═══════════════════════════════════════════════════ */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900">Send Payment Notice</h3>
                <p className="text-xs text-slate-500 mt-0.5">To: <strong>{msgModal.name}</strong></p>
              </div>
              <button onClick={() => setMsgModal(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1.5">Quick templates:</p>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "Payment reminder", text: `Dear ${msgModal.name}, your SkinLink subscription payment is due. Please arrange payment to continue uninterrupted access. Contact us for assistance.` },
                    { label: "Suspension warning", text: `Dear ${msgModal.name}, your SkinLink account is at risk of suspension due to outstanding payment. Please settle your balance immediately to avoid service interruption.` },
                    { label: "Package updated", text: `Dear ${msgModal.name}, your SkinLink subscription package has been updated. Please contact us if you have any questions about your new plan.` },
                    { label: "Service restored", text: `Dear ${msgModal.name}, your payment has been received and verified. Your SkinLink service access has been fully restored. Thank you.` },
                  ].map(t => (
                    <button key={t.label} onClick={() => setMsgText(t.text)}
                      className="text-left text-xs text-amber-700 underline hover:text-amber-900">{t.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message to client</label>
                <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Type your message…" rows={5}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end border-t border-border px-6 py-4">
              <Button variant="outline" size="sm" onClick={() => setMsgModal(null)}>Cancel</Button>
              <Button size="sm" disabled={!msgText.trim() || actionLoading === msgModal.id} onClick={sendMessage} className="gap-1.5">
                {actionLoading === msgModal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                Send Notice
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ══ GLOBAL PACKAGE PRICE EDITOR ═══════════════════════════════════════ */}
      {globalPkgEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-slate-900">Edit Global Package Price</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <span className={cn("inline rounded px-1.5 py-0.5 text-[10px] font-bold mr-1", globalPkgEdit.badgeColor)}>{globalPkgEdit.badge}</span>
                  {globalPkgEdit.name}
                </p>
              </div>
              <button onClick={() => setGlobalPkgEdit(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Global change — affects all clients</p>
                  <p className="mt-0.5 text-amber-700">
                    This updates the price on the landing page, register form, and every existing client account currently on this package.
                  </p>
                </div>
              </div>

              {/* Current vs new */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">Current price</p>
                  <p className="text-lg font-bold text-slate-900">{formatTZS(globalPkgEdit.amount)}</p>
                  <p className="text-xs text-slate-500">/{globalPkgEdit.billingCycle}</p>
                </div>
                <div className={cn("rounded-lg border p-3", globalPkgAmount !== globalPkgEdit.amount ? "bg-primary/5 border-primary/30" : "bg-slate-50 border-slate-200")}>
                  <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">New price</p>
                  <p className={cn("text-lg font-bold", globalPkgAmount !== globalPkgEdit.amount ? "text-primary" : "text-slate-400")}>
                    {globalPkgAmount ? formatTZS(globalPkgAmount) : "—"}
                  </p>
                  <p className="text-xs text-slate-500">/{globalPkgCycle}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New monthly base amount (TZS) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={globalPkgAmount || ""}
                  onChange={e => setGlobalPkgAmount(+e.target.value)}
                  placeholder="e.g. 300000"
                  className="w-full rounded-lg border border-primary px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default billing cycle</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["monthly", "quarterly", "annually"] as const).map(c => (
                    <button key={c} type="button" onClick={() => setGlobalPkgCycle(c)}
                      className={cn("rounded-lg border py-2.5 text-xs font-semibold capitalize transition-colors",
                        globalPkgCycle === c ? "border-primary bg-primary/10 text-primary" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setGlobalPkgEdit(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <Button
                disabled={!globalPkgAmount || globalPkgAmount <= 0 || actionLoading === "global_" + globalPkgEdit.name}
                onClick={updateGlobalPackage}
                className="gap-1.5 bg-primary px-5">
                {actionLoading === "global_" + globalPkgEdit.name
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Globe className="h-3.5 w-3.5" />}
                Update globally
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
