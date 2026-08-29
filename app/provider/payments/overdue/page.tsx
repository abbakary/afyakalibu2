"use client"

import { useEffect, useState, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  AlertCircle, ShieldOff, ShieldCheck, Loader2, RefreshCw,
  MessageSquare, CreditCard, X,
} from "lucide-react"

interface Application {
  id: string
  orgName?: string
  fullName?: string
  contactEmail?: string
  email?: string
  selectedPackage?: { packageName: string; amount: number; currency: string; billingCycle: string }
  paymentStatus?: string
  serviceAccess?: string
  paymentExpiryDate?: string
  blockReason?: string
  blockedAt?: string
  status?: string
}

export default function OverduePage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msgModal, setMsgModal] = useState<{ id: string; name: string } | null>(null)
  const [msgText, setMsgText] = useState("")
  const [payModal, setPayModal] = useState<Application | null>(null)
  const [payRef, setPayRef] = useState("")
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState("M-Pesa")
  const [payUntil, setPayUntil] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split("T")[0]
  })

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await apiFetch<Application[]>("/applications")
      // Show approved clients that are overdue OR blocked
      setApps(data.filter(a =>
        a.status === "approved" &&
        (a.paymentStatus === "overdue" || a.serviceAccess === "blocked" || a.paymentStatus === "pending_verification")
      ))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleBlock(appId: string) {
    setActionLoading(appId)
    try {
      const res = await apiFetch<{ application: Application; serviceAccess: string }>(
        `/applications/${appId}/toggle-service-block`,
        { method: "POST", body: JSON.stringify({ reason: "Payment overdue — Provider action" }) }
      )
      const wasBlocked = res.serviceAccess === "active"
      toast.success(wasBlocked ? "Service restored for client" : "Service blocked successfully")
      await load(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to toggle block")
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
      toast.success("Payment reminder sent to client dashboard")
      setMsgModal(null)
      setMsgText("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message")
    } finally {
      setActionLoading(null)
    }
  }

  async function recordPayment() {
    if (!payModal || !payRef.trim()) { toast.error("Payment reference required"); return }
    setActionLoading(payModal.id)
    try {
      await apiFetch(`/applications/${payModal.id}/record-payment`, {
        method: "POST",
        body: JSON.stringify({
          paymentReference: payRef,
          amountPaid: payAmount,
          paymentMethod: payMethod,
          validUntil: payUntil,
        }),
      })
      toast.success("Payment recorded — service restored")
      setPayModal(null)
      await load(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment")
    } finally {
      setActionLoading(null)
    }
  }

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
        title="Overdue & Blocked Accounts"
        description="Clients with pending or overdue payments. Send reminders or block service access."
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

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5 border-l-4 border-amber-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {apps.filter(a => a.paymentStatus === "overdue" || a.paymentStatus === "pending_verification").length}
            </p>
            <p className="text-xs font-semibold text-slate-700">Overdue / Pending</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 border-l-4 border-rose-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
            <ShieldOff className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{apps.filter(a => a.serviceAccess === "blocked").length}</p>
            <p className="text-xs font-semibold text-slate-700">Service Blocked</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 border-l-4 border-slate-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            <AlertCircle className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{apps.length}</p>
            <p className="text-xs font-semibold text-slate-700">Total Requiring Attention</p>
          </div>
        </Card>
      </div>

      {/* Accounts List */}
      {apps.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <ShieldCheck className="h-12 w-12 text-emerald-400" />
          <p className="font-semibold text-slate-900">All accounts are in good standing</p>
          <p className="text-sm text-muted-foreground">No overdue or blocked accounts found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map(app => {
            const name = app.orgName || app.fullName || app.contactEmail || app.email || "—"
            const pkg = app.selectedPackage
            const isBlocked = app.serviceAccess === "blocked"
            const pStat = app.paymentStatus ?? "pending_verification"

            return (
              <Card key={app.id} className={cn("overflow-hidden border-l-4", isBlocked ? "border-l-rose-400" : "border-l-amber-400")}>
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                    {isBlocked
                      ? <ShieldOff className="h-5 w-5 text-rose-600" />
                      : <AlertCircle className="h-5 w-5 text-amber-600" />
                    }
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{name}</p>
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        isBlocked ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                      )}>
                        {isBlocked ? "Blocked" : pStat === "overdue" ? "Overdue" : "Payment Pending"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {pkg ? `${pkg.packageName} · ${pkg.currency} ${pkg.amount.toLocaleString()}/${pkg.billingCycle}` : "No package selected"}
                      {app.paymentExpiryDate && ` · Expired: ${formatDate(app.paymentExpiryDate)}`}
                    </p>
                    {isBlocked && app.blockReason && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">Reason: {app.blockReason}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                      disabled={actionLoading === app.id}
                      onClick={() => {
                        setPayModal(app)
                        setPayAmount(pkg?.amount || 0)
                        setPayRef("")
                      }}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Record Payment
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 font-semibold"
                      disabled={actionLoading === app.id}
                      onClick={() => { setMsgModal({ id: app.id, name }); setMsgText("") }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      Send Notice
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "text-xs font-bold gap-1.5",
                        isBlocked
                          ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          : "text-rose-700 border-rose-300 hover:bg-rose-50"
                      )}
                      disabled={actionLoading === app.id}
                      onClick={() => toggleBlock(app.id)}
                    >
                      {actionLoading === app.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : isBlocked
                          ? <><ShieldCheck className="h-3.5 w-3.5" /> Restore</>
                          : <><ShieldOff className="h-3.5 w-3.5" /> Block</>
                      }
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Send Message Modal */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Send Payment Notice</h3>
              <button onClick={() => setMsgModal(null)} className="rounded p-1 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-slate-500">Message will appear in <strong>{msgModal.name}</strong>'s client dashboard inbox.</p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-semibold">💡 Quick templates:</p>
              <button className="mt-1 underline text-left" onClick={() => setMsgText(`Dear ${msgModal.name}, your SkinLink subscription payment is due. Please arrange payment to continue uninterrupted access to our services. Contact us for assistance.`)}>
                Payment reminder
              </button>
              {" · "}
              <button className="underline text-left" onClick={() => setMsgText(`Dear ${msgModal.name}, your SkinLink account has been suspended due to outstanding payment. Please settle your balance immediately to restore service access.`)}>
                Suspension warning
              </button>
            </div>
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Type your message to the client…"
              rows={4}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none resize-none"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setMsgModal(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={!msgText.trim() || actionLoading === msgModal.id}
                onClick={sendMessage}
                className="bg-primary hover:bg-primary/90 text-white gap-1.5"
              >
                {actionLoading === msgModal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                Send Notice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Record External Payment</h3>
              <button onClick={() => setPayModal(null)} className="rounded p-1 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-slate-500">
              Recording payment for <strong>{payModal.orgName || payModal.fullName || payModal.contactEmail || "client"}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Reference *</label>
                <input
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="e.g. MPESA-ABC123XYZ"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (TZS)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(+e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option>M-Pesa</option>
                    <option>Airtel Money</option>
                    <option>Bank Transfer</option>
                    <option>Control Number</option>
                    <option>Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={payUntil}
                  onChange={e => setPayUntil(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPayModal(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={!payRef.trim() || actionLoading === payModal.id}
                onClick={recordPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {actionLoading === payModal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                Confirm Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
