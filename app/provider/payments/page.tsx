"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import {
  TrendingUp, CreditCard, AlertCircle, CheckCircle2, Clock,
  Building2, DollarSign, ShieldOff, ArrowRight, Loader2, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Application {
  id: string
  applicationType: string
  status: string
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
  paymentHistory?: { id: string; amountPaid: number; recordedAt: string; paymentMethod: string; validUntil: string; paymentReference: string }[]
  provisionedTenantId?: string
  submittedAt: string
}

function statCard(
  label: string,
  value: string | number,
  sub: string,
  icon: React.ReactNode,
  color: string,
) {
  return (
    <Card className={cn("flex items-start gap-4 p-5 border-l-4", color)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
    </Card>
  )
}

export default function PaymentOverviewPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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

  const stats = useMemo(() => {
    const totalRevenue = apps.reduce((s, a) => s + (a.amountPaid || 0), 0)
    const paid = apps.filter(a => a.paymentStatus === "paid").length
    const pending = apps.filter(a => !a.paymentStatus || a.paymentStatus === "pending_verification").length
    const overdue = apps.filter(a => a.paymentStatus === "overdue").length
    const blocked = apps.filter(a => a.serviceAccess === "blocked").length
    const recentPayments = apps
      .flatMap(a =>
        (a.paymentHistory || []).map(p => ({
          ...p,
          clientName: a.orgName || a.fullName || a.contactEmail || a.email || "—",
          appId: a.id,
          packageName: a.selectedPackage?.packageName || "—",
        }))
      )
      .sort((x, y) => new Date(y.recordedAt).getTime() - new Date(x.recordedAt).getTime())
      .slice(0, 8)

    return { totalRevenue, paid, pending, overdue, blocked, recentPayments }
  }, [apps])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const fmt = (n: number) => `TZS ${n.toLocaleString()}`

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Payment Overview"
        description="Monitor subscription revenue, billing status, and payment health across all clients"
        actions={
          <button
            onClick={() => load(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCard("Total Revenue Collected", fmt(stats.totalRevenue), "All-time external payments", <DollarSign className="h-5 w-5 text-emerald-600" />, "border-emerald-400")}
        {statCard("Active Subscriptions", stats.paid, "Clients with paid & active plans", <CheckCircle2 className="h-5 w-5 text-teal-600" />, "border-teal-400")}
        {statCard("Pending Payment", stats.pending, "Awaiting external payment confirmation", <Clock className="h-5 w-5 text-amber-600" />, "border-amber-400")}
        {statCard("Blocked Clients", stats.blocked, "Service suspended — action needed", <ShieldOff className="h-5 w-5 text-rose-600" />, "border-rose-400")}
      </div>

      {/* Quick Action Links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Manage Subscriptions", desc: "View all client plans, record payments, update packages", href: "/provider/payments/subscriptions", icon: <CreditCard className="h-5 w-5 text-primary" />, color: "border-primary/30 hover:border-primary/60" },
          { label: "Billing History", desc: "Full audit trail of all recorded payments by date", href: "/provider/payments/history", icon: <TrendingUp className="h-5 w-5 text-indigo-600" />, color: "border-indigo-300 hover:border-indigo-500" },
          { label: "Overdue & Blocked", desc: `${stats.overdue + stats.blocked} clients need immediate attention`, href: "/provider/payments/overdue", icon: <AlertCircle className="h-5 w-5 text-rose-600" />, color: "border-rose-300 hover:border-rose-500" },
        ].map(q => (
          <Link key={q.href} href={q.href}
            className={cn("flex flex-col gap-3 rounded-xl border-2 bg-white p-5 transition-all hover:shadow-md", q.color)}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                {q.icon}
              </div>
              <span className="font-semibold text-sm text-slate-900">{q.label}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{q.desc}</p>
            <div className="flex items-center gap-1 text-xs font-semibold text-primary">
              Open <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Payments Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Recent Payments</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest recorded external payments across all clients</p>
          </div>
          <Link href="/provider/payments/history" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {stats.recentPayments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No payments recorded yet</p>
            <Link href="/provider/payments/subscriptions" className="text-xs font-semibold text-primary hover:underline">
              Record a payment →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats.recentPayments.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.clientName}</p>
                  <p className="text-[11px] text-slate-400">{p.packageName} · Ref: {p.paymentReference}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-700">TZS {p.amountPaid.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">{formatDate(p.recordedAt)}</p>
                </div>
                <div className="hidden sm:block text-right shrink-0">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    {p.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Summary by Package */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-slate-900">Subscription Package Distribution</h2>
          <p className="text-xs text-slate-500 mt-0.5">Breakdown of clients per package tier</p>
        </div>
        <div className="p-5">
          {(() => {
            const byPkg: Record<string, { count: number; revenue: number }> = {}
            apps.forEach(a => {
              const name = a.selectedPackage?.packageName || "No Package"
              if (!byPkg[name]) byPkg[name] = { count: 0, revenue: 0 }
              byPkg[name].count++
              byPkg[name].revenue += a.amountPaid || 0
            })
            const entries = Object.entries(byPkg).sort((a, b) => b[1].revenue - a[1].revenue)
            if (entries.length === 0) return (
              <p className="text-sm text-slate-400 text-center py-4">No subscription data yet</p>
            )
            return (
              <div className="space-y-3">
                {entries.map(([name, data]) => {
                  const maxRevenue = Math.max(...entries.map(e => e[1].revenue)) || 1
                  const pct = Math.round((data.revenue / maxRevenue) * 100)
                  return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{name}</span>
                        <span className="text-slate-500">{data.count} client{data.count !== 1 ? "s" : ""} · TZS {data.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </Card>
    </div>
  )
}
