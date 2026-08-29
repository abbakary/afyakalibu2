"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Plus, Search, SlidersHorizontal, UserCheck } from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { CaseCard } from "@/components/case-card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CaseStatus } from "@/lib/types"

const STATUS_TABS: { key: CaseStatus | "all" | "mine"; label: string }[] = [
  { key: "all", label: "All cases" },
  { key: "mine", label: "My queue" },
  { key: "new", label: "New" },
  { key: "in_review", label: "In review" },
  { key: "reviewed", label: "Reviewed" },
  { key: "follow_up", label: "Follow-up" },
]

export default function CaseQueuePage() {
  const { cases, getPatient, getUser, currentUser, db } = useData()
  const [tab, setTab] = useState<CaseStatus | "all" | "mine">("all")
  const [query, setQuery] = useState("")
  const [priority, setPriority] = useState<string>("all")

  const isSpecialist = currentUser.role === "specialist"

  // Build a map of userId → name for specialist chips
  const userMap = useMemo(
    () => Object.fromEntries(db.users.map((u) => [u.id, u])),
    [db.users],
  )

  const filtered = useMemo(() => {
    return cases
      .filter((c) => {
        if (tab === "mine") return c.specialistId === currentUser.id
        if (tab === "all") return true
        return c.status === tab
      })
      .filter((c) => (priority === "all" ? true : c.priority === priority))
      .filter((c) => {
        if (!query) return true
        const p = getPatient(c.patientId)
        const specialist = c.specialistId ? (userMap[c.specialistId]?.name ?? "") : ""
        const hay = `${c.ref} ${c.suspectedCondition} ${c.primaryConcern} ${p?.fullName ?? ""} ${specialist}`.toLowerCase()
        return hay.includes(query.toLowerCase())
      })
      .sort((a, b) => {
        // Emergency first, then urgent, then by date
        const urgency = { emergency: 0, urgent: 1, routine: 2 }
        const pa = urgency[a.priority as keyof typeof urgency] ?? 2
        const pb = urgency[b.priority as keyof typeof urgency] ?? 2
        if (pa !== pb) return pa - pb
        return +new Date(b.createdAt) - +new Date(a.createdAt)
      })
  }, [cases, tab, priority, query, getPatient, currentUser.id, userMap])

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: cases.length,
      mine: cases.filter((x) => x.specialistId === currentUser.id).length,
    }
    for (const t of STATUS_TABS) {
      if (t.key !== "all" && t.key !== "mine") {
        c[t.key] = cases.filter((x) => x.status === t.key).length
      }
    }
    return c
  }, [cases, currentUser.id])

  const urgentPending = useMemo(() => {
    return cases.filter(
      (c) =>
        (c.priority === "urgent" || c.priority === "emergency") &&
        c.status !== "reviewed" &&
        c.status !== "closed",
    )
  }, [cases])

  // My queue assignment summary for specialists
  const myOpenCount = counts["mine"] ?? 0

  return (
    <div>
      <PageHeader
        title={isSpecialist ? "My Case Queue" : "Case Queue"}
        description={
          isSpecialist
            ? `${myOpenCount} case${myOpenCount !== 1 ? "s" : ""} assigned to you`
            : "Priority triage, clinical image review, and treatment guidance"
        }
        actions={
          <Link href="/cases/new" className={cn(buttonVariants({ variant: "default" }))}>
            <Plus className="h-4 w-4" /> New referral
          </Link>
        }
      />

      {/* Urgent banner */}
      {urgentPending.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold">
                {urgentPending.length} urgent / red-flag referral{urgentPending.length > 1 ? "s" : ""} pending
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                Specialist response SLA is &lt; 4 hours. Prioritise these before the routine queue.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100"
            onClick={() => setPriority("urgent")}
          >
            Show urgent only
          </Button>
        </div>
      )}

      {/* Assignment summary for specialists */}
      {isSpecialist && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <UserCheck className="h-5 w-5 shrink-0 text-primary" />
          <p>
            <span className="font-semibold text-primary">{myOpenCount} case{myOpenCount !== 1 ? "s" : ""}</span>
            {" "}assigned to you.
            {myOpenCount === 0 && " You're free — new cases will be routed to you automatically."}
          </p>
          <button
            onClick={() => setTab("mine")}
            className="ml-auto text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            View my queue →
          </button>
        </div>
      )}

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.key === "mine" ? (
              <span className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold",
                tab === t.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}>
                {counts["mine"] ?? 0}
              </span>
            ) : (
              <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
                {counts[t.key] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient, reference, condition or specialist…"
            className="pl-9"
          />
        </div>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-full sm:w-44">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="routine">Routine</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === "mine"
              ? "No cases assigned to you yet. New referrals will be routed here automatically."
              : "No cases match your filters."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CaseCard
              key={c.id}
              dermCase={c}
              patient={getPatient(c.patientId)}
              specialist={c.specialistId ? userMap[c.specialistId] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
