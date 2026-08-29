"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Loader2, Building2, User, Settings } from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { TenantPlan } from "@/lib/types"

const STEPS = ["Organization", "Plan & capacity", "Admin account"]

const PLAN_OPTIONS: { value: TenantPlan; label: string; description: string }[] = [
  { value: "pilot", label: "Pilot", description: "Up to 10 seats · 1 clinic · trial period" },
  { value: "growth", label: "Growth", description: "Up to 50 seats · multi-clinic · full features" },
  { value: "enterprise", label: "Enterprise", description: "Unlimited seats · enterprise SLA & support" },
]

const PRESET_COLORS = [
  "#1f7a8c", "#0c6b58", "#2b4c7e", "#7c3aed",
  "#b45309", "#be185d", "#0369a1", "#15803d",
]

export default function NewOrganizationPage() {
  const router = useRouter()
  const { createTenantAccount } = useData()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 0 — Organization
  const [name, setName] = useState("")
  const [region, setRegion] = useState("")
  const [country, setCountry] = useState("")
  const [primaryColor, setPrimaryColor] = useState(PRESET_COLORS[0])

  // Step 1 — Plan & capacity
  const [plan, setPlan] = useState<TenantPlan>("pilot")
  const [seats, setSeats] = useState("10")
  const [clinics, setClinics] = useState("1")

  // Step 2 — Admin account
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminTitle, setAdminTitle] = useState("")
  const [adminPhone, setAdminPhone] = useState("")

  const step0Valid = name.trim() && region.trim() && country.trim()
  const step1Valid = Number(seats) > 0 && Number(clinics) > 0
  const step2Valid =
    adminName.trim() &&
    adminEmail.trim().includes("@") &&
    adminPassword.length >= 6

  const canNext =
    step === 0 ? !!step0Valid
    : step === 1 ? !!step1Valid
    : !!step2Valid

  async function submit() {
    setSaving(true)
    try {
      const result = await createTenantAccount({
        name: name.trim(),
        region: region.trim(),
        country: country.trim(),
        plan,
        seats: Number(seats),
        clinics: Number(clinics),
        primaryColor,
        admin: {
          name: adminName.trim(),
          email: adminEmail.trim(),
          password: adminPassword,
          title: adminTitle.trim() || undefined,
          phone: adminPhone.trim() || undefined,
        },
      })
      toast.success("Organization created", {
        description: `${result.tenant.name} is ready. Admin account: ${result.admin.email}`,
      })
      router.push(`/provider/organizations/${result.tenant.id}`)
    } catch (e) {
      toast.error("Failed to create organization", {
        description: e instanceof Error ? e.message : "Please check the form and try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create organization"
        description="Provision a new clinic or hospital account on the SkinLink platform"
        breadcrumbs={[
          { label: "Organizations", href: "/provider/organizations" },
          { label: "Create account" },
        ]}
      />

      {/* Stepper */}
      <div className="mb-6 flex items-center">
        {STEPS.map((label, i) => {
          const Icon = i === 0 ? Building2 : i === 1 ? Settings : User
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:block",
                    i === step ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-2 h-px flex-1", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          )
        })}
      </div>

      <Card className="p-5 sm:p-6">
        {/* ── Step 0: Organization ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mwanza Regional Health Network"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
            <div>
              <Label>Brand color</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrimaryColor(c)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                      primaryColor === c ? "border-foreground scale-110" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-full border-2 border-border p-0.5"
                  title="Custom color"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {(region || "ORG").slice(0, 2).toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">Preview avatar</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Plan & capacity ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Subscription plan</Label>
              <div className="space-y-2">
                {PLAN_OPTIONS.map((p) => (
                  <label
                    key={p.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors",
                      plan === p.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.value}
                      checked={plan === p.value}
                      onChange={() => setPlan(p.value)}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seats">Licensed seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">Total users this org can add</p>
              </div>
              <div>
                <Label htmlFor="clinics">Clinics / sites</Label>
                <Input
                  id="clinics"
                  type="number"
                  min={1}
                  value={clinics}
                  onChange={(e) => setClinics(e.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">Physical clinic locations</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Admin account ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This account will be the organization administrator — they can manage users, cases,
              and settings within their workspace.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="admin-name">Full name</Label>
                <Input
                  id="admin-name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Amina Hassan"
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="admin-email">Email address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@clinic.org"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="admin-password">Initial password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="admin-title">Job title (optional)</Label>
                <Input
                  id="admin-title"
                  value={adminTitle}
                  onChange={(e) => setAdminTitle(e.target.value)}
                  placeholder="e.g. Lead Dermatologist"
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="admin-phone">Phone (optional)</Label>
                <Input
                  id="admin-phone"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-2 rounded-lg bg-muted/60 p-4 text-sm">
              <p className="mb-2 font-medium">Summary</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Organization</dt>
                <dd className="font-medium">{name || "—"}</dd>
                <dt className="text-muted-foreground">Region</dt>
                <dd className="font-medium">{region}{country ? `, ${country}` : ""}</dd>
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium capitalize">{plan}</dd>
                <dt className="text-muted-foreground">Seats / Clinics</dt>
                <dd className="font-medium">{seats} / {clinics}</dd>
              </dl>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? router.push("/provider/organizations") : setStep((s) => s - 1))}
            disabled={saving}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue
            </Button>
          ) : (
            <Button onClick={submit} disabled={!canNext || saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                <><Check className="h-4 w-4" /> Create organization</>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
