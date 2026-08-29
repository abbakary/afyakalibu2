"use client"

import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Key, Plus, RefreshCw, ShieldOff, ShieldCheck, Copy, Eye, EyeOff,
  Check, X, Loader2, BarChart3, Users, Zap, ChevronDown, ChevronUp,
  DollarSign, AlertTriangle, Code2, CheckCircle2, Clock, Globe,
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiTier { id: string; name: string; priceMonthly: number; currency: string; requestsPerMonth: number; requestsPerMinute: number; scopes: string[]; support: string; badge: string; custom?: boolean }
interface ApiApplication { id: string; orgName: string; contactName: string; email: string; tierId: string; tierName: string; intendedUse: string; integrationType: string; status: "pending"|"approved"|"rejected"; submittedAt: string; reviewedAt?: string; reviewedBy?: string; rejectionReason?: string; issuedKeyId?: string; notes?: string }
interface ApiKey { id: string; applicationId: string; orgName: string; contactName: string; email: string; tierId: string; tierName: string; scopes: string[]; limits: { requestsPerMonth: number; requestsPerMinute: number }; keyPrefix: string; status: "active"|"revoked"; requestsThisMonth: number; requestsTotal: number; createdAt: string; lastUsedAt?: string; billingReference?: string }

const TIER_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-700", starter: "bg-blue-100 text-blue-700",
  growth: "bg-teal-100 text-teal-700", enterprise: "bg-violet-100 text-violet-700",
}

