"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, ShieldAlert, ArrowRight, Info } from "lucide-react"
import { useData } from "@/lib/data-store"
import { getToken } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { AiPanel } from "@/components/case/ai-panel"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CaseStatusBadge } from "@/components/status-badge"
import { cn, formatImageUrl } from "@/lib/utils"
import type { AiAnalysis, DermCase } from "@/lib/types"

export default function AiAssistantPage() {
  const router = useRouter()
  const { cases, getPatient, updateCase } = useData()

  const [selectedId, setSelectedId] = useState<string | null>(cases[0]?.id ?? null)
  const [loading, setLoading] = useState(false)

  const selected = cases.find((c) => c.id === selectedId) ?? null

  const run = async (dermCase: DermCase) => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: dermCase.id,
          primaryConcern: dermCase.primaryConcern,
          clinicalInfo: dermCase.clinicalInfo,
          suspectedCondition: dermCase.suspectedCondition,
          durationDays: dermCase.durationDays,
          images: dermCase.images.map((i) => ({ url: i.url, angle: i.angle })),
          _token: getToken(),
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        const message =
          (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : null) || "AI analysis failed"
        toast.error("Analysis failed", { description: message })
        return
      }
      const ai = payload as AiAnalysis
      updateCase(dermCase.id, { ai })
      toast.success("Analysis complete")
    } catch {
      toast.error("Analysis failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="AI assistant"
        description="Optional decision support — pattern and urgency suggestions for specialist review"
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-accent/40 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div className="text-sm">
          <p className="font-medium">AI never replaces clinical judgement</p>
          <p className="text-muted-foreground">
            Suggestions highlight possible patterns and urgency. The responsible specialist confirms or rejects every result,
            and serious red flags always trigger immediate escalation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Case picker */}
        <div className="lg:col-span-1">
          <h2 className="mb-2 text-sm font-semibold">Select a case</h2>
          <Card className="max-h-[560px] divide-y divide-border overflow-y-auto">
            {cases.map((c) => {
              const patient = getPatient(c.patientId)
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                    selectedId === c.id && "bg-primary/5",
                  )}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {c.images[0] && <Image src={formatImageUrl(c.images[0].url)} alt="" fill className="object-cover" sizes="40px" crossOrigin="anonymous" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{patient?.fullName ?? "Unknown"}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{c.suspectedCondition}</p>
                  </div>
                  {c.ai ? (
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <CaseStatusBadge status={c.status} />
                  )}
                </button>
              )
            })}
          </Card>
        </div>

        {/* Analysis */}
        <div className="space-y-4 lg:col-span-2">
          {selected ? (
            <>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                    {selected.images[0] && <Image src={formatImageUrl(selected.images[0].url)} alt="" fill className="object-cover" sizes="48px" crossOrigin="anonymous" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{getPatient(selected.patientId)?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selected.ref} · {selected.images.length} images</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/cases/${selected.id}`)}>
                    Open case <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => run(selected)} disabled={loading}>
                    <Sparkles className="h-4 w-4" /> {selected.ai ? "Re-run" : "Run analysis"}
                  </Button>
                </div>
              </Card>

              <AiPanel analysis={selected.ai} loading={loading} onRun={() => run(selected)} />

              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5" /> Results are stored on the case and visible to the reviewing specialist.
              </p>
            </>
          ) : (
            <Card className="p-12 text-center text-sm text-muted-foreground">Select a case to run analysis.</Card>
          )}
        </div>
      </div>
    </div>
  )
}
