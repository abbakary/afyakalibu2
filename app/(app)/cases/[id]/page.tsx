"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ChevronLeft, ChevronRight, CheckCircle2, Send, ImagePlus, ArrowUpRight,
  CalendarClock, MessageSquare, ClipboardList, MapPin, Phone,
  User as UserIcon, AlertTriangle, Stethoscope, Pill, ShieldCheck, ShieldAlert,
  Globe, Languages, Activity, BadgeAlert, UserCheck,
} from "lucide-react"
import { useData } from "@/lib/data-store"
import { getToken } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { ImageViewer } from "@/components/case/image-viewer"
import { AiPanel } from "@/components/case/ai-panel"
import { TreatmentPlanForm } from "@/components/case/treatment-plan-form"
import { CaseStatusBadge, PriorityBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDateTime, timeAgo, initials } from "@/lib/format"
import { FollowUpReviewCard } from "@/components/case/follow-up-review-card"
import { cn } from "@/lib/utils"
import type { AiAnalysis, FollowUpReport } from "@/lib/types"

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    cases, getCase, getPatient, getUser, currentUser,
    updateCase, addCaseNote, addFollowUp, followUps, updateFollowUp,
  } = useData()

  const dermCase = getCase(id)
  const [aiLoading, setAiLoading] = useState(false)
  const [message, setMessage] = useState("")

  const ordered = useMemo(
    () => [...cases].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [cases],
  )
  const idx = ordered.findIndex((c) => c.id === id)
  const prev = idx > 0 ? ordered[idx - 1] : null
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null

  if (!dermCase) {
    return (
      <div>
        <PageHeader title="Case not found" breadcrumbs={[{ label: "Case queue", href: "/cases" }, { label: "Not found" }]} />
        <Card className="p-12 text-center text-sm text-muted-foreground">
          This case does not exist or belongs to another organization.
        </Card>
      </div>
    )
  }

  const patient = getPatient(dermCase.patientId)
  const clinician = getUser(dermCase.clinicianId)
  const assignedSpecialist = dermCase.specialistId ? getUser(dermCase.specialistId) : undefined
  const isSpecialist = currentUser.role === "specialist"
  const isMyCase = dermCase.specialistId === currentUser.id

  // Auto-assign + auto in_review when a specialist opens a new unreviewed case.
  // The backend GET /{case_id} handles the persistent update; this mirrors it locally
  // for instant UI feedback without a page reload.
  useState(() => {
    if (isSpecialist && dermCase.status === "new" && (isMyCase || !dermCase.specialistId)) {
      updateCase(dermCase.id, { status: "in_review", specialistId: currentUser.id })
    }
  })

  // Derived flags
  const hasRedFlags = Array.isArray(dermCase.redFlags) && dermCase.redFlags.length > 0
  const hasSymptoms = Array.isArray(dermCase.symptoms) && dermCase.symptoms.length > 0
  const locationParts = [patient?.village, patient?.district, patient?.region, patient?.country].filter(Boolean)
  const allConsentGranted = patient?.consentForPhotography && patient?.consentForRemoteReview && patient?.consentForStorage
  const hasPatientMedHistory = patient?.medicalHistory || patient?.allergies || patient?.currentMedications || patient?.chronicConditions

  const runAi = async () => {
    setAiLoading(true)
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
        const msg = (payload?.message as string) || "AI analysis failed"
        toast.error("Analysis failed", { description: msg })
        return
      }
      updateCase(dermCase.id, { ai: payload as AiAnalysis })
      toast.success("AI analysis complete", { description: "Review the suggestion — you make the final call." })
    } catch {
      toast.error("Analysis failed. Please try again.")
    } finally {
      setAiLoading(false)
    }
  }

  const requestImages = () => {
    addCaseNote(dermCase.id, "Requested additional well-lit images from the clinic before assessment can be completed.")
    updateCase(dermCase.id, { status: "in_review" })
    toast.info("Clarification sent to clinic")
  }

  const escalate = () => {
    updateCase(dermCase.id, { priority: "emergency" })
    addCaseNote(dermCase.id, "Escalated for urgent in-person specialist referral — clinical red flags present.")
    toast.warning("Case escalated for in-person referral")
  }

  const handleFollowUpResponse = (updatedReport: FollowUpReport) => {
    const newStatus = updatedReport.specialistAction === "discharge" ? "closed" : "reviewed"
    updateCase(dermCase.id, { followUpReport: updatedReport, status: newStatus })
    const fu = followUps.find((f) => f.caseId === dermCase.id)
    if (fu) {
      updateFollowUp(fu.id, {
        status: "completed",
        outcome: `Specialist feedback: ${updatedReport.specialistFeedback} (Action: ${updatedReport.specialistAction})`,
        followUpReport: updatedReport,
      })
    }
    addCaseNote(dermCase.id,
      `[Specialist Follow-Up Response] Action: ${updatedReport.specialistAction?.toUpperCase()} — ${updatedReport.specialistFeedback}`)
  }

  const savePlan: React.ComponentProps<typeof TreatmentPlanForm>["onSave"] = (plan) => {
    updateCase(dermCase.id, {
      status: "reviewed",
      treatmentPlan: { ...plan, id: `tp_${Date.now()}`, createdById: currentUser.id, createdAt: new Date().toISOString() },
      suspectedCondition: plan.diagnosis || dermCase.suspectedCondition,
    })
    if (plan.followUpDays > 0 && patient) {
      addFollowUp({
        caseId: dermCase.id,
        caseRef: dermCase.ref,
        patientName: patient.fullName,
        scheduledFor: new Date(Date.now() + plan.followUpDays * 86_400_000).toISOString(),
        status: "scheduled",
        assignedToId: currentUser.id,
        purpose: `Review ${plan.diagnosis} progress & adjust treatment`,
      })
    }
    toast.success("Treatment guidance sent to clinic")
  }

  const sendMessage = () => {
    if (!message.trim()) return
    addCaseNote(dermCase.id, message.trim())
    setMessage("")
    toast.success("Message added to case")
  }

  return (
    <div>
      <PageHeader
        title={`${patient?.fullName ?? "Case"} · ${dermCase.suspectedCondition}`}
        description={`${dermCase.ref} · Received ${timeAgo(dermCase.createdAt)}`}
        breadcrumbs={[{ label: "Case queue", href: "/cases" }, { label: dermCase.ref }]}
        actions={
          <>
            <Button variant="outline" size="icon" disabled={!prev}
              onClick={() => prev && router.push(`/cases/${prev.id}`)} aria-label="Previous case">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={!next}
              onClick={() => next && router.push(`/cases/${next.id}`)} aria-label="Next case">
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Assignment badge */}
            {assignedSpecialist ? (
              <span className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/6 px-3 py-1.5 text-xs font-medium text-primary">
                <UserCheck className="h-3.5 w-3.5" />
                {isMyCase ? "Assigned to you" : `Assigned · ${assignedSpecialist.name.split(" ")[0]}`}
              </span>
            ) : (
              <span className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                Unassigned
              </span>
            )}

            {/* Specialists: no manual button — status is auto-managed on open */}
            {(dermCase.status === "reviewed" || dermCase.status === "closed") ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/12 px-3 py-2 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> Reviewed
              </span>
            ) : !isSpecialist ? (
              <Button onClick={() => updateCase(dermCase.id, { status: "reviewed" })}>
                <CheckCircle2 className="h-4 w-4" /> Mark reviewed
              </Button>
            ) : null}
          </>
        }
      />

      {/* Red-flag banner */}
      {hasRedFlags && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          <BadgeAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Clinical red flags reported</p>
            <ul className="mt-1 space-y-0.5 text-xs text-destructive/80">
              {dermCase.redFlags!.map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Patient card */}
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback style={{ backgroundColor: "#1f7a8c" }} className="text-sm font-semibold text-white">
                    {patient ? initials(patient.fullName) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-heading text-base font-semibold">{patient?.fullName ?? "Unknown patient"}</p>
                  <p className="text-xs text-muted-foreground">
                    {patient ? `${patient.code} · ${patient.age} yrs · ${patient.gender}` : ""}
                    {patient?.preferredLanguage ? ` · ${patient.preferredLanguage}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={dermCase.priority} />
                <CaseStatusBadge status={dermCase.status} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              {patient && (
                <>
                  <Meta icon={MapPin} label="Location" value={locationParts.join(", ") || "—"} />
                  <Meta icon={Phone} label="Primary phone" value={patient.phone ?? "—"} />
                  {patient.alternatePhone && (
                    <Meta icon={Phone} label="Alternate phone" value={patient.alternatePhone} />
                  )}
                  {patient.preferredLanguage && (
                    <Meta icon={Languages} label="Language" value={patient.preferredLanguage} />
                  )}
                  <Meta icon={UserIcon} label="Registered by" value={clinician?.name ?? "—"} />
                  {assignedSpecialist && (
                    <Meta icon={UserCheck} label="Reviewing specialist"
                      value={isMyCase ? `${assignedSpecialist.name} (you)` : assignedSpecialist.name} />
                  )}
                </>
              )}
            </div>

            {/* Consent */}
            {patient && (
              <div className={cn(
                "mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                allConsentGranted ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground",
              )}>
                {allConsentGranted
                  ? <ShieldCheck className="h-4 w-4 shrink-0" />
                  : <ShieldAlert className="h-4 w-4 shrink-0" />}
                <span className="font-medium">
                  {allConsentGranted ? "Full consent documented" : "Consent incomplete or not recorded"}
                </span>
                {patient.consentDate && <span className="ml-auto text-muted-foreground">{patient.consentDate}</span>}
                {patient.consentWitness && <span className="text-muted-foreground">· {patient.consentWitness}</span>}
              </div>
            )}
          </Card>

          {/* Patient medical history */}
          {hasPatientMedHistory && (
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-base font-semibold">Patient medical history</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {patient?.chronicConditions && <MedField icon={Globe} label="Chronic conditions" value={patient.chronicConditions} />}
                {patient?.allergies && <MedField icon={AlertTriangle} label="Known allergies" value={patient.allergies} alert />}
                {patient?.currentMedications && <MedField icon={Pill} label="Current medications" value={patient.currentMedications} />}
                {patient?.medicalHistory && (
                  <div className="sm:col-span-2">
                    <MedField icon={Activity} label="Past medical history" value={patient.medicalHistory} />
                  </div>
                )}
              </div>
            </Card>
          )}

          {dermCase.followUpReport && (
            <FollowUpReviewCard dermCase={dermCase} onRespond={handleFollowUpResponse} />
          )}

          {/* Clinical images */}
          <Card className="p-5">
            <h2 className="mb-3 font-heading text-base font-semibold">Clinical images</h2>
            <ImageViewer images={dermCase.images} />
          </Card>

          {/* Clinical information */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-semibold">Clinical information</h2>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label="Primary concern" value={dermCase.primaryConcern} />
              <Field label="Duration" value={`${dermCase.durationDays} day${dermCase.durationDays === 1 ? "" : "s"}`} />
              <Field label="Suspected condition" value={dermCase.suspectedCondition} />
              {dermCase.bodySite && <Field label="Body site" value={dermCase.bodySite} />}
              {dermCase.severity && <Field label="Severity" value={dermCase.severity} />}
              {dermCase.previousTreatment && <Field label="Previous treatment" value={dermCase.previousTreatment} />}
            </dl>
            {hasSymptoms && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Reported symptoms</p>
                <div className="flex flex-wrap gap-1.5">
                  {dermCase.symptoms!.map((s, i) => (
                    <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {hasRedFlags && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-destructive">Red flags</p>
                <div className="flex flex-wrap gap-1.5">
                  {dermCase.redFlags!.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {dermCase.clinicalInfo && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground">Clinical notes &amp; history</p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{dermCase.clinicalInfo}</p>
              </div>
            )}
          </Card>

          {/* Audit trail */}
          <Card className="p-5">
            <h2 className="mb-1 font-heading text-base font-semibold">Case history &amp; clarification</h2>
            <p className="mb-4 text-xs text-muted-foreground">Secure messaging and audit trail.</p>
            <ol className="relative space-y-4 border-l border-border pl-5">
              <TimelineItem title="Referral submitted" detail={`by ${clinician?.name ?? "clinic"} · ${dermCase.ref}`} time={dermCase.createdAt} />
              {assignedSpecialist && (
                <TimelineItem title="Assigned to specialist" detail={assignedSpecialist.name} time={dermCase.updatedAt} />
              )}
              {dermCase.ai && (
                <TimelineItem title="AI-assist analysis generated" detail={dermCase.ai.model} time={dermCase.ai.generatedAt} />
              )}
              {dermCase.notes.map((n) => (
                <TimelineItem key={n.id} title={n.authorName} detail={n.body} time={n.createdAt} />
              ))}
              {dermCase.treatmentPlan && (
                <TimelineItem title="Treatment guidance sent" detail={dermCase.treatmentPlan.diagnosis} time={dermCase.treatmentPlan.createdAt} />
              )}
            </ol>
            <div className="mt-4 flex items-start gap-2">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note or ask the clinic for clarification…" rows={2} className="flex-1" />
              <Button size="icon" className="h-10 w-10 shrink-0" onClick={sendMessage}
                disabled={!message.trim()} aria-label="Send message">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Side column ── */}
        <div className="space-y-6">
          <AiPanel analysis={dermCase.ai} loading={aiLoading} onRun={runAi} />

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Clinical actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start" onClick={requestImages}>
                <ImagePlus className="h-4 w-4" /> Request more images
              </Button>
              <Button variant="outline" className="justify-start" onClick={escalate}>
                <ArrowUpRight className="h-4 w-4" /> Escalate to in-person
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => updateCase(dermCase.id, { status: "reviewed" })}>
                <Send className="h-4 w-4" /> Send response to clinic
              </Button>
            </div>
          </Card>

          <Card className="p-4 text-xs text-muted-foreground space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Case details</h3>
            <MetaRow label="Ref" value={dermCase.ref} />
            <MetaRow label="Created" value={formatDateTime(dermCase.createdAt)} />
            <MetaRow label="Updated" value={timeAgo(dermCase.updatedAt)} />
            <MetaRow label="Priority" value={dermCase.priority} />
            <MetaRow label="Status" value={dermCase.status.replace("_", " ")} />
            {assignedSpecialist && <MetaRow label="Specialist" value={assignedSpecialist.name} />}
            {dermCase.bodySite && <MetaRow label="Body site" value={dermCase.bodySite} />}
            {dermCase.severity && <MetaRow label="Severity" value={dermCase.severity} />}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-base font-semibold">Treatment plan</h3>
            </div>
            {dermCase.treatmentPlan && (
              <div className="mb-4 rounded-lg bg-success/8 p-3 text-xs text-muted-foreground">
                Sent {formatDateTime(dermCase.treatmentPlan.createdAt)} — you can update and resend.
              </div>
            )}
            <TreatmentPlanForm
              initial={dermCase.treatmentPlan}
              suggestedDiagnosis={dermCase.ai?.differentials?.[0]?.condition}
              onSave={savePlan}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Meta({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="font-medium capitalize text-foreground">{value}</span>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  )
}

function MedField({ icon: Icon, label, value, alert }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; alert?: boolean
}) {
  return (
    <div className={cn("rounded-lg px-3 py-2.5", alert ? "border border-destructive/25 bg-destructive/6" : "bg-muted/50")}>
      <p className={cn("mb-1 flex items-center gap-1.5 text-xs font-semibold", alert ? "text-destructive" : "text-muted-foreground")}>
        <Icon className="h-3.5 w-3.5" />{label}
      </p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  )
}

function TimelineItem({ title, detail, time }: { title: string; detail: string; time: string }) {
  return (
    <li className="relative">
      <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(time)}</span>
      </div>
      <p className="text-xs leading-snug text-muted-foreground">{detail}</p>
    </li>
  )
}