export default function ProviderApiPage() {
  const [tiers, setTiers] = useState<ApiTier[]>([])
  const [apps, setApps] = useState<ApiApplication[]>([])
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"overview"|"applications"|"keys"|"pricing">("overview")

  // Approve modal
  const [approveApp, setApproveApp] = useState<ApiApplication | null>(null)
  const [approveLoading, setApproveLoading] = useState(false)
  const [approveTier, setApproveTier] = useState("starter")
  const [approveBillingRef, setApproveBillingRef] = useState("")
  const [approveNotes, setApproveNotes] = useState("")
  const [issuedKey, setIssuedKey] = useState<string | null>(null)
  const [keyVisible, setKeyVisible] = useState(false)

  // Reject modal
  const [rejectApp, setRejectApp] = useState<ApiApplication | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectLoading, setRejectLoading] = useState(false)

  // Limits modal
  const [editKey, setEditKey] = useState<ApiKey | null>(null)
  const [editRpm, setEditRpm] = useState("")
  const [editRpm2, setEditRpm2] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [t, a, k] = await Promise.all([
        apiFetch<ApiTier[]>("/api-access/tiers"),
        apiFetch<ApiApplication[]>("/api-access/applications"),
        apiFetch<ApiKey[]>("/api-access/keys"),
      ])
      setTiers(t); setApps(a); setKeys(k)
    } catch (e) {
      toast.error("Failed to load API management data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => ({
    pending: apps.filter(a => a.status === "pending").length,
    active: keys.filter(k => k.status === "active").length,
    revoked: keys.filter(k => k.status === "revoked").length,
    totalRequests: keys.reduce((s, k) => s + k.requestsTotal, 0),
    mrr: keys.filter(k => k.status === "active").reduce((s, k) => {
      const t = tiers.find(t => t.id === k.tierId)
      return s + (t?.priceMonthly ?? 0)
    }, 0),
  }), [apps, keys, tiers])

  async function handleApprove() {
    if (!approveApp) return
    setApproveLoading(true)
    try {
      const res = await apiFetch<{ rawKey: string }>(`/api-access/applications/${approveApp.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ tierId: approveTier, billingReference: approveBillingRef || undefined, notes: approveNotes || undefined }),
      })
      setIssuedKey(res.rawKey)
      toast.success("API key issued successfully")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approval failed")
    } finally {
      setApproveLoading(false)
    }
  }

  async function handleReject() {
    if (!rejectApp || !rejectReason.trim()) return
    setRejectLoading(true)
    try {
      await apiFetch(`/api-access/applications/${rejectApp.id}/reject`, {
        method: "POST", body: JSON.stringify({ reason: rejectReason }),
      })
      toast.success("Application rejected")
      setRejectApp(null); setRejectReason("")
      await load()
    } catch (e) {
      toast.error("Rejection failed")
    } finally {
      setRejectLoading(false)
    }
  }

  async function handleRevoke(key: ApiKey) {
    try {
      await apiFetch(`/api-access/keys/${key.id}/revoke`, { method: "POST" })
      toast.success(`Key for ${key.orgName} revoked`)
      await load()
    } catch { toast.error("Revoke failed") }
  }

  async function handleRotate(key: ApiKey) {
    try {
      const res = await apiFetch<{ rawKey: string }>(`/api-access/keys/${key.id}/rotate`, { method: "POST" })
      setIssuedKey(res.rawKey)
      setKeyVisible(false)
      toast.success("Key rotated — new key shown below")
      await load()
    } catch { toast.error("Rotation failed") }
  }

  async function handleUpdateLimits() {
    if (!editKey) return
    setEditLoading(true)
    try {
      await apiFetch(`/api-access/keys/${editKey.id}/limits`, {
        method: "PATCH",
        body: JSON.stringify({ requestsPerMonth: Number(editRpm) || undefined, requestsPerMinute: Number(editRpm2) || undefined }),
      })
      toast.success("Limits updated")
      setEditKey(null)
      await load()
    } catch { toast.error("Update failed") }
    finally { setEditLoading(false) }
  }

  const TABS = [
    { key: "overview",      label: "Overview",      badge: null },
    { key: "applications",  label: "Applications",  badge: stats.pending || null },
    { key: "keys",          label: "Issued Keys",   badge: null },
    { key: "pricing",       label: "Pricing Tiers", badge: null },
  ] as const

  if (loading) return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="API Access Management"
        description="Issue credentials, manage tiers, review applications, and monitor API usage"
        actions={
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={cn("-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t.label}
            {t.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Pending Applications", value: stats.pending, icon: Clock, color: "border-amber-400", bg: "bg-amber-50", ic: "text-amber-600" },
              { label: "Active API Keys",       value: stats.active,  icon: Key,   color: "border-teal-400",  bg: "bg-teal-50",  ic: "text-teal-600" },
              { label: "Revoked Keys",          value: stats.revoked, icon: ShieldOff, color: "border-slate-300", bg: "bg-slate-50", ic: "text-slate-500" },
              { label: "Total API Requests",    value: stats.totalRequests.toLocaleString(), icon: BarChart3, color: "border-blue-400", bg: "bg-blue-50", ic: "text-blue-600" },
              { label: "Est. API MRR (TZS)",    value: `${(stats.mrr/1000).toFixed(0)}k`, icon: DollarSign, color: "border-emerald-400", bg: "bg-emerald-50", ic: "text-emerald-600" },
            ].map(s => (
              <Card key={s.label} className={cn("flex items-center gap-4 p-5 border-l-4", s.color)}>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.bg)}>
                  <s.icon className={cn("h-5 w-5", s.ic)} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Active keys table */}
          <Card className="overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-heading text-sm font-semibold">Active API Keys</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/40">
                  {["Organisation","Tier","Key prefix","Requests (month)","Quota","Last used","Status"].map(h =>
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {keys.filter(k => k.status === "active").map(k => {
                    const quota = k.limits.requestsPerMonth
                    const pct = quota > 0 ? Math.min(100, Math.round((k.requestsThisMonth / quota) * 100)) : 0
                    return (
                      <tr key={k.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium">{k.orgName}</p>
                          <p className="text-xs text-muted-foreground">{k.email}</p>
                        </td>
                        <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TIER_COLORS[k.tierId] ?? "")}>{k.tierName}</span></td>
                        <td className="px-4 py-3 font-mono text-xs">{k.keyPrefix}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className={cn("h-1.5 w-20", pct >= 90 && "[&>div]:bg-destructive")} />
                            <span>{k.requestsThisMonth.toLocaleString()} / {quota < 0 ? "∞" : quota.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">{quota < 0 ? "Unlimited" : `${quota.toLocaleString()}/mo`}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{k.lastUsedAt ? formatDate(k.lastUsedAt) : "Never"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleRotate(k)} className="rounded px-2 py-1 text-xs font-medium text-primary border border-primary/30 hover:bg-primary/5">Rotate</button>
                            <button onClick={() => { setEditKey(k); setEditRpm(String(k.limits.requestsPerMonth)); setEditRpm2(String(k.limits.requestsPerMinute)) }} className="rounded px-2 py-1 text-xs font-medium text-slate-600 border border-border hover:bg-muted">Limits</button>
                            <button onClick={() => handleRevoke(k)} className="rounded px-2 py-1 text-xs font-bold text-destructive border border-destructive/30 hover:bg-destructive/5">Revoke</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {keys.filter(k => k.status === "active").length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No active API keys.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── APPLICATIONS ── */}
      {tab === "applications" && (
        <div className="space-y-3">
          {apps.length === 0 && (
            <Card className="flex flex-col items-center gap-2 py-14 text-center">
              <Globe className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No API access applications yet.</p>
            </Card>
          )}
          {apps.map(app => (
            <Card key={app.id} className="overflow-hidden">
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{app.orgName}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                      app.status === "pending" ? "bg-amber-100 text-amber-800"
                      : app.status === "approved" ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800")}>
                      {app.status.toUpperCase()}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TIER_COLORS[app.tierId] ?? "")}>{app.tierName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{app.contactName} · {app.email} · {app.integrationType}</p>
                  <p className="text-xs text-slate-600 mt-1.5 italic">"{app.intendedUse}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Submitted {formatDate(app.submittedAt)}</p>
                  {app.rejectionReason && <p className="mt-1.5 text-xs text-destructive">Rejected: {app.rejectionReason}</p>}
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => { setApproveApp(app); setApproveTier(app.tierId); setIssuedKey(null) }}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => { setRejectApp(app); setRejectReason("") }}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── KEYS ── */}
      {tab === "keys" && (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-heading text-sm font-semibold">All API Keys ({keys.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {keys.map(k => (
              <div key={k.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  k.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {k.orgName[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{k.orgName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{k.keyPrefix} · {k.email}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TIER_COLORS[k.tierId] ?? "")}>{k.tierName}</span>
                <span className="text-xs text-muted-foreground">{k.requestsTotal.toLocaleString()} total req.</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                  k.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {k.status}
                </span>
                <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(k.createdAt)}</p>
              </div>
            ))}
            {keys.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">No keys issued yet.</p>
            )}
          </div>
        </Card>
      )}

      {/* ── PRICING ── */}
      {tab === "pricing" && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {tiers.map(tier => (
            <Card key={tier.id} className={cn("flex flex-col p-6", tier.id === "growth" && "ring-2 ring-primary shadow-lg shadow-primary/10")}>
              {tier.id === "growth" && (
                <span className="mb-3 self-start rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">Most popular</span>
              )}
              <span className={cn("self-start rounded px-2 py-0.5 text-[10px] font-bold mb-2", TIER_COLORS[tier.id] ?? "")}>{tier.badge}</span>
              <p className="font-heading text-lg font-extrabold">{tier.name}</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-2xl font-extrabold">{tier.priceMonthly > 0 ? `TZS ${tier.priceMonthly.toLocaleString()}` : tier.custom ? "Negotiated" : "Free"}</span>
                {tier.priceMonthly > 0 && <span className="text-sm text-muted-foreground mb-1">/mo</span>}
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                <li className="flex gap-2 text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />{tier.requestsPerMonth < 0 ? "Unlimited requests/month" : `${tier.requestsPerMonth.toLocaleString()} req/month`}</li>
                <li className="flex gap-2 text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />{tier.requestsPerMinute < 0 ? "Unlimited req/minute" : `${tier.requestsPerMinute} req/minute`}</li>
                {tier.scopes[0] === "*" ? (
                  <li className="flex gap-2 text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />All scopes</li>
                ) : tier.scopes.map(s => (
                  <li key={s} className="flex gap-2 text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" /><code className="text-xs">{s}</code></li>
                ))}
                <li className="flex gap-2 text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />{tier.support}</li>
              </ul>
            </Card>
          ))}
        </div>
      )}

      {/* ══ APPROVE MODAL ══════════════════════════════════════════════════ */}
      {approveApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900">Approve API Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">{approveApp.orgName} · {approveApp.email}</p>
              </div>
              <button onClick={() => setApproveApp(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            {issuedKey ? (
              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-semibold text-emerald-800 flex items-center gap-2 mb-2"><Key className="h-4 w-4" /> API Key Issued — Copy Now</p>
                  <p className="text-xs text-emerald-700 mb-3">This key is shown <strong>once only</strong>. Copy it and send to the client securely.</p>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2">
                    <code className="flex-1 font-mono text-xs break-all">{keyVisible ? issuedKey : issuedKey.replace(/./g, "•")}</code>
                    <button onClick={() => setKeyVisible(v => !v)} className="text-slate-400 hover:text-slate-700">{keyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    <button onClick={() => { navigator.clipboard.writeText(issuedKey); toast.success("Key copied") }} className="text-slate-400 hover:text-slate-700"><Copy className="h-4 w-4" /></button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setApproveApp(null); setIssuedKey(null) }}><Check className="h-4 w-4" /> Done — Key saved</Button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign tier</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tiers.filter(t => !t.custom).map(t => (
                      <label key={t.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-all", approveTier === t.id ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40")}>
                        <input type="radio" name="tier" checked={approveTier === t.id} onChange={() => setApproveTier(t.id)} className="accent-primary" />
                        <div>
                          <p className="font-semibold">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.priceMonthly > 0 ? `TZS ${t.priceMonthly.toLocaleString()}/mo` : "Free"}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Billing reference (invoice / M-Pesa ref)</label>
                  <input value={approveBillingRef} onChange={e => setApproveBillingRef(e.target.value)} placeholder="e.g. MPESA-XXXXX or INV-2025-001"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internal notes (optional)</label>
                  <textarea value={approveNotes} onChange={e => setApproveNotes(e.target.value)} rows={2}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button variant="outline" size="sm" onClick={() => setApproveApp(null)}>Cancel</Button>
                  <Button size="sm" onClick={handleApprove} disabled={approveLoading}>
                    {approveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} Issue API Key
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ REJECT MODAL ══ */}
      {rejectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="font-bold text-destructive">Reject Application</h3>
              <button onClick={() => setRejectApp(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Rejecting application from <strong>{rejectApp.orgName}</strong>. Provide a clear reason so the applicant can re-apply.</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="e.g. Insufficient technical detail, missing business registration, etc."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setRejectApp(null)}>Cancel</Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/40" onClick={handleReject} disabled={rejectLoading || !rejectReason.trim()}>
                  {rejectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ LIMITS MODAL ══ */}
      {editKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="font-bold text-slate-900">Update Rate Limits</h3>
              <button onClick={() => setEditKey(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">{editKey.orgName} · {editKey.tierName}</p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Requests per month (-1 = unlimited)</label>
                <input type="number" value={editRpm} onChange={e => setEditRpm(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Requests per minute (-1 = unlimited)</label>
                <input type="number" value={editRpm2} onChange={e => setEditRpm2(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditKey(null)}>Cancel</Button>
                <Button size="sm" onClick={handleUpdateLimits} disabled={editLoading}>
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Newly rotated key display */}
      {issuedKey && !approveApp && (
        <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-emerald-800 flex items-center gap-2"><Key className="h-4 w-4" /> New key issued</p>
            <button onClick={() => setIssuedKey(null)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2">
            <code className="flex-1 font-mono text-xs break-all">{keyVisible ? issuedKey : issuedKey.replace(/./g, "•")}</code>
            <button onClick={() => setKeyVisible(v => !v)}>{keyVisible ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}</button>
            <button onClick={() => { navigator.clipboard.writeText(issuedKey); toast.success("Copied") }}><Copy className="h-4 w-4 text-slate-400" /></button>
          </div>
          <p className="mt-2 text-xs text-emerald-700">Shown once — copy now and send securely to the client.</p>
        </div>
      )}
    </div>
  )
}
