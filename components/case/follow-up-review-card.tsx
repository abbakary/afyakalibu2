"use client"

import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ArrowUpRight,
  Pill,
  Sparkles,
  User,
  Clock,
} from "lucide-react"
import type { DermCase, FollowUpReport, FollowUpAction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, timeAgo } from "@/lib/format"
import { cn, formatImageUrl } from "@/lib/utils"

export function FollowUpReviewCard({
  dermCase,
  onRespond,
}: {
  dermCase: DermCase
  onRespond: (report: FollowUpReport) => void
}) {
  const report = dermCase.followUpReport
  const [feedback, setFeedback] = useState(report?.specialistFeedback ?? "")
  const [action, setAction] = useState<FollowUpAction>(report?.specialistAction ?? "continue")
  const [submitting, setSubmitting] = useState(false)

  if (!report) return null

  const baselineImage = formatImageUrl(dermCase.images[0]?.url)
  const progressImage = formatImageUrl(report.progressPhotoUrl) || baselineImage

  const isResponded = !!report.specialistFeedback && !!report.respondedAt

  const handleSubmit = () => {
    if (!feedback.trim()) {
      toast.error("Please enter clinical feedback / instructions for the clinic worker.")
      return
    }
    setSubmitting(true)
    const updated: FollowUpReport = {
      ...report,
      specialistFeedback: feedback.trim(),
      specialistAction: action,
      respondedAt: new Date().toISOString(),
    }
    onRespond(updated)
    setSubmitting(false)
    toast.success("Follow-up response sent to rural clinic worker", {
      description: "The clinic will receive your progress assessment and patient instructions.",
    })
  }

  const responseLabels: Record<string, { label: string; tone: string }> = {
    resolved: { label: "Completely Resolved (Cleared)", tone: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    improved: { label: "Substantially Improved (>50%)", tone: "bg-teal-100 text-teal-800 border-teal-300" },
    mild_improvement: { label: "Mild Improvement (<50%)", tone: "bg-blue-100 text-blue-800 border-blue-300" },
    unchanged: { label: "Unchanged / No Visible Change", tone: "bg-amber-100 text-amber-800 border-amber-300" },
    worsened: { label: "Condition Worsened (Alert)", tone: "bg-red-100 text-red-800 border-red-300" },
  }

  const adherenceLabels: Record<string, string> = {
    full: "Full Adherence (Taken as directed)",
    partial: "Partial Adherence",
    stopped_adverse: "Stopped: Adverse reaction / Side effects",
    stopped_stock: "Stopped: Medication out of stock",
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-b from-card to-muted/20 p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-foreground">Follow-Up Progress Review</h3>
              {isResponded ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Responded &amp; Completed</Badge>
              ) : (
                <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-900 animate-pulse">
                  Awaiting Specialist Feedback
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted by rural clinic {timeAgo(report.submittedAt)}
              {report.submittedByName ? ` · ${report.submittedByName}` : ""}
            </p>
          </div>
        </div>

        {report.worsening && (
          <div className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            Clinic Worker Flagged Deterioration
          </div>
        )}
      </div>

      {/* 1. Side-by-Side Visual Photo Comparison */}
      <div className="my-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Visual Photo Comparison (Baseline vs. Follow-Up)
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Baseline Day 0 */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-slate-900">
            <Image
              src={baselineImage}
              alt="Baseline Day 0 Lesion"
              fill
              className="object-cover"
              sizes="(min-width: 640px) 320px, 100vw"
            />
            <div className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
              Baseline (Day 0)
            </div>
          </div>

          {/* Progress Follow-Up Photo */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-slate-900">
            <Image
              src={progressImage}
              alt="Follow-Up Progress Lesion"
              fill
              className="object-cover"
              sizes="(min-width: 640px) 320px, 100vw"
            />
            <div className="absolute bottom-2 left-2 rounded-md bg-primary/90 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
              Follow-Up Progress Photo
            </div>
          </div>
        </div>
      </div>

      {/* 2. Clinic Worker's Recorded Symptoms & Adherence */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Clinic Assessment &amp; Patient Report
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Clinical Response</p>
            <span
              className={cn(
                "mt-1 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
                responseLabels[report.response]?.tone ?? "bg-muted text-foreground"
              )}
            >
              {responseLabels[report.response]?.label ?? report.response}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Treatment Adherence</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {adherenceLabels[report.adherence] ?? report.adherence}
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">Current Symptoms Reported by Worker</p>
          <p className="mt-0.5 text-sm leading-relaxed text-foreground">
            {report.symptoms || "No severe symptoms noted."}
          </p>
        </div>

        {report.notes && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Worker Notes: </span>
            {report.notes}
          </div>
        )}
      </div>

      {/* 3. Specialist Feedback & Action Form */}
      <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="font-heading text-sm font-bold text-primary">Specialist Follow-Up Response</h4>
        </div>

        {/* Action selection */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-foreground">Clinical Action &amp; Next Steps</label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ActionChip
              active={action === "discharge"}
              label="Discharge / Cleared"
              icon={CheckCircle2}
              onClick={() => setAction("discharge")}
            />
            <ActionChip
              active={action === "continue"}
              label="Continue Regimen"
              icon={Pill}
              onClick={() => setAction("continue")}
            />
            <ActionChip
              active={action === "adjust_regimen"}
              label="Adjust Regimen"
              icon={Sparkles}
              onClick={() => setAction("adjust_regimen")}
            />
            <ActionChip
              active={action === "escalate"}
              label="Escalate In-Person"
              icon={ArrowUpRight}
              danger
              onClick={() => setAction("escalate")}
            />
          </div>
        </div>

        {/* Feedback Text */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-foreground">
            Instructions &amp; Feedback for Village Healthcare Worker
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="e.g. Excellent progress seen on photo. Step down topical steroid to once daily for 5 days then discontinue. Advise continued moisturizer application. Discharged."
            className="mt-1.5 bg-background"
          />
        </div>

        {/* Submit response button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {isResponded && (
            <p className="text-xs text-muted-foreground">
              Last responded: {formatDateTime(report.respondedAt!)}
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !feedback.trim()}
            className="ml-auto"
          >
            <Send className="h-4 w-4" /> {isResponded ? "Update Follow-Up Response" : "Send Response to Clinic"}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ActionChip({
  active,
  label,
  icon: Icon,
  danger,
  onClick,
}: {
  active: boolean
  label: string
  icon: React.ComponentType<{ className?: string }>
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-all",
        active
          ? danger
            ? "border-red-600 bg-red-600 text-white shadow-sm"
            : "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}
