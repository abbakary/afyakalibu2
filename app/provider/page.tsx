"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  Building2,
  Users,
  ClipboardList,
  Armchair,
  PlusCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TenantStatusBadge } from "@/components/status-badge"
import { ChartCard, ChartTooltip, CHART_COLORS } from "@/components/charts/chart-primitives"
import { cn } from "@/lib/utils"

const PLAN_LABEL: Record<string, string> = { pilot: "Pilot", growth: "Growth", enterprise: "Enterprise" }

export default function ProviderOverviewPage() {
  const { db } = useData()

  const totals = useMemo(() => {
    const tenants = db.tenants
    const activeCount = tenants.filter((t) => t.status === "active").length
    const trialCount = tenants.filter((t) => t.status === "trial").length
    const suspendedCount = tenants.filter((t) => t.status === "suspended").length
    const seats = tenants.reduce((a, t) => a + t.seats, 0)
    const usedSeats = tenants.reduce((a, t) => a + t.usedSeats, 0)
    return {
      orgs: tenants.length,
      activeCount,
      trialCount,
      suspendedCount,
      users: db.users.filter((u) => u.role !== "platform_admin").length,
      cases: db.cases.length,
      patients: db.patients.length,
      seats,
      usedSeats,
    }
  }, [db])

  const casesByOrg = useMemo(
    () =>
      db.tenants
        .map((t) => ({
          name: t.region,
          cases: db.cases.filter((c) => c.tenantId === t.id).length,
          patients: db.patients.filter((p) => p.tenantId === t.id).length,
        }))
        .sort((a, b) => b.cases - a.cases),
    [db],
  )

  const planData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of db.tenants) counts[t.plan] = (counts[t.plan] ?? 0) + 1
    return Object.entries(counts).map(([plan, value]) => ({ name: PLAN_LABEL[plan] ?? plan, value }))
  }, [db.tenants])

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Cross-organization health of the SkinLink network"
        actions={
          <Link href="/provider/organizations/new" className={cn(buttonVariants({ variant: "default" }))}>
            <PlusCircle className="h-4 w-4" /> Create account
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Organizations" value={totals.orgs} icon={Building2} tone="primary" />
        <StatCard label="Active users" value={totals.users} icon={Users} />
        <StatCard label="Cases (all tenants)" value={totals.cases} icon={ClipboardList} tone="success" />
        <StatCard
          label="Seat utilization"
          value={`${Math.round((totals.usedSeats / totals.seats) * 100)}%`}
          icon={Armchair}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          title="Cases by region"
          description="Volume across every organization"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={casesByOrg} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)" }} />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="cases" name="Cases" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              <Bar dataKey="patients" name="Patients" fill="var(--chart-3)" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Plan mix" description="Organizations by subscription plan">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={planData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={3}
                strokeWidth={0}
              >
                {planData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Seat utilization + recent orgs */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-base font-semibold">Seat utilization by organization</h3>
          </div>
          <ul className="space-y-4">
            {db.tenants.map((t) => {
              const pct = Math.round((t.usedSeats / t.seats) * 100)
              return (
                <li key={t.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground">
                      {t.usedSeats}/{t.seats} seats
                    </span>
                  </div>
                  <Progress value={pct} />
                </li>
              )
            })}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-heading text-base font-semibold">Organizations</h3>
            <Link href="/provider/organizations" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Manage all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {db.tenants.slice(0, 5).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/provider/organizations/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: t.primaryColor }}
                  >
                    {t.region.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.region}, {t.country} · {PLAN_LABEL[t.plan]}
                    </p>
                  </div>
                  <TenantStatusBadge status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
