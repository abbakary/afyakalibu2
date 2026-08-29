"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Check, Camera, X, ChevronRight, ChevronLeft, ShieldCheck, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react"
import Image from "next/image"
import { useData } from "@/lib/data-store"
import { apiUploadImage, apiImageQualityCheck, type ImageQualityResult } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CasePriority, Gender, LesionImage } from "@/lib/types"

const STEPS = ["Patient", "Capture images", "Clinical details", "Review & submit"]
const ANGLES = ["Overview", "Close-up", "Macro", "Scale reference"]

export default function NewReferralPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { patients, currentUser, addPatient, addCase, activeTenant, getPatient } = useData()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Patient step
  const [mode, setMode] = useState<"existing" | "new">(searchParams.get("patient") ? "existing" : "new")
  const [existingId, setExistingId] = useState(searchParams.get("patient") ?? "")
  const [fullName, setFullName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<Gender>("Female")
  const [village, setVillage] = useState("")
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)

  // Images step — store File objects for upload and preview URLs for display
  const [images, setImages] = useState<{ file?: File; url: string; angle: string; quality?: ImageQualityResult; checking?: boolean }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // Clinical step
  const [primaryConcern, setPrimaryConcern] = useState("")
  const [clinicalInfo, setClinicalInfo] = useState("")
  const [durationDays, setDurationDays] = useState("")
  const [suspectedCondition, setSuspectedCondition] = useState("")
  const [priority, setPriority] = useState<CasePriority>("routine")

  const region = activeTenant?.region ?? "Mwanza"

  const patientValid =
    mode === "existing" ? !!existingId : !!fullName.trim() && !!age && !!village.trim() && consent
  const clinicalValid = !!primaryConcern.trim() && !!durationDays

  const resolvedPatient = mode === "existing" ? getPatient(existingId) : null
  const displayName = mode === "existing" ? resolvedPatient?.fullName : fullName
  const displayAge = mode === "existing" ? resolvedPatient?.age : Number(age)
  const displayGender = mode === "existing" ? resolvedPatient?.gender : gender

  const addSample = () => {
    toast.info("Use the camera or file picker to add clinical photos.")
  }

  const onFiles = async (files: FileList | null) => {
    if (!files) return
    const newEntries = Array.from(files).map((f, i) => ({
      file: f,
      url: URL.createObjectURL(f),
      angle: ANGLES[(images.length + i) % ANGLES.length],
      checking: true,
    }))
    setImages((imgs) => [...imgs, ...newEntries])

    // Upload each file then run AI quality check
    for (let i = 0; i < newEntries.length; i++) {
      const entry = newEntries[i]
      const globalIdx = images.length + i
      try {
        // Upload to get a persistent server URL first
        let serverUrl = entry.url
        if (entry.file) {
          serverUrl = await apiUploadImage(entry.file)
        }
        let quality: ImageQualityResult | undefined
        try {
          quality = await apiImageQualityCheck(serverUrl, entry.angle)
        } catch (err) {
          const message = err instanceof Error ? err.message : "AI quality check failed"
          toast.error(`Image ${globalIdx + 1} AI check failed`, { description: message })
        }
        setImages((imgs) =>
          imgs.map((img, idx) =>
            idx === globalIdx
              ? { ...img, url: serverUrl, quality, checking: false }
              : img,
          ),
        )
        if (quality?.retake_required) {
          toast.warning(`Image ${globalIdx + 1} quality issue`, {
            description: quality.issues[0] ?? "Low quality — consider retaking this photo.",
          })
        } else if (quality) {
          toast.success(`Image ${globalIdx + 1} quality OK`, {
            description: `Score ${quality.score}/100 · ${quality.rating}`,
          })
        }
      } catch {
        setImages((imgs) =>
          imgs.map((img, idx) =>
            idx === globalIdx ? { ...img, checking: false } : img,
          ),
        )
      }
    }
  }


  const imagesChecking = images.some((img) => img.checking)
  const imagesHaveRetake = images.some((img) => img.quality?.retake_required)
  const imagesAllPassed =
    images.length > 0 && !imagesChecking && !imagesHaveRetake

  const canNext = useMemo(() => {
    if (step === 0) return patientValid
    // Must have ≥1 image, no checking in progress, and no retake-required images
    if (step === 1) return images.length > 0 && !imagesChecking && !imagesHaveRetake
    if (step === 2) return clinicalValid
    return true
  }, [step, patientValid, images.length, imagesChecking, imagesHaveRetake, clinicalValid])

  const submit = async () => {
    setSubmitting(true)
    try {
      let patientId = existingId
      if (mode === "new") {
        const p = await addPatient({
          fullName: fullName.trim(),
          age: Number(age),
          gender,
          phone: phone.trim() || undefined,
          village: village.trim(),
          region,
          consentObtained: consent,
          registeredById: currentUser.id,
        })
        patientId = p.id
      }

      const uploadedImages = await Promise.all(
        images.map(async (img, i) => {
          // If already uploaded (url is a server URL), skip re-upload
          const url = img.file && !img.url.startsWith("http")
            ? await apiUploadImage(img.file)
            : img.url
          const q = img.quality
          return {
            url,
            angle: img.angle,
            quality: (q?.rating ?? "good") as "good" | "acceptable" | "poor",
            qualityScore: q?.score ?? 85,
            qualityNotes: q?.issues?.join("; ") || undefined,
          }
        }),
      )

      const created = await addCase({
        ref: "",
        patientId,
        clinicianId: currentUser.id,
        specialistId: undefined,
        primaryConcern: primaryConcern.trim(),
        clinicalInfo: clinicalInfo.trim() || primaryConcern.trim(),
        durationDays: Number(durationDays),
        suspectedCondition: suspectedCondition.trim() || "Awaiting specialist review",
        status: "new",
        priority,
        images: uploadedImages.map((img, i) => ({
          id: `img_${Date.now()}_${i}`,
          ...img,
          capturedAt: new Date().toISOString(),
        })),
      })

      toast.success("Referral submitted", { description: `${created.ref} sent for specialist review.` })
      router.push(`/cases/${created.id}`)
    } catch {
      toast.error("Submission failed. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New referral"
        description="Register the patient, capture images and submit for specialist review"
        breadcrumbs={[{ label: "Case queue", href: "/cases" }, { label: "New referral" }]}
      />

      {/* Stepper */}
      <div className="mb-6 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("hidden text-sm font-medium sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn("mx-2 h-px flex-1", i < step ? "bg-primary" : "bg-border")} />}
          </div>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        {/* Step 1: Patient */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex gap-2">
              <ModeButton active={mode === "new"} onClick={() => setMode("new")} label="New patient" />
              <ModeButton active={mode === "existing"} onClick={() => setMode("existing")} label="Existing patient" />
            </div>

            {mode === "existing" ? (
              <div>
                <Label>Select patient</Label>
                <Select value={existingId} onValueChange={setExistingId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose a registered patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName} · {p.code} · {p.age}/{p.gender[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Fatuma K." className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} placeholder="45" className="mt-1.5" />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="village">Village / location</Label>
                  <Input id="village" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Mbuyuni" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 7XX XXX XXX" className="mt-1.5" />
                </div>
                <label className="sm:col-span-2 flex items-start gap-2.5 rounded-lg border border-border p-3">
                  <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
                  <span className="text-sm">
                    <span className="font-medium">Consent obtained</span>
                    <span className="block text-xs text-muted-foreground">
                      Patient consents to photography, secure remote review and storage by authorised specialists.
                    </span>
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Images */}
        {step === 1 && (
          <div>
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-accent/50 p-3 text-xs text-accent-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Take clear, well-lit photos from multiple angles. Include surrounding normal skin and a scale reference.
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <Image src={img.url || "/placeholder.svg"} alt={img.angle} fill className="object-cover" sizes="120px" crossOrigin="anonymous" />
                  <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">{img.angle}</span>
                  {/* Quality badge */}
                  {img.checking && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/85">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    </span>
                  )}
                  {!img.checking && img.quality && (
                    <span className={`absolute right-1 top-1 flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold backdrop-blur ${
                      img.quality.retake_required
                        ? "bg-destructive/90 text-destructive-foreground"
                        : img.quality.rating === "good"
                        ? "bg-success/90 text-white"
                        : "bg-warning/90 text-white"
                    }`}>
                      {img.quality.retake_required
                        ? <><XCircle className="h-2.5 w-2.5" /> Retake</>
                        : <><CheckCircle2 className="h-2.5 w-2.5" /> {img.quality.score}</>
                      }
                    </span>
                  )}
                  <button
                    onClick={() => setImages((imgs) => imgs.filter((_, ii) => ii !== i))}
                    className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/85 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs font-medium">Add photo</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />

            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={addSample} disabled>
                <Camera className="h-4 w-4" /> Sample images removed — upload real photos
              </Button>
            </div>

            {images.length > 0 && images.length < 2 && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-warning-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> One image only — additional angles are recommended for a confident assessment.
              </p>
            )}

            {/* Quality summary */}
            {images.some((img) => img.quality) && (
              <div className="mt-3 space-y-1.5">
                {images
                  .filter((img) => img.quality?.retake_required)
                  .map((img, i) => (
                    <p key={i} className="flex items-center gap-1.5 text-xs text-destructive">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      <strong>{img.angle}:</strong> {img.quality!.issues[0] ?? "Poor quality — retake recommended"}
                    </p>
                  ))}
                {imagesAllPassed && (
                  <p className="flex items-center gap-1.5 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All images passed quality check
                  </p>
                )}
              </div>
            )}

            {/* Hard block banner — shown when retake is required */}
            {imagesHaveRetake && !imagesChecking && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/8 px-3 py-3 text-sm text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Retake required before you can continue</p>
                  <p className="mt-0.5 text-xs text-destructive/80">
                    One or more images failed the quality check. Remove them and capture new clear,
                    well-lit photos before proceeding.
                  </p>
                </div>
              </div>
            )}

            {/* Checking in progress */}
            {imagesChecking && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking image quality…
              </div>
            )}
          </div>
        )}

        {/* Step 3: Clinical details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="concern">Primary concern</Label>
              <Input id="concern" value={primaryConcern} onChange={(e) => setPrimaryConcern(e.target.value)} placeholder="e.g. Itchy rash on forearm" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Input id="duration" type="number" min={0} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="2" className="mt-1.5" />
              </div>
              <div>
                <Label>Urgency</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as CasePriority)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="suspected">Suspected condition (optional)</Label>
              <Input id="suspected" value={suspectedCondition} onChange={(e) => setSuspectedCondition(e.target.value)} placeholder="e.g. Suspected Eczema" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="clinical">Clinical notes &amp; history</Label>
              <Textarea id="clinical" value={clinicalInfo} onChange={(e) => setClinicalInfo(e.target.value)} placeholder="Symptoms, body site, previous treatment, associated conditions, red flags…" rows={4} className="mt-1.5" />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-heading text-base font-semibold">Review before submitting</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReviewField label="Patient" value={`${displayName ?? "—"} · ${displayAge ?? "—"} / ${displayGender ?? "—"}`} />
              <ReviewField label="Location" value={mode === "existing" ? `${resolvedPatient?.village ?? ""}, ${resolvedPatient?.region ?? ""}` : `${village}, ${region}`} />
              <ReviewField label="Primary concern" value={primaryConcern || "—"} />
              <ReviewField label="Duration" value={durationDays ? `${durationDays} days` : "—"} />
              <ReviewField label="Suspected condition" value={suspectedCondition || "Awaiting review"} />
              <ReviewField label="Urgency" value={priority} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Photos ({images.length})</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                    <Image src={img.url || "/placeholder.svg"} alt="" fill className="object-cover" sizes="64px" crossOrigin="anonymous" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              A unique case number and expected response window will be created on submission. The case is stored under one continuous, auditable history.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <Button variant="ghost" onClick={() => (step === 0 ? router.push("/cases") : setStep((s) => s - 1))}>
            <ChevronLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <div className="flex flex-col items-end gap-1">
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
              {step === 1 && imagesHaveRetake && !imagesChecking && (
                <p className="text-xs text-destructive">Remove poor-quality images to continue</p>
              )}
              {step === 1 && imagesChecking && (
                <p className="text-xs text-muted-foreground">Waiting for quality checks…</p>
              )}
            </div>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit referral
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
      )}
    >
      {label}
    </button>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize">{value}</p>
    </div>
  )
}
