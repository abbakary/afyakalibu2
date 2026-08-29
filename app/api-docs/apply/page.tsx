"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ArrowLeft, Loader2, Shield, Key, ArrowRight, CheckCircle2 } from "lucide-react"
import { SkinLinkLogo } from "@/components/brand/logo"
import { cn } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

const TIERS = [
  { id: "free",       name: "Developer",   price: "Free",             desc: "Evaluation & testing · 500 req/mo" },
  { id: "starter",    name: "Starter",     price: "TZS 150,000/mo",   desc: "Small integrations · 10,000 req/mo" },
  { id: "growth",     name: "Growth",      price: "TZS 400,000/mo",   desc: "Production apps & EMR sync · 100,000 req/mo", popular: true },
  { id: "enterprise", name: "Enterprise",  price: "Negotiated",        desc: "Unlimited + FHIR R4 + custom SLA" },
]

const INT_TYPES = ["EMR Integration", "Mobile App", "Research / Analytics", "Custom Application", "Web Dashboard", "Other"]

export default function ApiApplyPage() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [appId, setAppId] = useState("")
  const [error, setError] = useState("")

  const [orgName, setOrgName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [country, setCountry] = useState("Tanzania")
  const [tierId, setTierId] = useState("growth")
  const [integrationType, setIntegrationType] = useState("EMR Integration")
  const [intendedUse, setIntendedUse] = useState("")
  const [expectedMonthlyRequests, setExpectedMonthlyRequests] = useState("")
  const [techEmail, setTechEmail] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeData, setAgreeData] = useState(false)

  const STEPS = ["Organisation", "Integration", "Agreements"]
  const s0Valid = orgName.trim() && contactName.trim() && email.includes("@")
  const s1Valid = intendedUse.trim().length >= 20
  const s2Valid = agreeTerms && agreeData
  const canNext = step === 0 ? !!s0Valid : step === 1 ? !!s1Valid : !!s2Valid

  async function submit() {
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/api/v1/api-access/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName, contactName, email, phone: phone || undefined,
          website: website || undefined, country,
          tierId, intendedUse, integrationType,
          expectedMonthlyRequests: Number(expectedMonthlyRequests) || undefined,
          technicalContactEmail: techEmail || undefined,
          agreeTerms, agreeDataPolicy: agreeData,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? "Submission failed")
      setAppId(data.applicationId)
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const F = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"

  if (submitted) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center space-y-6">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto"><CheckCircle2 className="h-8 w-8" /></span>
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">Application received</h1>
          {appId && <p className="mt-1 font-mono text-sm text-slate-400">Ref: {appId}</p>}
          <p className="mt-3 text-slate-600">The SkinLink team will review your application within <strong>2 business days</strong>. You'll receive your API credentials by email once approved.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-left space-y-2">
          <p className="font-semibold text-slate-800">What happens next?</p>
          {["Technical review of your integration plan","Account setup and tier confirmation","Payment confirmation (for paid tiers)","API credentials issued by email","Onboarding documentation sent"].map((s, i) => (
            <div key={s} className="flex items-start gap-2.5 text-slate-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary mt-0.5">{i+1}</span>
              {s}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/api-docs" className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />API docs</Link>
          <Link href="/" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90">Home <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/"><SkinLinkLogo /></Link>
          <Link href="/api-docs" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />API docs</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"><Key className="h-6 w-6" /></div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900">Apply for API access</h1>
          <p className="mt-2 text-slate-500">Complete this form to request an API key. We review every application within 2 business days.</p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-4 ring-primary/20" : "bg-slate-200 text-slate-500")}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={cn("hidden text-xs font-medium sm:block", i === step ? "text-slate-900" : "text-slate-400")}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("ml-2 h-px flex-1", i < step ? "bg-primary" : "bg-slate-200")} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          {step === 0 && <>
            <h2 className="font-heading text-base font-semibold">Organisation details</h2>
            <F label="Organisation / company name" required>
              <input className={inputCls} value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Mwanza Health Network" />
            </F>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Contact person full name" required>
                <input className={inputCls} value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Dr. Jane Mwanga" />
              </F>
              <F label="Contact email" required>
                <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="api@yourorg.com" />
              </F>
              <F label="Phone number">
                <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 7XX XXX XXX" />
              </F>
              <F label="Country">
                <input className={inputCls} value={country} onChange={e => setCountry(e.target.value)} placeholder="Tanzania" />
              </F>
            </div>
            <F label="Website / organisation URL" hint="Optional — helps us understand your organisation">
              <input className={inputCls} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourorg.com" />
            </F>
            <F label="API plan" required>
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
                {TIERS.map(t => (
                  <label key={t.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all",
                    tierId === t.id ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:border-primary/30")}>
                    <input type="radio" name="tier" value={t.id} checked={tierId === t.id} onChange={() => setTierId(t.id)} className="accent-primary mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{t.name}</p>
                        {"popular" in t && <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-extrabold text-teal-700">POPULAR</span>}
                      </div>
                      <p className="text-xs font-semibold text-primary">{t.price}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </F>
          </>}

          {step === 1 && <>
            <h2 className="font-heading text-base font-semibold">Integration details</h2>
            <F label="Integration type" required>
              <select className={inputCls} value={integrationType} onChange={e => setIntegrationType(e.target.value)}>
                {INT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Intended use — describe your integration" required hint="Min. 20 characters. Be specific: what system are you connecting, what data flows, for what clinical purpose?">
              <textarea className={cn(inputCls, "resize-none")} rows={4} value={intendedUse} onChange={e => setIntendedUse(e.target.value)}
                placeholder="e.g. We are building a mobile clinic app that submits skin lesion images to SkinLink for AI triage and specialist review. Our nurses in rural Tanzania will use it to replace WhatsApp-based referrals…" />
              <p className={cn("mt-1 text-xs", intendedUse.length < 20 ? "text-slate-400" : "text-emerald-600")}>{intendedUse.length} / 20 min</p>
            </F>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Expected monthly API requests" hint="Approximate — used for tier recommendation">
                <input type="number" className={inputCls} value={expectedMonthlyRequests} onChange={e => setExpectedMonthlyRequests(e.target.value)} placeholder="e.g. 5000" />
              </F>
              <F label="Technical contact email" hint="Who should receive credentials? Defaults to contact email.">
                <input type="email" className={inputCls} value={techEmail} onChange={e => setTechEmail(e.target.value)} placeholder="dev@yourorg.com" />
              </F>
            </div>
          </>}

          {step === 2 && <>
            <h2 className="font-heading text-base font-semibold">Agreements & clinical responsibility</h2>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed space-y-2">
              <p className="font-semibold text-slate-800">Summary of obligations</p>
              <p>By submitting this application: (1) you confirm the integration will not expose patient data to unauthorised systems; (2) all API calls will include proper patient consent; (3) AI assessments are used as decision support only — a qualified clinician must confirm every result; (4) you will comply with Tanzania's Personal Data Protection Act; (5) rate limits will not be circumvented.</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-primary/30">
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-sm text-slate-700">I agree to the <a href="#" className="text-primary underline">API Terms of Service</a>, <a href="#" className="text-primary underline">Clinical Use Agreement</a> and <a href="#" className="text-primary underline">Developer Policy</a>. <span className="text-destructive">*</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-primary/30">
              <input type="checkbox" checked={agreeData} onChange={e => setAgreeData(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-sm text-slate-700">I confirm this integration will handle patient data in accordance with the <a href="#" className="text-primary underline">SkinLink Data Policy</a> and Tanzania PDPA requirements. <span className="text-destructive">*</span></span>
            </label>
            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
            )}
          </>}

          <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-2">
            <button onClick={() => step === 0 ? null : setStep(s => s - 1)} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-40" disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" />{step === 0 ? "" : "Back"}
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-40">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={submit} disabled={!canNext || submitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-40">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <><Key className="h-4 w-4" />Submit application</>}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
