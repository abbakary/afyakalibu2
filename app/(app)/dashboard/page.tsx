"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ClipboardList, Clock, CheckCircle2, Users, Sparkles,
  CalendarClock, Send, Plus, ArrowRight, Building2,
  ShieldCheck, TrendingUp, UserCheck, Activity,
} from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { CaseStatusBadge, PriorityBadge, FollowUpStatusBadge } from "@/components/status-badge"
import { timeAgo } from "@/lib/format"
import { formatImageUrl } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { currentUser } = useData()
  const role = currentUser.role

  if (role === "specialist") return <SpecialistDashboard />
  if (role === "org_admin") return <OrgAdminDashboard />
  return <ClinicianDashboard />
}

// ── Specialist dashboard: case-focused ────────────────────────────────────────
function SpecialistDashboard() {
  const { cases, followUps, currentUser, activeTenant, getPatient } = useData()

  // Specialist only sees their assigned cases
  const myCases = cases.filter(c => c.specialistId === currentUser.id)
  const myNew = myCases.filter(c => c.status === "new").length
  const myInReview = myCases.filter(c => c.status === "in_review").length
  const myReviewed = myCases.filter(c => c.status === "reviewed" || c.status === "closed").length
  const myUrgent = myCases.filter(c => (c.priority === "urgent" || c.priority === "emergency") && c.status !== "reviewed" && c.status !== "closed").length

  const dueFollowUps = followUps.filter(f => f.status === "due" || f.status === "overdue")
  const recentMyCases = [...myCases].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5)
  const firstName = currentUser.name.replace(/^Dr\.\s*/, "").split(" ")[0]

  return (
    <div>
      <PageHeader
        title={`Welcome, Dr. ${firstName}`}
        description={activeTenant ? `${activeTenant.name} · Dermatology specialist workspace` : "Specialist workspace"}
        actions={
          <Link href="/cases" className={cn(buttonVariants({ variant: "default" }))}>
            <ClipboardList className="h-4 w-4" /> My case queue
          </Link>
        }
      />

      {myUrgent > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Activity className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <span className="font-semibold">{myUrgent} urgent case{myUrgent > 1 ? "s" : ""}</span> in your queue require prompt attention.
          </div>
          <Link href="/cases?priority=urgent" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-amber-400 text-amber-900")}>
            View urgent
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Assigned to me" value={myCases.length} icon={UserCheck} tone="primary" />
        <StatCard label="Awaiting my review" value={myNew + myInReview} icon={Clock} tone="warning" />
        <StatCard label="Reviewed" value={myReviewed} icon={CheckCircle2} tone="success" />
        <StatCard label="Follow-ups due" value={dueFollowUps.length} icon={CalendarClock} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-heading text-base font-semibold">My cases</h2>
              <p className="text-xs text-muted-foreground">Cases assigned to you</p>
            </div>
            <Link href="/cases?tab=mine" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentMyCases.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No cases assigned yet. New referrals will appear here automatically.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentMyCases.map(c => {
                const patient = getPatient(c.patientId)
                return (
                  <li key={c.id}>
                    <Link href={`/cases/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {c.images[0] && <Image src={formatImageUrl(c.images[0].url)} alt="" fill className="object-cover" sizes="48px" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{patient?.fullName ?? "Unknown"}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.ref} · {c.suspectedCondition}</p>
                      </div>
                      <div className="hidden items-center gap-2 sm:flex">
                        <PriorityBadge priority={c.priority} />
                        <CaseStatusBadge status={c.status} />
                      </div>
                      <span className="hidden shrink-0 text-xs text-muted-foreground md:block">{timeAgo(c.updatedAt)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-heading text-base font-semibold">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QuickAction href="/cases" icon={ClipboardList} label="Case queue" />
              <QuickAction href="/ai-assistant" icon={Sparkles} label="AI assistant" />
              <QuickAction href="/follow-up" icon={CalendarClock} label="Follow-ups" />
              <QuickAction href="/treatment-plans" icon={Send} label="Treatment plans" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-base font-semibold">Follow-ups due</h2>
              <Link href="/follow-up" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>All</Link>
            </div>
            {dueFollowUps.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No follow-ups due.</p>
            ) : (
              <ul className="divide-y divide-border">
                {dueFollowUps.slice(0, 4).map(f => (
                  <li key={f.id}>
                    <Link href={`/cases/${f.caseId}`} className="block px-5 py-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{f.patientName}</p>
                        <FollowUpStatusBadge status={f.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{f.purpose}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Org admin dashboard: management-focused ───────────────────────────────────
function OrgAdminDashboard() {
  const { cases, patients, users, followUps, referrals, currentUser, activeTenant, getPatient } = useData()

  const newCount = cases.filter(c => c.status === "new").length
  const awaiting = cases.filter(c => c.status === "in_review").length
  const completed = cases.filter(c => c.status === "reviewed" || c.status === "closed").length
  const activeUsers = users.filter(u => u.status === "active" && u.role !== "platform_admin").length
  const specialists = users.filter(u => u.role === "specialist")
  const dueFollowUps = followUps.filter(f => f.status === "due" || f.status === "overdue")
  const recent = [...cases].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5)
  const firstName = currentUser.name.replace(/^Dr\.\s*/, "").split(" ")[0]

  return (
    <div>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description={activeTenant ? `${activeTenant.name} · Organisation admin dashboard` : "Organisation administration"}
        actions={
          <>
            <Link href="/administration" className={cn(buttonVariants({ variant: "outline" }))}>
              <ShieldCheck className="h-4 w-4" /> Manage team
            </Link>
            <Link href="/cases/new" className={cn(buttonVariants({ variant: "default" }))}>
              <Plus className="h-4 w-4" /> New case
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="New referrals" value={newCount} icon={ClipboardList} tone="primary" />
        <StatCard label="Awaiting review" value={awaiting} icon={Clock} tone="warning" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Active team members" value={activeUsers} icon={Users} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-heading text-base font-semibold">Recent cases</h2>
              <p className="text-xs text-muted-foreground">All cases across the organisation</p>
            </div>
            <Link href="/cases" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map(c => {
              const patient = getPatient(c.patientId)
              return (
                <li key={c.id}>
                  <Link href={`/cases/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {c.images[0] && <Image src={formatImageUrl(c.images[0].url)} alt="" fill className="object-cover" sizes="48px" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{patient?.fullName ?? "Unknown"}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.ref} · {c.suspectedCondition}</p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <PriorityBadge priority={c.priority} />
                      <CaseStatusBadge status={c.status} />
                    </div>
                    <span className="hidden shrink-0 text-xs text-muted-foreground md:block">{timeAgo(c.updatedAt)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-heading text-base font-semibold">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QuickAction href="/patients/new" icon={Users} label="Register patient" />
              <QuickAction href="/cases/new" icon={Plus} label="New case" />
              <QuickAction href="/administration" icon={ShieldCheck} label="Team management" />
              <QuickAction href="/follow-up" icon={CalendarClock} label="Follow-ups" />
            </div>
          </Card>

          {/* Specialist load */}
          {specialists.length > 0 && (
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-sm font-semibold">Specialist workload</h2>
              </div>
              <ul className="space-y-3">
                {specialists.map(s => {
                  const assigned = cases.filter(c => c.specialistId === s.id && c.status !== "reviewed" && c.status !== "closed").length
                  return (
                    <li key={s.id} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: s.avatarColor }}>
                        {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.name}</p>
                        <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (assigned / 10) * 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{assigned} open</span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-base font-semibold">Organisation</h2>
            </div>
            <div className="divide-y divide-border px-5 py-3 text-sm space-y-2">
              <Row label="Patients" value={patients.length} />
              <Row label="Total cases" value={cases.length} />
              <Row label="Referrals pending" value={referrals.filter(r => r.status === "pending").length} />
              <Row label="Follow-ups due" value={dueFollowUps.length} />
            </div>
          </Card>

          {/* Subscription Package & Provider Inbox Card */}
          <Card className="p-5 space-y-3 border-teal-200 bg-teal-50/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-sm font-bold text-slate-900">Subscription & Billing</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                {activeTenant?.status === "active" ? "Active Subscription" : "Trial / Pending"}
              </span>
            </div>

            <div className="text-xs space-y-1 text-slate-700">
              <p>Plan: <strong className="text-slate-900">{activeTenant?.plan?.toUpperCase() || "RURAL CLINIC HUB"}</strong></p>
              <p>Monthly Rate: <strong className="text-slate-900">TZS 250,000 / month</strong></p>
              <p>Payment Status: <span className="font-semibold text-emerald-700">✓ External Payment Verified</span></p>
            </div>

            {/* Provider Messages Inbox */}
            <div className="border-t border-teal-200/60 pt-3 space-y-2">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-primary" /> Provider Announcements & Payment Notices
              </p>
              <div className="rounded-lg border border-teal-200 bg-white p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-bold text-primary">Platform Provider</span>
                  <span>Today</span>
                </div>
                <p className="text-slate-800 text-[11px]">
                  Your subscription is active. For billing inquiries or payment receipts, contact billing@skinlink.co.tz.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Clinician / nurse dashboard ────────────────────────────────────────────────
function ClinicianDashboard() {
  const { cases, patients, followUps, currentUser, activeTenant, getPatient } = useData()

  const newCount = cases.filter(c => c.status === "new").length
  const awaiting = cases.filter(c => c.status === "in_review").length
  const completed = cases.filter(c => c.status === "reviewed" || c.status === "closed").length
  const dueFollowUps = followUps.filter(f => f.status === "due" || f.status === "overdue")
  const recent = [...cases].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5)
  const firstName = currentUser.name.replace(/^Dr\.\s*/, "").split(" ")[0]

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={activeTenant ? `${activeTenant.name} · ${activeTenant.region}` : "Clinical workspace"}
        actions={
          <>
            <Link href="/referrals" className={cn(buttonVariants({ variant: "outline" }))}>
              <Send className="h-4 w-4" /> Referrals
            </Link>
            <Link href="/cases/new" className={cn(buttonVariants({ variant: "default" }))}>
              <Plus className="h-4 w-4" /> New case
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New referrals" value={newCount} icon={ClipboardList} tone="primary" />
        <StatCard label="Awaiting review" value={awaiting} icon={Clock} tone="warning" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Registered patients" value={patients.length} icon={Users} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-heading text-base font-semibold">Recent cases</h2>
            <Link href="/cases" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map(c => {
              const patient = getPatient(c.patientId)
              return (
                <li key={c.id}>
                  <Link href={`/cases/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {c.images[0] && <Image src={formatImageUrl(c.images[0].url)} alt="" fill className="object-cover" sizes="48px" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{patient?.fullName ?? "Unknown"}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.ref} · {c.suspectedCondition}</p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <PriorityBadge priority={c.priority} />
                      <CaseStatusBadge status={c.status} />
                    </div>
                    <span className="hidden shrink-0 text-xs text-muted-foreground md:block">{timeAgo(c.updatedAt)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-heading text-base font-semibold">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QuickAction href="/patients/new" icon={Users} label="Register patient" />
              <QuickAction href="/cases/new" icon={Plus} label="New case" />
              <QuickAction href="/ai-assistant" icon={Sparkles} label="AI assistant" />
              <QuickAction href="/follow-up" icon={CalendarClock} label="Follow-ups" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-base font-semibold">Follow-ups due</h2>
              <Link href="/follow-up" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>All</Link>
            </div>
            {dueFollowUps.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No follow-ups due.</p>
            ) : (
              <ul className="divide-y divide-border">
                {dueFollowUps.map(f => (
                  <li key={f.id}>
                    <Link href={`/cases/${f.caseId}`} className="block px-5 py-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{f.patientName}</p>
                        <FollowUpStatusBadge status={f.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{f.purpose}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-start gap-2 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
