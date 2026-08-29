"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import {
  Building2, Stethoscope, HeartPulse, UserCheck, Check, ChevronRight, Loader2,
  ShieldCheck, AlertTriangle, ArrowLeft, Upload, FileText, Camera, CheckCircle2,
  Award, Calendar, Eye, X, Lock,
} from "lucide-react"
import { SkinLinkLogo } from "@/components/brand/logo"
import { apiFetch, apiUploadAccountDocument } from "@/lib/api-client"
import { cn } from "@/lib/utils"

type AccountType = "org" | "solo" | "nurse" | "facility_doctor" | null

interface DocumentItem {
  id: string
  type: string
  label: string
  url: string
  uploadedAt: string
  verified?: boolean
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50/70 pb-16 pt-8">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SkinLinkLogo />
          </Link>
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </header>

        <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
          <RegisterWizard />
        </Suspense>
      </div>
    </main>
  )
}

function RegisterWizard() {
  const searchParams = useSearchParams()
  const initialType = (searchParams.get("type") as AccountType) || null
  const [selectedType, setSelectedType] = useState<AccountType>(initialType)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  if (submittedId) {
    return <SuccessState applicationId={submittedId} />
  }

  if (!selectedType) {
    return <AccountTypeSelector onSelect={setSelectedType} />
  }

  return (
    <div>
      <button
        onClick={() => setSelectedType(null)}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Change account type
      </button>

      {selectedType === "nurse" && <NurseForm onBack={() => setSelectedType(null)} onSuccess={setSubmittedId} />}
      {selectedType === "facility_doctor" && <FacilityDoctorForm onBack={() => setSelectedType(null)} onSuccess={setSubmittedId} />}
      {selectedType === "solo" && <SoloForm onBack={() => setSelectedType(null)} onSuccess={setSubmittedId} />}
      {selectedType === "org" && <OrgForm onBack={() => setSelectedType(null)} onSuccess={setSubmittedId} />}
    </div>
  )
}

// ── Account Type Selector ─────────────────────────────────────────────────────
function AccountTypeSelector({ onSelect }: { onSelect: (type: AccountType) => void }) {
  const cards = [
    {
      type: "nurse" as const,
      title: "Village Health Worker / Nurse",
      who: "Nurse, clinical officer, health worker in rural dispensary or health centre",
      icon: HeartPulse,
      badge: "TNMC Registered",
      color: "border-emerald-200 bg-emerald-50/40 hover:border-emerald-400",
      iconBg: "bg-emerald-100 text-emerald-700",
      bullets: [
        "Submits skin cases & lesion photos",
        "TNMC registration & practising licence required",
        "Facility affiliation verification",
      ],
    },
    {
      type: "facility_doctor" as const,
      title: "Facility Doctor / Specialist",
      who: "Medical officer or dermatologist employed in a hospital or health facility",
      icon: UserCheck,
      badge: "MCT Registered",
      color: "border-blue-200 bg-blue-50/40 hover:border-blue-400",
      iconBg: "bg-blue-100 text-blue-700",
      bullets: [
        "Provides remote clinical consultations within hospital network",
        "MCT registration & active licence required",
        "MoH HFR facility registration check",
      ],
    },
    {
      type: "solo" as const,
      title: "Solo Dermatologist Provider",
      who: "Independent verified dermatologist or solo dermatology practice",
      icon: Stethoscope,
      badge: "Specialist Verified (Level 5)",
      color: "border-teal-200 bg-teal-50/40 hover:border-teal-400 ring-2 ring-teal-500/20",
      iconBg: "bg-teal-100 text-teal-700",
      bullets: [
        "Direct specialist consultations to village health workers",
        "Complete 10-point regulatory document verification (MCT, Degree, CV, Indemnity)",
        "Professional indemnity insurance & Telemedicine agreement",
      ],
    },
    {
      type: "org" as const,
      title: "Health Facility / Organisation",
      who: "Hospital network, clinic group, regional health authority or NGO",
      icon: Building2,
      badge: "Multi-User Network",
      color: "border-indigo-200 bg-indigo-50/40 hover:border-indigo-400",
      iconBg: "bg-indigo-100 text-indigo-700",
      bullets: [
        "Manages multi-clinic teams and subscription plans",
        "MoH HFR facility registry verification",
        "Designated Data Protection Officer (PDPC Tanzania)",
      ],
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-extrabold text-slate-900">Create your SkinLink Account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select your professional role. All clinical accounts undergo regulatory verification prior to activation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <button
              key={c.type}
              onClick={() => onSelect(c.type)}
              className={`flex flex-col text-left rounded-2xl border p-6 transition-all hover:shadow-md ${c.color}`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold ${c.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm border border-slate-200">
                  {c.badge}
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-lg">{c.title}</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{c.who}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700 border-t border-slate-200/60 pt-3">
                {c.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-end font-semibold text-xs text-primary">
                Continue registration <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Success Confirmation Screen ──────────────────────────────────────────────
function SuccessState({ applicationId }: { applicationId: string }) {
  return (
    <div className="mx-auto max-w-xl text-center py-12">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h2 className="font-heading text-2xl font-bold text-slate-900">Application & Documents Submitted</h2>
      <p className="mt-2 text-xs font-mono text-slate-500">Application Reference: {applicationId}</p>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Your application, account password, and uploaded compliance documents have entered the <strong>SkinLink Regulatory Verification Queue</strong>. Our compliance team will verify your MCT/TNMC credentials before activating your account.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left text-xs space-y-3">
        <p className="font-bold text-slate-900 text-sm">Regulatory Verification Workflow:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span><strong>Level 1 (Identity):</strong> NIDA & Passport photo verification</span>
          </li>
          <li className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span><strong>Level 2 (Professional Reg):</strong> MCT / TNMC practitioner portal check</span>
          </li>
          <li className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span><strong>Level 3 (Specialist Status):</strong> Dermatology MMed & qualification review</span>
          </li>
          <li className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span><strong>Level 4 (Practice / Facility):</strong> MoH HFR facility registration check</span>
          </li>
          <li className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span><strong>Level 5 (Clinical Approved):</strong> Indemnity insurance & PDPC governance approval</span>
          </li>
        </ul>
      </div>

      <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90">
        Sign in to SkinLink <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// ── Shared UI Helpers ─────────────────────────────────────────────────────────
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
      {steps.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            idx < current ? "bg-emerald-500 text-white" : idx === current ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
          }`}>
            {idx < current ? "✓" : idx + 1}
          </span>
          <span className={`text-xs font-medium hidden sm:inline ${idx === current ? "text-slate-900 font-bold" : "text-slate-500"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h3 className="font-heading text-lg font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  )
}

function FormField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      {children}
    </select>
  )
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  )
}

function DocumentUploadField({
  label, hint, value, onChange, accept = "image/*,.pdf",
}: {
  label: string; hint?: string; value?: string; onChange: (url: string) => void; accept?: string
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await apiUploadAccountDocument(file)
      onChange(url)
    } catch {
      alert("Failed to upload file. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <FormField label={label} hint={hint}>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">Document attached</span>
            <button type="button" onClick={() => onChange("")} className="ml-2 text-xs text-slate-500 hover:text-destructive">Remove</button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Upload className="h-4 w-4 text-slate-500" />}
            {uploading ? "Uploading…" : "Upload file"}
            <input type="file" accept={accept} onChange={handleFileChange} className="hidden" disabled={uploading} />
          </label>
        )}
      </div>
    </FormField>
  )
}

function NavButtons({
  step, total, onBack, onNext, submitting, canNext = true,
}: {
  step: number; total: number; onBack: () => void; onNext: () => void; submitting: boolean; canNext?: boolean
}) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        {step === 0 ? "Cancel" : "Back"}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={submitting || !canNext}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : step === total - 1 ? "Submit Application" : "Next Step"}
      </button>
    </div>
  )
}

