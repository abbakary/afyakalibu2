"use client"

import "@/app/print-report.css"
import { useCallback, useMemo, useRef, useState } from "react"
import {
  BarChart3, ClipboardList, Clock, TrendingUp, Users, Lightbulb,
  AlertTriangle, CheckCircle2, Activity, Download, FileText,
  RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Printer,
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
  LineChart, Line, RadialBarChart, RadialBar,
} from "recharts"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartCard, ChartTooltip, CHART_COLORS } from "@/components/charts/chart-primitives"
import { cn } from "@/lib/utils"
import type { CaseStatus, CasePriority } from "@/lib/types"

type Period = "7d" | "30d" | "90d" | "all"

const STATUS_LABEL: Record<CaseStatus, string> = {
  new: "New", in_review: "In review", reviewed: "Reviewed",
  follow_up: "Follow-up", closed: "Closed",
}
const PRIORITY_LABEL: Record<CasePriority, string> = {
  routine: "Routine", urgent: "Urgent", emergency: "Emergency",
}
const PERIODS: { key: Period; label: string; days: number | null }[] = [
  { key: "7d",  label: "7 days",  days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: null },
]

function inPeriod(iso: string, days: number | null) {
  if (days == null) return true
  return Date.now() - new Date(iso).getTime() <= days * 86_400_000
}

