"use client"

import { useEffect, useState, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Receipt, Loader2, RefreshCw, Search, CheckCircle2 } from "lucide-react"

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

interface Application {
  id: string
  orgName?: string
  fullName?: string
  contactEmail?: string
  email?: string
  selectedPackage?: { packageName: string; amount: number; currency: string; billingCycle: string }
  paymentHistory?: PaymentRecord[]
  status?: string
}

interface FlatPayment extends PaymentRecord {
  clientName: string
  packageName: string
  appId: string
}

export default function BillingHistoryPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")

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

  const allPayments = useMemo<FlatPayment[]>(() => {
    return apps
      .flatMap(a =>
        (a.paymentHistory || []).map(p => ({
          ...p,
          clientName: a.orgName || a.fullName || a.contactEmail || a.email || "—",
          packageName: a.selectedPackage?.packageName || "—",
          appId: a.id,
        }))
      )
      .sort((x, y) => new Date(y.recordedAt).getTime() - new Date(x.recordedAt).getTime())
  }, [apps])

  const filtered = useMemo(() => {
    if (!search.trim()) return allPayments
    const q = search.toLowerCase()
    return allPayments.filter(
      p =>
        p.clientName.toLowerCase().includes(q) ||
        p.paymentReference.toLowerCase().includes(q) ||
        p.paymentMethod.toLowerCase().includes(q)
    )
  }, [allPayments, search])

  const totalRevenue = allPayments.reduce((s, p) => s + p.amountPaid, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Billing History"
        description="Complete audit trail of all recorded external payments across all clients."
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

      {/* Summary Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5 border-l-4 border-emerald-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <Receipt className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">TZS {totalRevenue.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-700">Total Revenue Recorded</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 border-l-4 border-teal-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
            <CheckCircle2 className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{allPayments.length}</p>
            <p className="text-xs font-semibold text-slate-700">Total Payments Recorded</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 border-l-4 border-indigo-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <Receipt className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{apps.length}</p>
            <p className="text-xs font-semibold text-slate-700">Active Client Accounts</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client, payment reference, or payment method…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-slate-900">Payment Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} payments</p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No payment records found</p>
            <p className="text-xs text-muted-foreground">Payments are recorded via the Subscriptions page.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{p.clientName}</p>
                  <p className="text-[11px] text-slate-400">{p.packageName} · Ref: <span className="font-mono">{p.paymentReference}</span></p>
                </div>

                <div className="hidden sm:block text-center">
                  <p className="text-xs font-medium text-slate-700">{p.paymentMethod}</p>
                  <p className="text-[11px] text-slate-400">{p.billingCycle}</p>
                </div>

                <div className="hidden md:block text-center">
                  <p className="text-xs font-medium text-slate-700">Valid until</p>
                  <p className="text-[11px] text-slate-400">{formatDate(p.validUntil)}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-700">TZS {p.amountPaid.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">{formatDate(p.recordedAt)}</p>
                </div>

                <div className="hidden lg:block shrink-0">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
