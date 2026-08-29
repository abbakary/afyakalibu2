"use client"

import { use, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, MapPin, Phone, Calendar, ShieldCheck, ShieldAlert,
  AlertTriangle, Pill, Stethoscope, Languages, Globe, FileText,
} from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CaseCard } from "@/components/case-card"
import { formatDate, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { getPatient, cases, getUser } = useData()

  const patient = getPatient(id)
  const patientCases = useMemo(
    () =>
      cases
        .filter((c) => c.patientId === id)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [cases, id],
  )

  if (!patient) {
    return (
      <div>
        <PageHeader
          title="Patient not found"
          breadcrumbs={[{ label: "Patients", href: "/patients" }, { label: "Not found" }]}
        />
        <Card className="p-12 text-center text-sm text-muted-foreground">
          This patient does not exist in your organization.
        </Card>
      </div>
    )
  }

  const registeredBy = getUser(patient.registeredById)
  const allConsentGranted =
    patient.consentForPhotography &&
    patient.consentForRemoteReview &&
    patient.consentForStorage

  const locationParts = [
    patient.village,
    patient.district,
    patient.region,
    patient.country,
  ].filter(Boolean)

  return (
    <div>
      <PageHeader
        title={patient.fullName}
        description={`${patient.code} · ${patient.age} yrs · ${patient.gender}`}
        breadcrumbs={[{ label: "Patients", href: "/patients" }, { label: patient.fullName }]}
        actions={
          <Button onClick={() => router.push(`/cases/new?patient=${patient.id}`)}>
            <Plus className="h-4 w-4" /> New referral
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column: profile cards ── */}
        <div className="space-y-4 lg:col-span-1">

          {/* Identity */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {initials(patient.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading text-lg font-semibold">{patient.fullName}</p>
                <p className="text-xs text-muted-foreground">{patient.code}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <ProfileRow
                icon={Calendar}
                label="Age / gender"
                value={`${patient.age} yrs · ${patient.gender}`}
              />
              <ProfileRow
                icon={MapPin}
                label="Location"
                value={locationParts.join(", ") || "—"}
              />
              <ProfileRow
                icon={Phone}
                label="Primary phone"
                value={patient.phone ?? "—"}
              />
              {patient.alternatePhone && (
                <ProfileRow
                  icon={Phone}
                  label="Alternate phone"
                  value={patient.alternatePhone}
                />
              )}
              {patient.preferredLanguage && (
                <ProfileRow
                  icon={Languages}
                  label="Preferred language"
                  value={patient.preferredLanguage}
                />
              )}
              <ProfileRow
                icon={Calendar}
                label="Registered"
                value={`${formatDate(patient.createdAt)}${registeredBy ? ` · ${registeredBy.name}` : ""}`}
              />
            </dl>
          </Card>

          {/* Consent card */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              {allConsentGranted
                ? <ShieldCheck className="h-4 w-4 text-success" />
                : <ShieldAlert className="h-4 w-4 text-warning-foreground" />}
              <h3 className="font-heading text-sm font-semibold">
                {allConsentGranted ? "Consent documented" : "Consent incomplete"}
              </h3>
            </div>
            <ul className="space-y-2 text-xs">
              <ConsentLine
                granted={!!patient.consentForPhotography}
                label="Clinical photography"
              />
              <ConsentLine
                granted={!!patient.consentForRemoteReview}
                label="Remote specialist review"
              />
              <ConsentLine
                granted={!!patient.consentForStorage}
                label="Secure storage & retention"
              />
            </ul>
            {(patient.consentDate || patient.consentWitness) && (
              <div className="mt-3 border-t border-border pt-3 space-y-1 text-xs text-muted-foreground">
                {patient.consentDate && (
                  <p>Date: <span className="font-medium text-foreground">{patient.consentDate}</span></p>
                )}
                {patient.consentWitness && (
                  <p>Witnessed: <span className="font-medium text-foreground">{patient.consentWitness}</span></p>
                )}
              </div>
            )}
          </Card>

          {/* Medical history card */}
          {(patient.medicalHistory ||
            patient.allergies ||
            patient.currentMedications ||
            patient.chronicConditions ||
            patient.notes) && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-sm font-semibold">Medical history</h3>
              </div>
              <div className="space-y-3 text-sm">
                {patient.chronicConditions && (
                  <MedSection
                    icon={Globe}
                    label="Chronic conditions"
                    value={patient.chronicConditions}
                  />
                )}
                {patient.allergies && (
                  <MedSection
                    icon={AlertTriangle}
                    label="Known allergies"
                    value={patient.allergies}
                    alert
                  />
                )}
                {patient.currentMedications && (
                  <MedSection
                    icon={Pill}
                    label="Current medications"
                    value={patient.currentMedications}
                  />
                )}
                {patient.medicalHistory && (
                  <MedSection
                    icon={FileText}
                    label="Past medical history"
                    value={patient.medicalHistory}
                  />
                )}
                {patient.notes && (
                  <MedSection
                    icon={FileText}
                    label="Additional notes"
                    value={patient.notes}
                  />
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right column: case history ── */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">
              Case history ({patientCases.length})
            </h2>
          </div>
          {patientCases.length === 0 ? (
            <Card className="p-12 text-center text-sm text-muted-foreground">
              No cases yet for this patient.
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => router.push(`/cases/new?patient=${patient.id}`)}
                >
                  <Plus className="h-4 w-4" /> Start a referral
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {patientCases.map((c) => (
                <CaseCard key={c.id} dermCase={c} patient={patient} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function ConsentLine({ granted, label }: { granted: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]",
        granted ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}>
        {granted ? "✓" : "–"}
      </span>
      <span className={granted ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  )
}

function MedSection({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  alert?: boolean
}) {
  return (
    <div className={cn(
      "rounded-lg px-3 py-2.5",
      alert ? "bg-destructive/8 border border-destructive/20" : "bg-muted/50",
    )}>
      <p className={cn(
        "mb-1 flex items-center gap-1.5 text-xs font-semibold",
        alert ? "text-destructive" : "text-muted-foreground",
      )}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  )
}
