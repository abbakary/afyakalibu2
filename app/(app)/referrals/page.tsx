"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Check, X, ArrowRight, Clock } from "lucide-react"
import { toast } from "sonner"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReferralStatusBadge, PriorityBadge } from "@/components/status-badge"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ReferralStatus } from "@/lib/types"

const TABS: { key: ReferralStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "responded", label: "Responded" },
  { key: "declined", label: "Declined" },
]

export default function ReferralsPage() {
  const router = useRouter()
  const { referrals, getUserName, updateCase, updateReferral, getCase } = useData()
  const [tab, setTab] = useState<ReferralStatus | "all">("all")

  const list = useMemo(
    () =>
      [...referrals]
        .filter((r) => (tab === "all" ? true : r.status === tab))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [referrals, tab],
  )

  const count = (s: ReferralStatus) => referrals.filter((r) => r.status === s).length

  const setStatus = async (id: string, status: ReferralStatus, caseId: string) => {
    try {
      await updateReferral(id, { status })
      if (status === "accepted") await updateCase(caseId, { status: "in_review" })
      toast.success(`Referral ${status}`)
    } catch {
      toast.error("Failed to update referral")
    }
  }

  return (
    <div>
      <PageHeader title="Referrals" description="Track referral requests between clinics and specialists" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending" value={count("pending")} icon={Clock} tone="warning" />
        <StatCard label="Accepted" value={count("accepted")} icon={Check} tone="primary" />
        <StatCard label="Responded" value={count("responded")} icon={Send} tone="success" />
        <StatCard label="Total" value={referrals.length} icon={ArrowRight} />
      </div>

      <div className="my-4 flex flex-wrap items-center gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">No referrals in this view.</Card>
      ) : (
        <Card className="divide-y divide-border">
          {list.map((r) => {
            const c = getCase(r.caseId)
            return (
              <div key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[11px] text-muted-foreground">{r.ref}</p>
                    <PriorityBadge priority={r.priority} />
                  </div>
                  <p className="mt-0.5 text-sm font-medium">{r.patientName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    From {r.fromClinic} · To {getUserName(r.toSpecialistId)} · {timeAgo(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ReferralStatusBadge status={r.status} />
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "accepted", r.caseId)}>
                        <Check className="h-4 w-4" /> Accept
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "declined", r.caseId)} aria-label="Decline">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" onClick={() => router.push(`/cases/${r.caseId}`)} disabled={!c}>
                    Open case <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
