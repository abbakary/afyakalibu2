"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Key, Copy, Eye, EyeOff, RefreshCw, BarChart3, Shield, Zap,
  CheckCircle2, AlertTriangle, ExternalLink, ArrowRight, Loader2, BookOpen,
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useData } from "@/lib/data-store"

interface MyKey {
  id: string; tierId: string; tierName: string; scopes: string[]
  limits: { requestsPerMonth: number; requestsPerMinute: number }
  keyPrefix: string; status: string; requestsThisMonth: number
  requestsTotal: number; createdAt: string; lastUsedAt?: string
}

export default function ApiAccessPage() {
  const { currentUser, activeTenant } = useData()
  const [myKey, setMyKey] = useState<MyKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [keyVisible, setKeyVisible] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  // Try to load key via /api-access/me (key-holder auth) — but here the user
  // is logged in via JWT not API key, so we show their tenant's key info from
  // the applications data if available
  useEffect(() => {
    apiFetch<MyKey>("/api-access/me")
      .then(setMyKey)
      .catch(() => setMyKey(null))
      .finally(() => setLoading(false))
  }, [])

  async function rotateSelf() {
    setRotating(true)
    try {
      const res = await apiFetch<{ rawKey: string }>("/api-access/me/rotate", { method: "POST" })
      setNewKey(res.rawKey)
      toast.success("Key rotated — copy new key now")
      const updated = await apiFetch<MyKey>("/api-access/me")
      setMyKey(updated)
    } catch (e) {
      toast.error("Rotation requires a valid API key in the Authorization header. Contact your provider.")
    } finally {
      setRotating(false)
    }
  }

  const quota = myKey?.limits.requestsPerMonth ?? 0
  const used = myKey?.requestsThisMonth ?? 0
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0

  const TIER_COLORS: Record<string, string> = {
    free: "bg-slate-100 text-slate-700", starter: "bg-blue-100 text-blue-700",
    growth: "bg-teal-100 text-teal-700", enterprise: "bg-violet-100 text-violet-700",
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="API Access"
        description="Manage your SkinLink API credentials and monitor usage"
        actions={
          <Link href="/api-docs" target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-muted transition-colors">
            <BookOpen className="h-4 w-4" /> API documentation <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !myKey ? (
        /* ── No API key — apply CTA ── */
        <div className="space-y-6">
          <Card className="flex flex-col items-center gap-5 py-14 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Key className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900">No API key for this account</h2>
              <p className="mt-2 text-slate-500 max-w-lg">
                Apply for an API key to integrate SkinLink cases, patients, and AI assessments into your own systems.
                Available on Starter, Growth, and Enterprise plans.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/api-docs/apply"
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90">
                Apply for API access <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/api-docs"
                className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-muted">
                <BookOpen className="h-4 w-4" /> Read the docs
              </Link>
            </div>
          </Card>

          {/* Feature overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Submit cases", desc: "Programmatically submit referral cases with images from your own app", plan: "Starter" },
              { icon: BarChart3, title: "Sync patients", desc: "Read and write patient records to integrate with your EMR or mobile app", plan: "Starter" },
              { icon: Shield, title: "AI assessments", desc: "Trigger AI skin assessments and retrieve structured results", plan: "Growth" },
              { icon: Key, title: "FHIR R4 export", desc: "Export data as HL7 FHIR R4 resources for OpenMRS, DHIS2, Epic and more", plan: "Enterprise" },
            ].map(f => (
              <Card key={f.title} className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  <f.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm text-slate-900">{f.title}</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                <span className={cn("mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                  { Starter: "bg-blue-100 text-blue-700", Growth: "bg-teal-100 text-teal-700", Enterprise: "bg-violet-100 text-violet-700" }[f.plan])}>
                  {f.plan}+
                </span>
              </Card>
            ))}
          </div>

          {/* Pricing summary */}
          <Card className="overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-heading text-sm font-semibold">API pricing</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/40">
                  {["Plan","Monthly price","Req/month","Req/minute","Scopes","Support"].map(h =>
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {[
                    { plan: "Developer", price: "Free", rpm: "500", rps: "10", scopes: "Read only", support: "Community" },
                    { plan: "Starter", price: "TZS 150,000/mo", rpm: "10,000", rps: "60", scopes: "Read + write", support: "Email 48h" },
                    { plan: "Growth", price: "TZS 400,000/mo", rpm: "100,000", rps: "300", scopes: "Full + AI + webhooks", support: "Email 24h" },
                    { plan: "Enterprise", price: "Negotiated", rpm: "Unlimited", rps: "Unlimited", scopes: "All + FHIR R4", support: "Dedicated" },
                  ].map(p => (
                    <tr key={p.plan} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold">{p.plan}</td>
                      <td className="px-4 py-3 text-primary font-semibold">{p.price}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.rpm}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.rps}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.scopes}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* ── Has API key ── */
        <div className="space-y-6">
          {/* Status banner */}
          <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
            myKey.status === "active" ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20")}>
            {myKey.status === "active" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            <span className="font-semibold">{myKey.status === "active" ? "API key active" : `Key ${myKey.status} — contact support`}</span>
            <span className={cn("ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold", TIER_COLORS[myKey.tierId] ?? "")}>{myKey.tierName}</span>
          </div>

          {/* Key info + usage */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-sm font-semibold">Your API key</h3>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Key prefix</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 font-mono text-sm text-slate-800 break-all">
                    {keyVisible ? myKey.keyPrefix : myKey.keyPrefix.slice(0, 14) + "•".repeat(20)}
                  </code>
                  <button onClick={() => setKeyVisible(v => !v)} className="text-muted-foreground hover:text-foreground">
                    {keyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {newKey && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-bold text-emerald-800 mb-2">New key — copy now (shown once)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs text-emerald-700 break-all">{newKey}</code>
                    <button onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied") }}>
                      <Copy className="h-4 w-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              )}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-medium">{formatDate(myKey.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Last used</dt><dd className="font-medium">{myKey.lastUsedAt ? formatDate(myKey.lastUsedAt) : "Never"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Total requests</dt><dd className="font-medium">{myKey.requestsTotal.toLocaleString()}</dd></div>
              </dl>
              <Button variant="outline" size="sm" onClick={rotateSelf} disabled={rotating} className="w-full">
                {rotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Rotate key
              </Button>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-sm font-semibold">Usage this month</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests used</span>
                  <span className="font-semibold">{used.toLocaleString()} / {quota < 0 ? "∞" : quota.toLocaleString()}</span>
                </div>
                <Progress value={pct} className={cn("h-3", pct >= 90 && "[&>div]:bg-destructive", pct >= 70 && pct < 90 && "[&>div]:bg-warning")} />
                <p className={cn("text-xs", pct >= 90 ? "text-destructive font-semibold" : pct >= 70 ? "text-warning-foreground" : "text-muted-foreground")}>
                  {pct >= 90 ? "Quota nearly exhausted — consider upgrading" : pct >= 70 ? "Approaching monthly limit" : `${100 - pct}% remaining this month`}
                </p>
              </div>
              <dl className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between"><dt className="text-muted-foreground">Rate limit</dt><dd className="font-medium">{myKey.limits.requestsPerMinute < 0 ? "Unlimited" : `${myKey.limits.requestsPerMinute} req/min`}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Monthly quota</dt><dd className="font-medium">{quota < 0 ? "Unlimited" : quota.toLocaleString()}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Plan</dt><dd><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TIER_COLORS[myKey.tierId] ?? "")}>{myKey.tierName}</span></dd></div>
              </dl>
              <Link href="/api-docs/apply" className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
                Upgrade plan <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          </div>

          {/* EMR & HL7 FHIR R4 Interoperability */}
          <Card className="p-5 space-y-4 border-l-4 border-l-teal-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-teal-600" />
                <h3 className="font-heading text-sm font-bold text-slate-900">Hospital EMR & HL7 FHIR R4 Integration</h3>
              </div>
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-extrabold text-teal-800 uppercase tracking-wider">
                Enterprise & Growth
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              SkinLink supports native bidirectional interoperability with OpenMRS, DHIS2, Bahmni, Epic, and custom hospital systems.
              Export clinical cases and specialist notes directly into your Electronic Medical Record using standardized FHIR R4 resources.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Patient Resource
                </span>
                <code className="block text-[10px] font-mono text-slate-600 truncate">GET /api/v1/fhir/r4/Patient/&#123;id&#125;</code>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> DiagnosticReport
                </span>
                <code className="block text-[10px] font-mono text-slate-600 truncate">GET /api/v1/fhir/r4/DiagnosticReport/&#123;case_id&#125;</code>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Batch Sync Bundle
                </span>
                <code className="block text-[10px] font-mono text-slate-600 truncate">GET /api/v1/fhir/r4/Bundle</code>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/api-docs"
                target="_blank"
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5" /> View FHIR R4 implementation guide <ExternalLink className="h-3 w-3" />
              </Link>
              <span className="text-slate-300">·</span>
              <a
                href="mailto:integrations@skinlink.health"
                className="text-xs font-semibold text-slate-600 hover:text-primary"
              >
                Request custom EMR connector setup
              </a>
            </div>
          </Card>

          {/* Scopes */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-semibold">Granted scopes</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {myKey.scopes.map(s => (
                <span key={s} className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/8 px-3 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  <code>{s}</code>
                </span>
              ))}
            </div>
          </Card>

          {/* Quick start */}
          <Card className="p-5 space-y-3">
            <h3 className="font-heading text-sm font-semibold">Quick start</h3>
            <div className="rounded-xl bg-[#0d1117] p-4">
              <pre className="text-xs text-slate-300 overflow-x-auto leading-relaxed">{`curl -X GET https://api.skinlink.health/v1/cases \\
  -H "Authorization: Bearer ${myKey.keyPrefix}..."
  -H "Content-Type: application/json"`}</pre>
            </div>
            <div className="flex gap-3">
              <Link href="/api-docs" target="_blank" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <BookOpen className="h-4 w-4" /> Full documentation <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