// ── Inline SVG mini chart for print (Recharts won't render server-side) ──
function PrintBar({ value, max, color = "#1f7a8c" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="hbar-track">
      <div className="hbar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function ReportsPage() {
  const { cases, patients, referrals, followUps, activeTenant, currentUser, getUser } = useData()
  const [period, setPeriod] = useState<Period>("30d")
  const [printing, setPrinting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const periodDays = PERIODS.find((p) => p.key === period)!.days

  const now = new Date()
  const reportDate = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

  // ── Scoped data ──────────────────────────────────────────────────────────
  const scopedCases = useMemo(() => cases.filter((c) => inPeriod(c.createdAt, periodDays)), [cases, periodDays])
  const prevCases   = useMemo(() => {
    if (!periodDays) return []
    return cases.filter((c) => {
      const age = Date.now() - new Date(c.createdAt).getTime()
      return age > periodDays * 86_400_000 && age <= periodDays * 2 * 86_400_000
    })
  }, [cases, periodDays])

  const trend = (curr: number, prev: number) =>
    prev === 0 ? null : Math.round(((curr - prev) / prev) * 100)

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const reviewed = scopedCases.filter((c) => c.status === "reviewed" || c.status === "closed")
    const turnaroundMs = reviewed.length > 0
      ? reviewed.reduce((s, c) => s + (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()), 0) / reviewed.length
      : 0
    const turnaroundDays = turnaroundMs / 86_400_000
    const completionRate = scopedCases.length ? Math.round((reviewed.length / scopedCases.length) * 100) : 0
    const urgentCount = scopedCases.filter((c) => c.priority === "urgent" || c.priority === "emergency").length
    const overdueFollowUps = followUps.filter((f) => f.status === "overdue").length
    const aiAssessed = scopedCases.filter((c) => c.ai).length
    const aiRate = scopedCases.length ? Math.round((aiAssessed / scopedCases.length) * 100) : 0
    return { turnaroundDays, completionRate, urgentCount, overdueFollowUps, reviewed: reviewed.length, aiRate, aiAssessed }
  }, [scopedCases, followUps])

  // ── Volume trend (daily for 7d, weekly for longer) ────────────────────────
  const volumeTrend = useMemo(() => {
    const buckets = period === "7d" ? 7 : 8
    const bucketSize = period === "7d" ? 86_400_000 : 7 * 86_400_000
    const result: { label: string; cases: number; reviewed: number; aiRun: number }[] = []
    const nowMs = Date.now()
    for (let i = buckets - 1; i >= 0; i--) {
      const start = nowMs - (i + 1) * bucketSize
      const end   = nowMs - i * bucketSize
      const inBucket = cases.filter((c) => {
        const t = new Date(c.createdAt).getTime()
        return t >= start && t < end
      })
      const d = new Date(end - bucketSize / 2)
      const label = period === "7d"
        ? d.toLocaleDateString("en-GB", { weekday: "short" })
        : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      result.push({
        label,
        cases: inBucket.length,
        reviewed: inBucket.filter((c) => c.status === "reviewed" || c.status === "closed").length,
        aiRun: inBucket.filter((c) => c.ai).length,
      })
    }
    return result
  }, [cases, period])

  // ── Status distribution ───────────────────────────────────────────────────
  const statusData = useMemo(() => {
    const counts: Partial<Record<CaseStatus, number>> = {}
    for (const c of scopedCases) counts[c.status] = (counts[c.status] ?? 0) + 1
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABEL[status as CaseStatus] ?? status,
      value: value ?? 0,
    }))
  }, [scopedCases])

  // ── Priority ─────────────────────────────────────────────────────────────
  const priorityData = useMemo(() =>
    (["routine", "urgent", "emergency"] as CasePriority[]).map((p) => ({
      name: PRIORITY_LABEL[p],
      count: scopedCases.filter((c) => c.priority === p).length,
    })), [scopedCases])

  // ── Top conditions ────────────────────────────────────────────────────────
  const conditionData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of scopedCases) {
      const key = c.suspectedCondition.split("—")[0].split("/")[0].trim()
      if (key && key !== "Awaiting specialist review") counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.length > 30 ? name.slice(0, 28) + "…" : name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [scopedCases])

  // ── Referral funnel ───────────────────────────────────────────────────────
  const referralFunnel = useMemo(() => {
    const scoped = referrals.filter((r) => inPeriod(r.createdAt, periodDays))
    return [
      { stage: "Submitted",  count: scoped.length },
      { stage: "Accepted",   count: scoped.filter((r) => r.status !== "pending" && r.status !== "declined").length },
      { stage: "Responded",  count: scoped.filter((r) => r.status === "responded").length },
    ]
  }, [referrals, periodDays])

  // ── Demographics ──────────────────────────────────────────────────────────
  const demographics = useMemo(() => {
    const ageGroups = [
      { name: "0–17", count: 0 }, { name: "18–35", count: 0 },
      { name: "36–55", count: 0 }, { name: "56+", count: 0 },
    ]
    for (const p of patients) {
      if (p.age < 18) ageGroups[0].count++
      else if (p.age <= 35) ageGroups[1].count++
      else if (p.age <= 55) ageGroups[2].count++
      else ageGroups[3].count++
    }
    const genderCounts: Record<string, number> = {}
    for (const p of patients) genderCounts[p.gender] = (genderCounts[p.gender] ?? 0) + 1
    return {
      ageGroups,
      genderData: Object.entries(genderCounts).map(([name, value]) => ({ name, value })),
    }
  }, [patients])

  // ── Follow-up outcomes ────────────────────────────────────────────────────
  const followUpData = useMemo(() => {
    const statuses = ["scheduled", "due", "overdue", "completed"] as const
    return statuses.map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      count: followUps.filter((f) => f.status === s).length,
    }))
  }, [followUps])

  // ── Insights ──────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const items: { tone: "info" | "warning" | "success"; title: string; body: string }[] = []
    const backlog = scopedCases.filter((c) => c.status === "new" || c.status === "in_review").length
    if (backlog > 3) items.push({ tone: "warning", title: "Review backlog building", body: `${backlog} cases await specialist review. Consider prioritising urgent cases first.` })
    if (metrics.turnaroundDays > 3) {
      items.push({ tone: "warning", title: "Turnaround above target", body: `Average ${metrics.turnaroundDays.toFixed(1)} days per case. Target is under 48 hrs for routine cases.` })
    } else if (scopedCases.length > 0) {
      items.push({ tone: "success", title: "Strong review velocity", body: `Cases are reviewed in ${metrics.turnaroundDays.toFixed(1)} days on average — within SLA.` })
    }
    const top = conditionData[0]
    if (top && top.count >= 2) items.push({ tone: "info", title: `Top condition: ${top.name}`, body: `${top.count} cases this period. Ensure protocols and patient education are current.` })
    if (referrals.filter((r) => r.status === "pending").length > 0)
      items.push({ tone: "info", title: `${referrals.filter((r) => r.status === "pending").length} referral(s) awaiting response`, body: "Follow up with specialists to keep the pipeline moving." })
    if (metrics.overdueFollowUps > 0)
      items.push({ tone: "warning", title: `${metrics.overdueFollowUps} overdue follow-up(s)`, body: "Patients may be at risk of treatment gaps. Schedule outreach." })
    if (metrics.completionRate >= 70 && scopedCases.length >= 3)
      items.push({ tone: "success", title: `${metrics.completionRate}% completion rate`, body: "Most cases reach a reviewed or closed state — a healthy programme indicator." })
    if (metrics.aiRate >= 50) items.push({ tone: "success", title: `${metrics.aiRate}% AI-assisted`, body: `${metrics.aiAssessed} of ${scopedCases.length} cases had AI pre-screening, reducing specialist workload.` })
    return items.slice(0, 6)
  }, [scopedCases, metrics, conditionData, referrals])

  // ── PDF export & print handler ─────────────────────────────────────────
  const handlePrint = useCallback(() => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 150)
  }, [])

  const maxCondition = conditionData[0]?.count ?? 1

  return (
    <div id="skinlink-report-root">
      {/* ── Screen header (hidden in print) ── */}
      <div className="no-print">
        <PageHeader
          title="Reports & Analytics"
          description={activeTenant ? `Clinical intelligence — ${activeTenant.name}` : "Organisational analytics"}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border overflow-hidden">
                {PERIODS.map((p) => (
                  <button key={p.key} onClick={() => setPeriod(p.key)}
                    className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                      period === p.key ? "bg-primary text-white" : "bg-card text-muted-foreground hover:bg-muted")}>
                    {p.label}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={printing}>
                {printing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Export PDF
              </Button>
            </div>
          }
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PRINTABLE REPORT BODY
          Everything inside report-page is styled by print-report.css
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="report-page" ref={reportRef}>

        {/* Cover header */}
        <div className="report-cover no-break">
          <div className="flex items-start justify-between">
            <div>
              <h1>{activeTenant?.name ?? "SkinLink"} — Clinical Report</h1>
              <p>Tele-dermatology performance analytics · {PERIODS.find(p => p.key === period)?.label} · Generated {reportDate}</p>
            </div>
            <div className="hidden print:flex flex-col items-end gap-1">
              <span className="text-white font-extrabold text-lg">SkinLink</span>
              <span className="text-teal-300 text-xs">Tele-Dermatology Platform</span>
            </div>
          </div>
          <div className="meta mt-3 hidden print:flex">
            <span><strong>Period:</strong> {PERIODS.find(p => p.key === period)?.label}</span>
            <span><strong>Organisation:</strong> {activeTenant?.name ?? "All"}</span>
            <span><strong>Region:</strong> {activeTenant?.region ?? "—"}</span>
            <span><strong>Report date:</strong> {reportDate}</span>
          </div>
        </div>

        {/* KPI cards */}
        {/* Screen version */}
        <div className="no-print grid grid-cols-2 gap-4 mt-4 lg:grid-cols-4">
          <StatCard label="Cases in period" value={scopedCases.length} icon={ClipboardList} tone="primary"
            trend={trend(scopedCases.length, prevCases.length) ?? undefined} trendLabel="vs prev period" />
          <StatCard label="Avg turnaround" value={scopedCases.length ? `${metrics.turnaroundDays.toFixed(1)}d` : "—"}
            icon={Clock} tone={metrics.turnaroundDays > 3 ? "warning" : "success"} />
          <StatCard label="Completion rate" value={`${metrics.completionRate}%`} icon={CheckCircle2} tone="success" />
          <StatCard label="Urgent / emergency" value={metrics.urgentCount} icon={AlertTriangle} tone="warning" />
        </div>
        <div className="no-print grid grid-cols-2 gap-4 mt-3 lg:grid-cols-4">
          <StatCard label="AI-assisted cases" value={`${metrics.aiRate}%`} icon={Activity} tone="primary" />
          <StatCard label="Patients registered" value={patients.length} icon={Users} />
          <StatCard label="Overdue follow-ups" value={metrics.overdueFollowUps} icon={Calendar} tone={metrics.overdueFollowUps > 0 ? "warning" : "default"} />
          <StatCard label="Cases reviewed" value={metrics.reviewed} icon={TrendingUp} tone="success" />
        </div>

        {/* Print KPI strip */}
        <div className="kpi-strip hidden print:grid print:mt-0">
          {[
            { label: "Cases in period", value: scopedCases.length, tone: "tone-primary" },
            { label: "Avg turnaround", value: scopedCases.length ? `${metrics.turnaroundDays.toFixed(1)}d` : "—", tone: "tone-success" },
            { label: "Completion rate", value: `${metrics.completionRate}%`, tone: "tone-success" },
            { label: "Urgent / emergency", value: metrics.urgentCount, tone: "tone-warning" },
            { label: "AI-assisted", value: `${metrics.aiRate}%`, tone: "tone-primary" },
            { label: "Patients", value: patients.length, tone: "" },
            { label: "Overdue follow-ups", value: metrics.overdueFollowUps, tone: metrics.overdueFollowUps > 0 ? "tone-warning" : "" },
            { label: "Reviewed", value: metrics.reviewed, tone: "tone-success" },
          ].map(k => (
            <div key={k.label} className={`kpi-card ${k.tone}`}>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Volume trend chart ── */}
        <div className="no-print mt-6">
          <ChartCard title="Case volume trend" description="Daily/weekly submissions vs reviews completed" className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={volumeTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g5" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="cases" name="Submitted" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="reviewed" name="Reviewed" stroke="var(--chart-3)" fill="url(#g3)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="aiRun" name="AI assessed" stroke="var(--chart-5)" fill="url(#g5)" strokeWidth={2} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Print volume bar table */}
        <div className="hidden print:block">
          <div className="section-heading">Case Volume Trend</div>
          <div className="chart-box no-break">
            <div className="chart-title">Case submissions & reviews — {PERIODS.find(p => p.key === period)?.label}</div>
            <table className="data-table" style={{ marginTop: "6pt" }}>
              <thead>
                <tr><th>Period</th><th className="num">Submitted</th><th className="num">Reviewed</th><th className="num">AI Assessed</th></tr>
              </thead>
              <tbody>
                {volumeTrend.map(r => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td className="num">{r.cases}</td>
                    <td className="num">{r.reviewed}</td>
                    <td className="num">{r.aiRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Status + Priority charts ── */}
        <div className="no-print mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Case status distribution" description="Current workflow stage breakdown">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Priority breakdown" description="Urgency distribution of cases">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Cases" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {priorityData.map((_, i) => <Cell key={i} fill={["var(--chart-3)", "var(--chart-5)", "#dc2626"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Print status + priority */}
        <div className="hidden print:grid print:two-col" style={{ marginTop: "10pt" }}>
          <div className="chart-box no-break">
            <div className="chart-title">Case Status Distribution</div>
            {statusData.map((s, i) => (
              <div key={s.name} className="hbar-row">
                <span className="hbar-label">{s.name}</span>
                <PrintBar value={s.value} max={Math.max(...statusData.map(x => x.value))} color={CHART_COLORS[i % CHART_COLORS.length] as string} />
                <span className="hbar-value">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="chart-box no-break">
            <div className="chart-title">Priority Breakdown</div>
            {priorityData.map((p, i) => (
              <div key={p.name} className="hbar-row">
                <span className="hbar-label">{p.name}</span>
                <PrintBar value={p.count} max={Math.max(...priorityData.map(x => x.count), 1)} color={["#16a34a", "#f59e0b", "#dc2626"][i]} />
                <span className="hbar-value">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top conditions ── */}
        <div className="no-print mt-6">
          <ChartCard title="Top presenting conditions" description="Most frequent suspected diagnoses this period">
            {conditionData.length === 0 ? (
              <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">No condition data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={conditionData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={140} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Cases" fill="var(--chart-2)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Print conditions */}
        <div className="hidden print:block">
          <div className="section-heading">Top Presenting Conditions</div>
          <div className="chart-box no-break">
            {conditionData.length === 0
              ? <p style={{ fontSize: "8pt", color: "#64748b" }}>No condition data for this period.</p>
              : conditionData.map(c => (
                <div key={c.name} className="hbar-row">
                  <span className="hbar-label">{c.name}</span>
                  <PrintBar value={c.count} max={maxCondition} />
                  <span className="hbar-value">{c.count}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* ── Demographics + referral funnel + follow-up ── */}
        <div className="no-print mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Patient age groups" description={`${patients.length} registered patients`}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={demographics.ageGroups} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Patients" fill="var(--chart-4)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Referral funnel" description="Submission → response pipeline">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={referralFunnel} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Referrals" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Follow-up status" description="All scheduled follow-ups">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={followUpData} dataKey="count" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={4} strokeWidth={0}>
                  {followUpData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Print demographics + referral funnel */}
        <div className="hidden print:grid print:three-col" style={{ marginTop: "10pt" }}>
          <div className="chart-box no-break">
            <div className="chart-title">Patient Age Groups</div>
            <div className="chart-sub">{patients.length} registered patients</div>
            {demographics.ageGroups.map(g => (
              <div key={g.name} className="hbar-row">
                <span className="hbar-label">{g.name}</span>
                <PrintBar value={g.count} max={Math.max(...demographics.ageGroups.map(x => x.count), 1)} color="#7c3aed" />
                <span className="hbar-value">{g.count}</span>
              </div>
            ))}
          </div>
          <div className="chart-box no-break">
            <div className="chart-title">Referral Funnel</div>
            {referralFunnel.map(f => (
              <div key={f.stage} className="hbar-row">
                <span className="hbar-label">{f.stage}</span>
                <PrintBar value={f.count} max={Math.max(...referralFunnel.map(x => x.count), 1)} color="#0369a1" />
                <span className="hbar-value">{f.count}</span>
              </div>
            ))}
          </div>
          <div className="chart-box no-break">
            <div className="chart-title">Follow-up Status</div>
            {followUpData.map((f, i) => (
              <div key={f.name} className="hbar-row">
                <span className="hbar-label">{f.name}</span>
                <PrintBar value={f.count} max={Math.max(...followUpData.map(x => x.count), 1)} color={CHART_COLORS[i % CHART_COLORS.length] as string} />
                <span className="hbar-value">{f.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Case detail table ── */}
        <div className="hidden print:block">
          <div className="section-heading">Recent Cases Summary</div>
          <div className="no-break">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Suspected Condition</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th className="num">Days</th>
                </tr>
              </thead>
              <tbody>
                {scopedCases.slice(0, 15).map(c => {
                  const age = ((Date.now() - new Date(c.createdAt).getTime()) / 86_400_000).toFixed(0)
                  const statusBadge: Record<string, string> = { new: "badge-blue", in_review: "badge-amber", reviewed: "badge-green", follow_up: "badge-teal", closed: "badge-teal" }
                  const prioBadge: Record<string, string> = { routine: "badge-green", urgent: "badge-amber", emergency: "badge-red" }
                  return (
                    <tr key={c.id}>
                      <td><span style={{ fontFamily: "monospace", fontSize: "7.5pt" }}>{c.ref}</span></td>
                      <td>{c.suspectedCondition.length > 32 ? c.suspectedCondition.slice(0, 30) + "…" : c.suspectedCondition}</td>
                      <td><span className={`badge ${statusBadge[c.status] ?? ""}`}>{STATUS_LABEL[c.status]}</span></td>
                      <td><span className={`badge ${prioBadge[c.priority] ?? ""}`}>{PRIORITY_LABEL[c.priority]}</span></td>
                      <td className="num">{age}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Insights panel ── */}
        <div className="no-print mt-6">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lightbulb className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-base font-semibold">Actionable Insights</h2>
                <p className="text-xs text-muted-foreground">Data-driven recommendations for your clinical programme</p>
              </div>
            </div>
            {insights.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Submit more cases to unlock insights.</p>
            ) : (
              <ul className="divide-y divide-border">
                {insights.map((ins, i) => (
                  <li key={i} className="flex gap-4 px-5 py-4">
                    <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      ins.tone === "success" ? "bg-success/12 text-success"
                      : ins.tone === "warning" ? "bg-warning/15 text-warning-foreground"
                      : "bg-primary/10 text-primary")}>
                      {ins.tone === "success" ? <TrendingUp className="h-4 w-4" />
                        : ins.tone === "warning" ? <AlertTriangle className="h-4 w-4" />
                        : <Activity className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{ins.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{ins.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Print insights */}
        <div className="hidden print:block">
          <div className="section-heading">Actionable Insights</div>
          <div className="insights-box no-break">
            <div className="insights-header">Data-driven recommendations — {PERIODS.find(p => p.key === period)?.label}</div>
            {insights.map((ins, i) => (
              <div key={i} className="insight-row">
                <span className={`insight-icon ${ins.tone}`}>●</span>
                <div>
                  <div className="insight-title">{ins.title}</div>
                  <div className="insight-body">{ins.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Report footer ── */}
        <div className="report-footer hidden print:flex">
          <span><span className="brand">SkinLink</span> Tele-Dermatology Platform · {activeTenant?.name ?? "Organisational Report"}</span>
          <span>Generated {reportDate} · {PERIODS.find(p => p.key === period)?.label} · Confidential</span>
        </div>
      </div>
    </div>
  )
}
