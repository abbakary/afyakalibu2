"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, CalendarCheck, AlertTriangle, Clock, ArrowRight, Check } from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, timeAgo } from "@/lib/format"
import type { FollowUp, FollowUpStatus } from "@/lib/types"

const TABS: { key: "all" | FollowUpStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "due", label: "Due" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
]

// Derive a live status from the scheduled date so the queue stays accurate.
function liveStatus(f: FollowUp): FollowUpStatus {
  if (f.status === "completed") return "completed"
  const days = (new Date(f.scheduledFor).getTime() - Date.now()) / 86_400_000
  if (days < 0) return "overdue"
  if (days <= 2) return "due"
  return "scheduled"
}

const STATUS_STYLES: Record<FollowUpStatus, string> = {
  scheduled: "bg-muted text-muted-foreground",
  due: "bg-amber-100 text-amber-700",
  overdue: "bg-destructive/10 text-destructive",
  completed: "bg-emerald-100 text-emerald-700",
}

export default function FollowUpPage() {
  const router = useRouter()
  const { followUps, getUserName, updateFollowUp } = useData()
  const [tab, setTab] = useState<"all" | FollowUpStatus>("all")

  const enriched = useMemo(
    () =>
      [...followUps]
        .map((f) => ({ ...f, status: liveStatus(f) }))
        .sort((a, b) => +new Date(a.scheduledFor) - +new Date(b.scheduledFor)),
    [followUps],
  )

  const counts = useMemo(() => {
    const c = { overdue: 0, due: 0, scheduled: 0, completed: 0 }
    enriched.forEach((f) => (c[f.status] += 1))
    return c
  }, [enriched])

  const visible = tab === "all" ? enriched : enriched.filter((f) => f.status === tab)

  return (
    <div>
      <PageHeader
        title="Follow-up"
        description="Track scheduled reviews and treatment progress across all cases"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Overdue" value={counts.overdue} icon={AlertTriangle} tone={counts.overdue ? "danger" : "default"} />
        <StatCard label="Due soon" value={counts.due} icon={Clock} tone="warning" />
        <StatCard label="Scheduled" value={counts.scheduled} icon={CalendarClock} tone="primary" />
        <StatCard label="Completed" value={counts.completed} icon={CalendarCheck} tone="success" />
      </div>

      <div className="my-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">No follow-ups in this view.</Card>
      ) : (
        <div className="space-y-3">
          {visible.map((f) => (
            <Card key={f.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-sm font-semibold">{f.patientName}</p>
                    <span className="text-xs text-muted-foreground">{f.caseRef}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[f.status]}`}>
                      {f.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{f.purpose}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDate(f.scheduledFor)} · {timeAgo(f.scheduledFor)}
                    {f.assignedToId && ` · ${getUserName(f.assignedToId)}`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {f.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateFollowUp(f.id, { status: "completed", outcome: "Reviewed — progressing as expected" })
                    }
                  >
                    <Check className="h-4 w-4" /> Mark done
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => router.push(`/cases/${f.caseId}`)}>
                  View case <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