// ── Solo Dermatologist Form ───────────────────────────────────────────────────
const SOLO_STEPS = ["Identity & Photo", "MCT & Qualifications", "Practice, Indemnity & Documents", "Password & Declarations"]

function SoloForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: (id: string) => void }) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState("")
  const [dob, setDob] = useState("")
  const [nida, setNida] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [region, setRegion] = useState("")
  const [district, setDistrict] = useState("")
  const [address, setPracticeAddress] = useState("")

  const [title, setTitle] = useState("MMed Dermatology")
  const [mctNumber, setMctNumber] = useState("")
  const [licenceNumber, setLicenceNumber] = useState("")
  const [licenceExpiry, setLicenceExpiry] = useState("")
  const [specialistQual, setSpecialistQual] = useState("MMed Dermatology (MUHAS)")

  const [practiceName, setPracticeName] = useState("")
  const [tin, setTin] = useState("")
  const [indemnityInsurer, setIndemnityInsurer] = useState("")
  const [indemnityPolicy, setIndemnityPolicy] = useState("")
  const [indemnityExpiry, setIndemnityExpiry] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Documents map: type -> { url, label }
  const [docMap, setDocMap] = useState<Record<string, { type: string; label: string; url: string }>>({})

  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeData, setAgreeData] = useState(false)
  const [agreeTelemedicine, setAgreeTelemedicine] = useState(false)

  function updateDoc(type: string, label: string, url: string) {
    setDocMap(prev => {
      if (!url) {
        const copy = { ...prev }
        delete copy[type]
        return copy
      }
      return { ...prev, [type]: { type, label, url } }
    })
  }

  const step0Valid = fullName.trim() && email.includes("@") && phone.trim() && region.trim()
  const step1Valid = mctNumber.trim() && licenceNumber.trim()
  const step2Valid = true
  const step3Valid = agreeTerms && agreeData && agreeTelemedicine && password.length >= 6 && password === confirmPassword

  const canNext = step === 0 ? !!step0Valid : step === 1 ? !!step1Valid : step === 2 ? !!step2Valid : !!step3Valid

  async function submit() {
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const documentsList = Object.values(docMap).map((d, i) => ({
        id: `doc_${i + 1}`,
        type: d.type,
        label: d.label,
        url: d.url,
        uploadedAt: new Date().toISOString(),
        verified: false,
      }))

      const passportPhotoUrl = docMap["passport_photo"]?.url || undefined

      const res = await apiFetch<{ applicationId: string }>("/applications/solo", {
        method: "POST",
        body: JSON.stringify({
          fullName, dateOfBirth: dob || undefined, nidaNumber: nida || undefined,
          email, phone, practiceAddress: address || region,
          region, district: district || undefined,
          professionalTitle: title, specialty: "Dermatology",
          mctRegistrationNumber: mctNumber, licenceNumber, licenceExpiry: licenceExpiry || undefined,
          specialistQualification: specialistQual || undefined,
          practiceName: practiceName || undefined, tinNumber: tin || undefined,
          indemnityInsurer: indemnityInsurer || undefined,
          indemnityPolicyNumber: indemnityPolicy || undefined,
          indemnityExpiry: indemnityExpiry || undefined,
          passportPhotoUrl,
          documents: documentsList,
          requestedPassword: password,
          selectedPackage: {
            packageName: "Solo Pro Specialist",
            amount: 350000,
            currency: "TZS",
            billingCycle: "monthly",
          },
          agreeTerms, agreeDataPolicy: agreeData, agreeTelemedicineTerms: agreeTelemedicine,
        }),
      })
      onSuccess(res.applicationId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
          <Stethoscope className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">Solo Dermatologist Application</h1>
          <p className="text-sm text-slate-500">Verified independent dermatology practitioner account</p>
        </div>
      </div>

      <StepIndicator steps={SOLO_STEPS} current={step} />

      {step === 0 && (
        <FormCard title="Identity, Personal Information & Passport Photo">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField label="Full legal name" required>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. Grace Kimaro" />
              </FormField>
            </div>
            <FormField label="Date of birth">
              <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </FormField>
            <FormField label="NIDA Number" hint="National ID (required for Level 1 identity check)">
              <Input value={nida} onChange={e => setNida(e.target.value)} placeholder="19850412-XXXXX-XXXXX-XX" />
            </FormField>
            <FormField label="Professional email" required>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="dr.grace@skinclinic.co.tz" />
            </FormField>
            <FormField label="Phone number" required>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 7XX XXX XXX" />
            </FormField>
            <FormField label="Region" required>
              <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Dar es Salaam" />
            </FormField>
            <FormField label="District">
              <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Kinondoni" />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Practice address">
                <Textarea value={address} onChange={e => setPracticeAddress(e.target.value)} placeholder="Physical practice location address" />
              </FormField>
            </div>
            <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <DocumentUploadField
                label="1. Passport photograph"
                hint="Color passport photograph for verified specialist badge"
                value={docMap["passport_photo"]?.url}
                onChange={url => updateDoc("passport_photo", "Passport Photograph", url)}
              />
              <DocumentUploadField
                label="2. Government identity document"
                hint="NIDA Card Copy or Passport bio data page"
                value={docMap["identity_doc"]?.url}
                onChange={url => updateDoc("identity_doc", "Government Identity Document (NIDA/Passport)", url)}
              />
            </div>
          </div>
        </FormCard>
      )}

      {step === 1 && (
        <FormCard title="MCT Registration & Academic Certificates">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Professional title">
              <Select value={title} onChange={e => setTitle(e.target.value)}>
                {["MMed Dermatology", "MD, MMed", "Consultant Dermatologist", "PhD Dermatology"].map(t => <option key={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Specialist qualification" hint="e.g. MMed Dermatology (MUHAS)">
              <Input value={specialistQual} onChange={e => setSpecialistQual(e.target.value)} placeholder="MMed Dermatology" />
            </FormField>
            <FormField label="MCT registration number" required hint="Medical Council of Tanganyika">
              <Input value={mctNumber} onChange={e => setMctNumber(e.target.value)} placeholder="MCT-XXXXX" />
            </FormField>
            <FormField label="Practising licence number" required>
              <Input value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} placeholder="LIC-2024-XXXX" />
            </FormField>
            <FormField label="Licence expiry date">
              <Input type="date" value={licenceExpiry} onChange={e => setLicenceExpiry(e.target.value)} />
            </FormField>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-3">
              <p className="font-bold text-xs text-slate-800">Required Medical & Specialist Certificates (Upload PDFs or Photos)</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <DocumentUploadField
                  label="3. Medical degree certificate"
                  hint="MD / MBChB degree certificate copy"
                  value={docMap["medical_degree"]?.url}
                  onChange={url => updateDoc("medical_degree", "Medical Degree Certificate (MD/MBChB)", url)}
                />
                <DocumentUploadField
                  label="4. Internship completion evidence"
                  hint="Medical internship completion certificate"
                  value={docMap["internship_cert"]?.url}
                  onChange={url => updateDoc("internship_cert", "Internship Completion Evidence", url)}
                />
                <DocumentUploadField
                  label="5. MCT registration & practising licence"
                  hint="Active Medical Council of Tanganyika licence copy"
                  value={docMap["practising_licence"]?.url}
                  onChange={url => updateDoc("practising_licence", "MCT Registration & Practising Licence", url)}
                />
                <DocumentUploadField
                  label="6. Dermatology specialist qualification"
                  hint="MMed Dermatology / Specialist board certificate"
                  value={docMap["specialist_cert"]?.url}
                  onChange={url => updateDoc("specialist_cert", "Dermatology Specialist Qualification Certificate", url)}
                />
              </div>
            </div>
          </div>
        </FormCard>
      )}

      {step === 2 && (
        <FormCard title="Practice, Indemnity Insurance & CV Documents">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Practice / clinic name">
              <Input value={practiceName} onChange={e => setPracticeName(e.target.value)} placeholder="Grace Dermatology Clinic" />
            </FormField>
            <FormField label="TRA TIN number" hint="Tanzania Revenue Authority">
              <Input value={tin} onChange={e => setTin(e.target.value)} placeholder="XXX-XXX-XXX" />
            </FormField>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3">
              <p className="font-bold text-xs text-slate-800 mb-1">Professional Indemnity Insurance (Level 5 Requirement)</p>
              <p className="text-[11px] text-slate-500 mb-3">Independent specialists providing remote clinical consultations must hold valid professional liability insurance covering telemedicine.</p>
            </div>
            <FormField label="Insurance company">
              <Input value={indemnityInsurer} onChange={e => setIndemnityInsurer(e.target.value)} placeholder="Jubilee Insurance Tanzania" />
            </FormField>
            <FormField label="Policy number">
              <Input value={indemnityPolicy} onChange={e => setIndemnityPolicy(e.target.value)} placeholder="POL-MED-2024-XXXX" />
            </FormField>
            <FormField label="Policy expiry date">
              <Input type="date" value={indemnityExpiry} onChange={e => setIndemnityExpiry(e.target.value)} />
            </FormField>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-3">
              <p className="font-bold text-xs text-slate-800">Practice, CV & Insurance Documents</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <DocumentUploadField
                  label="7. Current Curriculum Vitae (CV)"
                  hint="Updated CV with clinical background and qualifications"
                  value={docMap["cv"]?.url}
                  onChange={url => updateDoc("cv", "Curriculum Vitae (CV)", url)}
                />
                <DocumentUploadField
                  label="8. Practice registration / TRA TIN document"
                  hint="Clinic licence or TRA TIN certificate copy"
                  value={docMap["practice_doc"]?.url}
                  onChange={url => updateDoc("practice_doc", "Practice Registration / TRA TIN Document", url)}
                />
                <DocumentUploadField
                  label="9. Professional indemnity policy"
                  hint="Insurance policy schedule covering telemedicine liability"
                  value={docMap["indemnity_policy"]?.url}
                  onChange={url => updateDoc("indemnity_policy", "Professional Indemnity Insurance Policy", url)}
                />
              </div>
            </div>
          </div>
        </FormCard>
      )}

      {step === 3 && (
        <FormCard title="Password & Legal Declarations">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-4 space-y-3">
              <p className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" /> Create Password for Your Account Login
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Create password" required hint="At least 6 characters">
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </FormField>
                <FormField label="Confirm password" required>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormField>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive font-medium">Passwords do not match.</p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:border-primary/30">
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I agree to the <a href="#" className="text-primary underline font-medium">SkinLink Professional Terms</a>, Telemedicine Ethics Protocol, and Code of Conduct. <span className="text-destructive">*</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:border-primary/30">
              <input type="checkbox" checked={agreeData} onChange={e => setAgreeData(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I confirm compliance with Tanzania&apos;s Personal Data Protection Act requirements for patient record confidentiality. <span className="text-destructive">*</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:border-primary/30">
              <input type="checkbox" checked={agreeTelemedicine} onChange={e => setAgreeTelemedicine(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I acknowledge that AI suggestions are decision support only, and I bear full clinical responsibility for all remote specialist guidance issued. <span className="text-destructive">*</span></span>
            </label>
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        </FormCard>
      )}

      <NavButtons
        step={step} total={SOLO_STEPS.length}
        onBack={() => step === 0 ? onBack() : setStep(s => s - 1)}
        onNext={() => step === SOLO_STEPS.length - 1 ? submit() : setStep(s => s + 1)}
        submitting={submitting} canNext={canNext}
      />
    </div>
  )
}

// ── Nurse Form ────────────────────────────────────────────────────────────────
const NURSE_STEPS = ["Personal Info & Photo", "TNMC Licence & Affiliation", "Password & Declarations"]
function NurseForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: (id: string) => void }) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState("")
  const [dob, setDob] = useState("")
  const [nida, setNida] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [region, setRegion] = useState("")
  const [district, setDistrict] = useState("")
  const [village, setVillage] = useState("")

  const [tnmcNumber, setTnmcNumber] = useState("")
  const [licenceNumber, setLicenceNumber] = useState("")
  const [licenceExpiry, setLicenceExpiry] = useState("")
  const [qualification, setQualification] = useState("Diploma in Nursing & Midwifery")
  const [facilityName, setFacilityName] = useState("")
  const [facilityReg, setFacilityReg] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [docMap, setDocMap] = useState<Record<string, { type: string; label: string; url: string }>>({})
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeData, setAgreeData] = useState(false)

  function updateDoc(type: string, label: string, url: string) {
    setDocMap(prev => {
      if (!url) {
        const copy = { ...prev }
        delete copy[type]
        return copy
      }
      return { ...prev, [type]: { type, label, url } }
    })
  }

  const canNext = step === 0 ? (fullName.trim() && email.includes("@") && phone.trim() && region.trim())
    : step === 1 ? (tnmcNumber.trim() && licenceNumber.trim() && facilityName.trim())
    : (agreeTerms && agreeData && password.length >= 6 && password === confirmPassword)

  async function submit() {
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const documentsList = Object.values(docMap).map((d, i) => ({
        id: `doc_n_${i + 1}`,
        type: d.type,
        label: d.label,
        url: d.url,
        uploadedAt: new Date().toISOString(),
        verified: false,
      }))
      const passportPhotoUrl = docMap["passport_photo"]?.url || undefined

      const res = await apiFetch<{ applicationId: string }>("/applications/nurse", {
        method: "POST",
        body: JSON.stringify({
          fullName, dateOfBirth: dob || undefined, nidaNumber: nida || undefined,
          email, phone, region, district: district || undefined, village: village || undefined,
          nursingQualification: qualification, tnmcRegistrationNumber: tnmcNumber,
          licenceNumber, licenceExpiry: licenceExpiry || undefined,
          facilityName, facilityRegNumber: facilityReg || undefined,
          passportPhotoUrl, documents: documentsList,
          requestedPassword: password,
          agreeTerms, agreeDataPolicy: agreeData,
        }),
      })
      onSuccess(res.applicationId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">Village Nurse / Health Worker</h1>
          <p className="text-sm text-slate-500">Frontline clinical referral account</p>
        </div>
      </div>

      <StepIndicator steps={NURSE_STEPS} current={step} />

      {step === 0 && (
        <FormCard title="Personal Information & Documents">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField label="Full legal name" required>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rehema Said" />
              </FormField>
            </div>
            <FormField label="Date of birth">
              <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </FormField>
            <FormField label="NIDA Number" hint="National ID for identity check">
              <Input value={nida} onChange={e => setNida(e.target.value)} placeholder="19920819-XXXXX-XXXXX-XX" />
            </FormField>
            <FormField label="Email address" required>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rehema@nyakatoclinic.org" />
            </FormField>
            <FormField label="Phone number" required>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 7XX XXX XXX" />
            </FormField>
            <FormField label="Region" required>
              <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Mwanza" />
            </FormField>
            <FormField label="District">
              <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Nyamagana" />
            </FormField>

            <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <DocumentUploadField
                label="Passport photograph"
                hint="Color passport photo"
                value={docMap["passport_photo"]?.url}
                onChange={url => updateDoc("passport_photo", "Passport Photograph", url)}
              />
              <DocumentUploadField
                label="Government identity document"
                hint="NIDA Card Copy"
                value={docMap["identity_doc"]?.url}
                onChange={url => updateDoc("identity_doc", "Government Identity Document (NIDA Card)", url)}
              />
            </div>
          </div>
        </FormCard>
      )}

      {step === 1 && (
        <FormCard title="TNMC Registration & Facility Affiliation">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nursing qualification">
              <Select value={qualification} onChange={e => setQualification(e.target.value)}>
                {["Diploma in Nursing & Midwifery", "BSc Nursing", "Enrolled Nurse Certificate", "Assistant Clinical Officer"].map(q => <option key={q}>{q}</option>)}
              </Select>
            </FormField>
            <FormField label="TNMC registration number" required hint="Tanzania Nursing and Midwifery Council">
              <Input value={tnmcNumber} onChange={e => setTnmcNumber(e.target.value)} placeholder="TNMC-XXXXX" />
            </FormField>
            <FormField label="Practising licence number" required>
              <Input value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} placeholder="TNMC-LIC-XXXX" />
            </FormField>
            <FormField label="Licence expiry date">
              <Input type="date" value={licenceExpiry} onChange={e => setLicenceExpiry(e.target.value)} />
            </FormField>
            <FormField label="Facility / Dispensary name" required>
              <Input value={facilityName} onChange={e => setFacilityName(e.target.value)} placeholder="Nyakato Dispensary" />
            </FormField>
            <FormField label="MoH HFR facility number">
              <Input value={facilityReg} onChange={e => setFacilityReg(e.target.value)} placeholder="HFR-XXXXX" />
            </FormField>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-3">
              <p className="font-bold text-xs text-slate-800">Nursing Certificate & Licence Attachment</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <DocumentUploadField
                  label="TNMC nursing licence"
                  hint="Copy of valid TNMC licence"
                  value={docMap["practising_licence"]?.url}
                  onChange={url => updateDoc("practising_licence", "TNMC Nursing Licence Certificate", url)}
                />
              </div>
            </div>
          </div>
        </FormCard>
      )}

      {step === 2 && (
        <FormCard title="Password & Declarations">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-4 space-y-3">
              <p className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" /> Create Password for Your Account Login
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Create password" required hint="At least 6 characters">
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </FormField>
                <FormField label="Confirm password" required>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormField>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive font-medium">Passwords do not match.</p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I agree to the <a href="#" className="text-primary underline">SkinLink Clinical Protocols</a>. <span className="text-destructive">*</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" checked={agreeData} onChange={e => setAgreeData(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I agree to comply with Personal Data Protection Act requirements for patient confidentiality. <span className="text-destructive">*</span></span>
            </label>
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          </div>
        </FormCard>
      )}

      <NavButtons
        step={step} total={NURSE_STEPS.length}
        onBack={() => step === 0 ? onBack() : setStep(s => s - 1)}
        onNext={() => step === NURSE_STEPS.length - 1 ? submit() : setStep(s => s + 1)}
        submitting={submitting} canNext={canNext}
      />
    </div>
  )
}

// ── Facility Doctor Form ──────────────────────────────────────────────────────
const DOCTOR_STEPS = ["Doctor Details", "MCT Credentials & Certificates", "Password & Affiliation Terms"]
function FacilityDoctorForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: (id: string) => void }) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState("")
  const [dob, setDob] = useState("")
  const [nida, setNida] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [region, setRegion] = useState("")
  const [district, setDistrict] = useState("")

  const [title, setTitle] = useState("Medical Officer")
  const [mctNumber, setMctNumber] = useState("")
  const [licenceNumber, setLicenceNumber] = useState("")
  const [licenceExpiry, setLicenceExpiry] = useState("")
  const [specialistQual, setSpecialistQual] = useState("MD")
  const [facilityName, setFacilityName] = useState("")
  const [facilityReg, setFacilityReg] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [docMap, setDocMap] = useState<Record<string, { type: string; label: string; url: string }>>({})
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeData, setAgreeData] = useState(false)
  const [agreeTelemedicine, setAgreeTelemedicine] = useState(false)

  function updateDoc(type: string, label: string, url: string) {
    setDocMap(prev => {
      if (!url) {
        const copy = { ...prev }
        delete copy[type]
        return copy
      }
      return { ...prev, [type]: { type, label, url } }
    })
  }

  const canNext = step === 0 ? (fullName.trim() && email.includes("@") && phone.trim() && region.trim())
    : step === 1 ? (mctNumber.trim() && licenceNumber.trim())
    : (agreeTerms && agreeData && agreeTelemedicine && password.length >= 6 && password === confirmPassword)

  async function submit() {
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const documentsList = Object.values(docMap).map((d, i) => ({
        id: `doc_d_${i + 1}`,
        type: d.type,
        label: d.label,
        url: d.url,
        uploadedAt: new Date().toISOString(),
        verified: false,
      }))
      const passportPhotoUrl = docMap["passport_photo"]?.url || undefined

      const res = await apiFetch<{ applicationId: string }>("/applications/doctor", {
        method: "POST",
        body: JSON.stringify({
          fullName, dateOfBirth: dob || undefined, nidaNumber: nida || undefined,
          email, phone, region, district: district || undefined,
          professionalTitle: title, specialty: "General Dermatology",
          mctRegistrationNumber: mctNumber, licenceNumber, licenceExpiry: licenceExpiry || undefined,
          specialistQualification: specialistQual || undefined,
          facilityName, facilityRegNumber: facilityReg || undefined,
          passportPhotoUrl, documents: documentsList,
          requestedPassword: password,
          agreeTerms, agreeDataPolicy: agreeData, agreeTelemedicineTerms: agreeTelemedicine,
        }),
      })
      onSuccess(res.applicationId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <UserCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">Facility Doctor / Specialist</h1>
          <p className="text-sm text-slate-500">Hospital medical officer account</p>
        </div>
      </div>

      <StepIndicator steps={DOCTOR_STEPS} current={step} />

      {step === 0 && (
        <FormCard title="Doctor Identity & Documents">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField label="Full legal name" required>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. Joseph Kilonzo" />
              </FormField>
            </div>
            <FormField label="Date of birth">
              <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </FormField>
            <FormField label="NIDA Number" hint="National ID">
              <Input value={nida} onChange={e => setNida(e.target.value)} placeholder="19801105-XXXXX-XXXXX-XX" />
            </FormField>
            <FormField label="Professional email" required>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="dr.joseph@bugando.org" />
            </FormField>
            <FormField label="Phone number" required>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 7XX XXX XXX" />
            </FormField>
            <FormField label="Region" required>
              <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Mwanza" />
            </FormField>

            <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <DocumentUploadField
                label="Passport photograph"
                hint="Color passport photo"
                value={docMap["passport_photo"]?.url}
                onChange={url => updateDoc("passport_photo", "Passport Photograph", url)}
              />
              <DocumentUploadField
                label="Government identity document"
                hint="NIDA Card Copy"
                value={docMap["identity_doc"]?.url}
                onChange={url => updateDoc("identity_doc", "Government Identity Document (NIDA)", url)}
              />
            </div>
          </div>
        </FormCard>
      )}

      {step === 1 && (
        <FormCard title="MCT Credentials & Document Uploads">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Professional title">
              <Select value={title} onChange={e => setTitle(e.target.value)}>
                {["Medical Officer", "Senior Medical Officer", "Specialist Dermatologist", "Consultant"].map(t => <option key={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Specialist qualification">
              <Input value={specialistQual} onChange={e => setSpecialistQual(e.target.value)} placeholder="MD, MMed" />
            </FormField>
            <FormField label="MCT registration number" required>
              <Input value={mctNumber} onChange={e => setMctNumber(e.target.value)} placeholder="MCT-XXXXX" />
            </FormField>
            <FormField label="Practising licence number" required>
              <Input value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} placeholder="LIC-2024-XXXX" />
            </FormField>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-3">
              <p className="font-bold text-xs text-slate-800">Medical Degree & MCT Licence Attachments</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <DocumentUploadField
                  label="Medical degree certificate"
                  hint="MD certificate copy"
                  value={docMap["medical_degree"]?.url}
                  onChange={url => updateDoc("medical_degree", "Medical Degree Certificate (MD)", url)}
                />
                <DocumentUploadField
                  label="MCT practising licence"
                  hint="Current MCT practising licence copy"
                  value={docMap["practising_licence"]?.url}
                  onChange={url => updateDoc("practising_licence", "MCT Practising Licence Certificate", url)}
                />
              </div>
            </div>
          </div>
        </FormCard>
      )}

      {step === 2 && (
        <FormCard title="Password & Affiliation Terms">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Hospital / Health Centre Name" required>
                <Input value={facilityName} onChange={e => setFacilityName(e.target.value)} placeholder="Bugando Medical Centre" />
              </FormField>
              <FormField label="MoH HFR facility number">
                <Input value={facilityReg} onChange={e => setFacilityReg(e.target.value)} placeholder="HFR-XXXXX" />
              </FormField>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" /> Create Password for Your Account Login
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Create password" required hint="At least 6 characters">
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </FormField>
                <FormField label="Confirm password" required>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormField>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive font-medium">Passwords do not match.</p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I agree to the SkinLink Terms of Service and MCT Guidelines. <span className="text-destructive">*</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" checked={agreeData} onChange={e => setAgreeData(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I agree to comply with Personal Data Protection Act requirements. <span className="text-destructive">*</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" checked={agreeTelemedicine} onChange={e => setAgreeTelemedicine(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I bear clinical responsibility for remote specialist advice issued. <span className="text-destructive">*</span></span>
            </label>
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          </div>
        </FormCard>
      )}

      <NavButtons
        step={step} total={DOCTOR_STEPS.length}
        onBack={() => step === 0 ? onBack() : setStep(s => s - 1)}
        onNext={() => step === DOCTOR_STEPS.length - 1 ? submit() : setStep(s => s + 1)}
        submitting={submitting} canNext={canNext}
      />
    </div>
  )
}

// ── Organisation Form ─────────────────────────────────────────────────────────
const ORG_STEPS = ["Organisation Info", "Facility & Admin Contact", "DPO Setup (PDPC)", "Password & Declarations"]
function OrgForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: (id: string) => void }) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [orgName, setOrgName] = useState("")
  const [orgType, setOrgType] = useState("Hospital")
  const [region, setRegion] = useState("")
  const [district, setDistrict] = useState("")

  const [facilityReg, setFacilityReg] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  const [dpoName, setDpoName] = useState("")
  const [dpoEmail, setDpoEmail] = useState("")
  const [dpoPhone, setDpoPhone] = useState("")
  const [pdpcReg, setPdpcReg] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pkgName, setPkgName] = useState("Rural Clinic Hub")
  const [pkgAmount, setPkgAmount] = useState(250000)

  const [docMap, setDocMap] = useState<Record<string, { type: string; label: string; url: string }>>({})
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeData, setAgreeData] = useState(false)

  function updateDoc(type: string, label: string, url: string) {
    setDocMap(prev => {
      if (!url) {
        const copy = { ...prev }
        delete copy[type]
        return copy
      }
      return { ...prev, [type]: { type, label, url } }
    })
  }

  const canNext = step === 0 ? (orgName.trim() && region.trim())
    : step === 1 ? (contactName.trim() && contactEmail.includes("@"))
    : step === 2 ? (dpoName.trim() && dpoEmail.includes("@"))
    : (agreeTerms && agreeData && password.length >= 6 && password === confirmPassword)

  async function submit() {
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const documentsList = Object.values(docMap).map((d, i) => ({
        id: `doc_o_${i + 1}`,
        type: d.type,
        label: d.label,
        url: d.url,
        uploadedAt: new Date().toISOString(),
        verified: false,
      }))

      const res = await apiFetch<{ applicationId: string }>("/applications/org", {
        method: "POST",
        body: JSON.stringify({
          orgName, orgType, region, district: district || undefined,
          facilityRegNumber: facilityReg || undefined,
          contactName, contactEmail, contactPhone: contactPhone || undefined,
          dpo: {
            name: dpoName,
            email: dpoEmail,
            phone: dpoPhone || contactPhone,
            pdpcRegistrationNumber: pdpcReg || undefined,
          },
          documents: documentsList,
          requestedPassword: password,
          selectedPackage: {
            packageName: pkgName,
            amount: pkgAmount,
            currency: "TZS",
            billingCycle: "monthly",
          },
          agreeTerms, agreeDataPolicy: agreeData,
        }),
      })
      onSuccess(res.applicationId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">Health Facility / Organisation</h1>
          <p className="text-sm text-slate-500">Hospital network or clinic group account</p>
        </div>
      </div>

      <StepIndicator steps={ORG_STEPS} current={step} />

      {step === 0 && (
        <FormCard title="Organisation Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField label="Organisation name" required>
                <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Bukoba Regional Referral Hospital" />
              </FormField>
            </div>
            <FormField label="Facility / Org type">
              <Select value={orgType} onChange={e => setOrgType(e.target.value)}>
                {["Hospital", "Health Centre Network", "Dispensary Group", "Private Clinic Network", "NGO / Mission Hospital"].map(t => <option key={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Region" required>
              <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Kagera" />
            </FormField>
            <FormField label="District">
              <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Bukoba Urban" />
            </FormField>
          </div>
        </FormCard>
      )}

      {step === 1 && (
        <FormCard title="Facility Registry & Contact Admin">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="MoH HFR facility registration number">
              <Input value={facilityReg} onChange={e => setFacilityReg(e.target.value)} placeholder="HFR-XXXXX" />
            </FormField>
            <FormField label="Contact admin full name" required>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Dr. Emmanuel Peter" />
            </FormField>
            <FormField label="Contact email" required>
              <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="admin@bukobahospital.go.tz" />
            </FormField>
            <FormField label="Contact phone">
              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+255 7XX XXX XXX" />
            </FormField>
          </div>
        </FormCard>
      )}

      {step === 2 && (
        <FormCard title="Data Protection Officer (PDPC Tanzania)">
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Under Tanzania&apos;s Personal Data Protection Act (PDPA), health organisations processing patient records must designate a Data Protection Officer.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="DPO full name" required>
                <Input value={dpoName} onChange={e => setDpoName(e.target.value)} placeholder="Data Protection Officer Name" />
              </FormField>
              <FormField label="DPO email address" required>
                <Input type="email" value={dpoEmail} onChange={e => setDpoEmail(e.target.value)} placeholder="dpo@hospital.go.tz" />
              </FormField>
              <FormField label="DPO phone number">
                <Input value={dpoPhone} onChange={e => setDpoPhone(e.target.value)} placeholder="+255 7XX XXX XXX" />
              </FormField>
              <FormField label="PDPC registration number" hint="Personal Data Protection Commission number">
                <Input value={pdpcReg} onChange={e => setPdpcReg(e.target.value)} placeholder="PDPC-TZ-2024-XXXXX" />
              </FormField>
              <div className="sm:col-span-2">
                <DocumentUploadField
                  label="Organisation registration certificate / HFR copy"
                  hint="Upload hospital operating licence or registration certificate"
                  value={docMap["facility_cert"]?.url}
                  onChange={url => updateDoc("facility_cert", "Facility Operating Licence / HFR Certificate", url)}
                />
              </div>
            </div>
          </div>
        </FormCard>
      )}

      {step === 3 && (
        <FormCard title="Subscription Package, Password & Declarations">
          <div className="space-y-4">
            {/* Visual Package Selector Card */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Select Organisation Subscription Package</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { name: "Rural Clinic Hub", amount: 250000, desc: "Up to 5 health workers · TZS 250,000 / mo", badge: "Popular" },
                  { name: "Regional Hospital", amount: 600000, desc: "Unlimited staff & priority SLA · TZS 600,000 / mo", badge: "Pro" },
                  { name: "Enterprise System", amount: 1200000, desc: "Dedicated SLA & Custom · TZS 1,200,000 / mo", badge: "Custom" },
                ].map(p => (
                  <label
                    key={p.name}
                    className={cn(
                      "flex cursor-pointer flex-col justify-between rounded-lg border p-3 transition-all",
                      pkgName === p.name ? "border-primary bg-white ring-2 ring-primary/40 shadow-sm" : "border-slate-200 bg-white/70 hover:bg-white"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{p.name}</span>
                        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-800">{p.badge}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{p.desc}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="radio"
                        name="orgPackage"
                        checked={pkgName === p.name}
                        onChange={() => {
                          setPkgName(p.name)
                          setPkgAmount(p.amount)
                        }}
                        className="accent-primary"
                      />
                      <span className="text-[11px] font-bold text-primary">TZS {p.amount.toLocaleString()} / mo</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-100 pb-4 space-y-3">
              <p className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" /> Create Admin Password for Your Account Login
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Create password" required hint="At least 6 characters">
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </FormField>
                <FormField label="Confirm password" required>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormField>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive font-medium">Passwords do not match.</p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I agree to SkinLink Organisation Terms of Service. <span className="text-destructive">*</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" checked={agreeData} onChange={e => setAgreeData(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-slate-700">I confirm organisation compliance with PDPC data protection regulations. <span className="text-destructive">*</span></span>
            </label>
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          </div>
        </FormCard>
      )}

      <NavButtons
        step={step} total={ORG_STEPS.length}
        onBack={() => step === 0 ? onBack() : setStep(s => s - 1)}
        onNext={() => step === ORG_STEPS.length - 1 ? submit() : setStep(s => s + 1)}
        submitting={submitting} canNext={canNext}
      />
    </div>
  )
}
