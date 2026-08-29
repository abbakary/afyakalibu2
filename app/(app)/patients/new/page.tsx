"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, ArrowRight, User, MapPin, Stethoscope, ShieldCheck } from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Gender } from "@/lib/types"

const LANGUAGES = [
  "Swahili", "English", "Arabic", "Chaga", "Hehe", "Makonde",
  "Nyamwezi", "Sukuma", "Yao", "Zaramo", "Other",
]

const STEPS = ["Demographics", "Location & contact", "Medical history", "Consent"]

export default function NewPatientPage() {
  const router = useRouter()
  const { addPatient, currentUser, activeTenant } = useData()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // ── Step 0: Demographics ─────────────────────────────────────────────────
  const [fullName, setFullName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<Gender>("Female")
  const [preferredLanguage, setPreferredLanguage] = useState("")

  // ── Step 1: Location & contact ───────────────────────────────────────────
  const [village, setVillage] = useState("")
  const [district, setDistrict] = useState("")
  const [region, setRegion] = useState(activeTenant?.region ?? "")
  const [country, setCountry] = useState(activeTenant ? "Tanzania" : "")
  const [phone, setPhone] = useState("")
  const [alternatePhone, setAlternatePhone] = useState("")

  // ── Step 2: Medical history ──────────────────────────────────────────────
  const [medicalHistory, setMedicalHistory] = useState("")
  const [allergies, setAllergies] = useState("")
  const [currentMedications, setCurrentMedications] = useState("")
  const [chronicConditions, setChronicConditions] = useState("")
  const [notes, setNotes] = useState("")

  // ── Step 3: Consent ──────────────────────────────────────────────────────
  const [consentForPhotography, setConsentForPhotography] = useState(false)
  const [consentForRemoteReview, setConsentForRemoteReview] = useState(false)
  const [consentForStorage, setConsentForStorage] = useState(false)
  const [consentWitness, setConsentWitness] = useState("")
  const consentObtained = consentForPhotography && consentForRemoteReview && consentForStorage
  const consentDate = new Date().toISOString().slice(0, 10)

  // ── Validation per step ──────────────────────────────────────────────────
  const step0Valid = fullName.trim().length > 0 && age !== "" && Number(age) > 0
  const step1Valid = village.trim().length > 0
  const step2Valid = true // all optional but encouraged
  const step3Valid = consentObtained

  const canNext =
    step === 0 ? step0Valid
    : step === 1 ? step1Valid
    : step === 2 ? step2Valid
    : step3Valid

  async function save(thenReferral: boolean) {
    setSaving(true)
    try {
      const patient = await addPatient({
        fullName: fullName.trim(),
        age: Number(age),
        gender,
        preferredLanguage: preferredLanguage || undefined,
        village: village.trim(),
        district: district.trim() || undefined,
        region: region.trim() || activeTenant?.region || "Unknown",
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        alternatePhone: alternatePhone.trim() || undefined,
        medicalHistory: medicalHistory.trim() || undefined,
        allergies: allergies.trim() || undefined,
        currentMedications: currentMedications.trim() || undefined,
        chronicConditions: chronicConditions.trim() || undefined,
        notes: notes.trim() || undefined,
        consentObtained,
        consentDate,
        consentWitness: consentWitness.trim() || currentUser.name,
        consentForPhotography,
        consentForRemoteReview,
        consentForStorage,
        registeredById: currentUser.id,
      })
      toast.success("Patient registered", {
        description: `${patient.fullName} · ${patient.code}`,
      })
      router.push(thenReferral ? `/cases/new?patient=${patient.id}` : `/patients/${patient.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Register patient"
        description="Complete all sections. Consent is required before clinical photography."
        breadcrumbs={[{ label: "Patients", href: "/patients" }, { label: "Register" }]}
      />

      {/* Stepper */}
      <div className="mb-6 flex items-center">
        {STEPS.map((label, i) => {
          const icons = [User, MapPin, Stethoscope, ShieldCheck]
          const Icon = icons[i]
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  i < step ? "bg-primary text-primary-foreground cursor-pointer"
                  : i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground",
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className={cn(
                  "hidden text-xs font-medium sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}>
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-1.5 h-px flex-1", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          )
        })}
      </div>

      <Card className="p-5 sm:p-6">

        {/* ── Step 0: Demographics ── */}
        {step === 0 && (
          <div className="space-y-4">
            <SectionTitle>Patient demographics</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="fullName">
                  Full name <Required />
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Fatuma Kweka"
                  className="mt-1.5"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="age">
                  Age (years) <Required />
                </Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="45"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>
                  Gender <Required />
                </Label>
                <Select value={gender} onValueChange={(v) => v && setGender(v as Gender)}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Other">Other / not specified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Preferred language for communication</Label>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select language…" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Used to ensure treatment guidance is communicated clearly to the patient.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Location & contact ── */}
        {step === 1 && (
          <div className="space-y-4">
            <SectionTitle>Location & contact details</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="village">
                  Village / locality <Required />
                </Label>
                <Input
                  id="village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Mbuyuni"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Nyamagana"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Mwanza"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Tanzania"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Primary phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="altPhone">Alternate phone</Label>
                <Input
                  id="altPhone"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Medical history ── */}
        {step === 2 && (
          <div className="space-y-4">
            <SectionTitle>Medical history</SectionTitle>
            <p className="text-sm text-muted-foreground">
              This information helps the specialist provide safer, more accurate guidance.
              Record what the patient or carer reports.
            </p>
            <div>
              <Label htmlFor="medHistory">Past medical history</Label>
              <Textarea
                id="medHistory"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="Chronic conditions, previous hospitalisations, surgeries, relevant family history…"
                rows={3}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="allergies">Known allergies</Label>
              <Textarea
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Drug allergies, food allergies, environmental allergens, reactions to topical products…"
                rows={2}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Include type of reaction where known (e.g. rash, anaphylaxis).
              </p>
            </div>
            <div>
              <Label htmlFor="medications">Current medications</Label>
              <Textarea
                id="medications"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                placeholder="Name, dose and frequency of any medications currently being taken…"
                rows={2}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="chronic">Chronic conditions</Label>
              <Input
                id="chronic"
                value={chronicConditions}
                onChange={(e) => setChronicConditions(e.target.value)}
                placeholder="e.g. Diabetes, Hypertension, HIV, Asthma"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="notes">Additional clinical notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other relevant notes — social history, occupational exposure, recent travel…"
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Consent ── */}
        {step === 3 && (
          <div className="space-y-4">
            <SectionTitle>Patient consent</SectionTitle>
            <p className="text-sm text-muted-foreground">
              Consent must be obtained and documented before any clinical photography or data
              submission. Explain each item to the patient in their preferred language.
            </p>

            <div className="space-y-3">
              <ConsentItem
                id="c-photo"
                checked={consentForPhotography}
                onChecked={setConsentForPhotography}
                title="Clinical photography"
                description="The patient consents to photographs of the affected skin area being taken for clinical assessment purposes. Images will not include identifiable features unless clinically necessary."
              />
              <ConsentItem
                id="c-review"
                checked={consentForRemoteReview}
                onChecked={setConsentForRemoteReview}
                title="Remote specialist review"
                description="The patient consents to their clinical images and health information being securely transmitted to an authorised dermatology specialist for remote review and treatment guidance."
              />
              <ConsentItem
                id="c-storage"
                checked={consentForStorage}
                onChecked={setConsentForStorage}
                title="Secure storage and retention"
                description="The patient consents to their data being stored securely within the SkinLink platform in accordance with the organisation's data-governance policy, for the duration necessary to support their care."
              />
            </div>

            {!consentObtained && (
              <div className="rounded-lg border border-warning/40 bg-warning/8 px-4 py-3 text-sm text-warning-foreground">
                All three consent items must be confirmed before patient registration can be completed.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-border pt-4">
              <div>
                <Label htmlFor="witness">Consent witnessed by</Label>
                <Input
                  id="witness"
                  value={consentWitness}
                  onChange={(e) => setConsentWitness(e.target.value)}
                  placeholder={currentUser.name}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Defaults to the logged-in clinician if left blank.
                </p>
              </div>
              <div>
                <Label>Consent date</Label>
                <Input
                  value={consentDate}
                  readOnly
                  className="mt-1.5 bg-muted/50 text-muted-foreground"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Recorded automatically as today's date.
                </p>
              </div>
            </div>

            {/* Summary */}
            {consentObtained && (
              <div className="rounded-lg bg-success/10 px-4 py-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-success">
                  <ShieldCheck className="h-4 w-4" /> Consent documented
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  All consent items confirmed · {consentDate} · witnessed by{" "}
                  {consentWitness.trim() || currentUser.name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() => step === 0 ? router.push("/patients") : setStep((s) => s - 1)}
            disabled={saving}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => save(false)}
                disabled={!canNext || saving}
              >
                {saving ? "Saving…" : <><Check className="h-4 w-4" /> Save patient</>}
              </Button>
              <Button onClick={() => save(true)} disabled={!canNext || saving}>
                {saving ? "Saving…" : <>Save &amp; start referral <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Required() {
  return <span className="ml-0.5 text-destructive">*</span>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-base font-semibold text-foreground">{children}</h2>
  )
}

function ConsentItem({
  id,
  checked,
  onChecked,
  title,
  description,
}: {
  id: string
  checked: boolean
  onChecked: (v: boolean) => void
  title: string
  description: string
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
        checked ? "border-success/60 bg-success/5" : "border-border hover:border-primary/30",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChecked(!!v)}
        className="mt-0.5 shrink-0"
      />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </label>
  )
}
