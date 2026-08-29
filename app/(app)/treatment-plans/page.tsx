"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Pill, Search, ArrowRight, CalendarClock } from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/format"

export default function TreatmentPlansPage() {
  const router = useRouter()
  const { cases, getPatient, getUserName } = useData()
  const [query, setQuery] = useState("")

  const plans = useMemo(() => {
    return cases
      .filter((c) => c.treatmentPlan)
      .map((c) => ({ dermCase: c, plan: c.treatmentPlan! }))
      .filter((x) => {
        if (!query) return true
        const p = getPatient(x.dermCase.patientId)
        return `${x.plan.diagnosis} ${x.dermCase.ref} ${p?.fullName ?? ""}`.toLowerCase().includes(query.toLowerCase())
      })
      .sort((a, b) => +new Date(b.plan.createdAt) - +new Date(a.plan.createdAt))
  }, [cases, query, getPatient])

  return (
    <div>
      <PageHeader title="Treatment plans" description="Structured guidance sent back to clinics" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Plans issued" value={plans.length} icon={Pill} tone="primary" />
        <StatCard label="Avg. follow-up" value={plans.length ? `${Math.round(plans.reduce((s, p) => s + p.plan.followUpDays, 0) / plans.length)}d` : "—"} icon={CalendarClock} />
        <StatCard label="Cases reviewed" value={cases.filter((c) => c.status === "reviewed" || c.status === "closed").length} icon={ArrowRight} tone="success" />
      </div>

      <div className="my-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by diagnosis, patient or reference…" className="pl-9" />
      </div>

      {plans.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No treatment plans yet. Complete a case review to issue guidance.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plans.map(({ dermCase, plan }) => {
            const patient = getPatient(dermCase.patientId)
            return (
              <Card key={dermCase.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading text-base font-semibold">{plan.diagnosis}</p>
                    <p className="text-xs text-muted-foreground">
                      {patient?.fullName} · {dermCase.ref} · {formatDate(plan.createdAt)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <CalendarClock className="h-3 w-3" /> {plan.followUpDays}d
                  </span>
                </div>

                {plan.medications.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground">Recommended treatment</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {plan.medications.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>
                            <span className="font-medium">{m.name}</span>
                            {m.instructions && <span className="text-muted-foreground"> — {m.instructions}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.avoidTriggers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {plan.avoidTriggers.map((t, i) => (
                      <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        Avoid: {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[11px] text-muted-foreground">By {getUserName(plan.createdById)}</span>
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/cases/${dermCase.id}`)}>
                    View case <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
