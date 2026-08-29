"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Images, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatImageUrl } from "@/lib/utils"
import type { DermCase, LesionImage } from "@/lib/types"

type Filter = "all" | "good" | "flagged"

export default function ImageReviewPage() {
  const router = useRouter()
  const { cases, getPatient } = useData()
  const [filter, setFilter] = useState<Filter>("all")

  const all = useMemo(() => {
    const items: { image: LesionImage; dermCase: DermCase }[] = []
    for (const c of cases) for (const image of c.images) items.push({ image, dermCase: c })
    return items.sort((a, b) => b.image.qualityScore - a.image.qualityScore)
  }, [cases])

  const flaggedCount = all.filter((i) => i.image.qualityScore < 75).length
  const goodCount = all.length - flaggedCount

  const shown = all.filter((i) =>
    filter === "all" ? true : filter === "good" ? i.image.qualityScore >= 75 : i.image.qualityScore < 75,
  )

  return (
    <div>
      <PageHeader title="Image review" description="Automated quality checks across all captured lesion images" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total images" value={all.length} icon={Images} tone="primary" />
        <StatCard label="Good quality" value={goodCount} icon={CheckCircle2} tone="success" />
        <StatCard label="Flagged for recapture" value={flaggedCount} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="my-4 flex gap-2">
        {(["all", "good", "flagged"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === f ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {f === "flagged" ? "Flagged" : f}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">No images in this view.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map(({ image, dermCase }) => {
            const patient = getPatient(dermCase.patientId)
            const flagged = image.qualityScore < 75
            return (
              <Card key={image.id} className="group overflow-hidden p-0">
                <div className="relative aspect-square bg-muted">
                  <Image src={formatImageUrl(image.url)} alt={image.angle} fill className="object-cover" sizes="240px" crossOrigin="anonymous" />
                  <span
                    className={cn(
                      "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur",
                      flagged ? "bg-warning/85 text-warning-foreground" : "bg-success/85 text-success-foreground",
                    )}
                  >
                    {image.qualityScore}
                  </span>
                  <span className="absolute bottom-2 left-2 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
                    {image.angle}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{patient?.fullName ?? "Unknown"}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{dermCase.ref}</p>
                  {flagged && image.qualityNotes && (
                    <p className="mt-1 flex items-start gap-1 text-[11px] text-warning-foreground">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {image.qualityNotes}
                    </p>
                  )}
                  <Button size="sm" variant="ghost" className="mt-2 w-full justify-between" onClick={() => router.push(`/cases/${dermCase.id}`)}>
                    Open case <ArrowRight className="h-4 w-4" />
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
