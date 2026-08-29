"use client"

import "@/app/print-report.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  BarChart3, Users, Building2, ClipboardList, TrendingUp, Activity,
  Download, RefreshCw, Printer, DollarSign, AlertTriangle,
} from "lucide-react"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts"
import { apiFetch, apiGetPlatformStats, type PlatformStats } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChartCard, ChartTooltip, CHART_COLORS } from "@/components/charts/chart-primitives"
import { StatCard } from "@/components/stat-card"
import { TenantStatusBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"

function PrintBar({ value, max, color = "#1f7a8c" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="hbar-track">
      <div className="hbar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function ProviderAnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const now = new Date()
  const reportDate = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

  async function load(spinner = true) {
    if (spinner) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await apiGetPlatformStats()
      setStats(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Derived metrics ────────────────────────────────────────────────────────
  const derived = useMemo(() => {
    if (!stats) return null
    const { summary, tenantBreakdown, casesByStatus, tenantsByPlan } = stats

    // Revenue proxy (mock — each active tenant on avg Growth plan)
    const revenueEst = tenantBreakdown.reduce((s, t) => {
      const planPrice: Record<string, number> = { pilot: 80000, growth: 250000, enterprise: 1200000 }
      return s + (t.status === "active" ? (planPrice[t.plan] ?? 80000) : 0)
    }, 0)

    // Cases by priority across all tenants (approximated from breakdown)
    const totalOpen = summary.openCases
    const totalClosed = summary.totalCases - totalOpen

    // Top tenants by case volume
    const topByCase = [...tenantBreakdown].sort((a, b) => b.cases - a.cases).slice(0, 6)

    // Seat utilisation gauge data for RadialBar
    const seatGauge = [{ name: "Used", value: summary.seatUtilPct, fill: "#1f7a8c" }]

    // Status breakdown with friendly labels
    const statusLabels: Record<string, string> = {
      new: "New", in_review: "In Review", reviewed: "Reviewed",
      follow_up: "Follow-up", closed: "Closed",
    }
    const statusSeries = casesByStatus.map(s => ({
      name: statusLabels[s.status] ?? s.status,
      count: s.count,
    }))

    // Plan counts for donut
    const planSeries = Object.entries(
      tenantsByPlan.reduce((acc, p) => ({ ...acc, [p.plan]: p.count }), {} as Record<string, number>)
    ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

    // Tenant health matrix for radar
    const radarData = topByCase.slice(0, 5).map(t => ({
      tenant: t.name.split(" ")[0],
      Cases: Math.min(100, Math.round((t.cases / (summary.totalCases || 1)) * 100 * 5)),
      Users: Math.min(100, Math.round((t.users / (summary.totalUsers || 1)) * 100 * 5)),
      Seats: t.seatUtilPct,
      AI: Math.min(100, Math.round((t.aiAssessments / (t.cases || 1)) * 100)),
    }))

    return { revenueEst, totalOpen, totalClosed, topByCase, seatGauge, statusSeries, planSeries, radarData }
  }, [stats])

  const handlePrint = useCallback(() => {
    if (!stats || !derived) return
    setPrinting(true)

    const { summary, casesByStatus, usersByRole, tenantsByPlan, tenantBreakdown } = stats
    const { revenueEst, topByCase, statusSeries, planSeries } = derived

    const kpiCard = (label: string, value: string | number, accent: string) =>
      `<div style="border:1pt solid #e2e8f0;border-left:4pt solid ${accent};border-radius:6pt;padding:10pt 12pt;background:#f8fafc">
        <div style="font-size:18pt;font-weight:800;color:#0f172a;line-height:1">${value}</div>
        <div style="font-size:7.5pt;color:#64748b;margin-top:2pt">${label}</div>
      </div>`

    const sectionH = (title: string) =>
      `<div style="font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1f7a8c;border-bottom:1pt solid #e2e8f0;padding-bottom:3pt;margin:14pt 0 8pt">${title}</div>`

    const barRow = (label: string, value: number, max: number, color = "#1f7a8c") => {
      const pct = max > 0 ? Math.round((value / max) * 100) : 0
      return `<div style="display:flex;align-items:center;gap:6pt;margin-bottom:5pt;font-size:8pt">
        <span style="width:120pt;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#334155">${label}</span>
        <div style="flex:1;height:7pt;background:#f1f5f9;border-radius:4pt;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4pt"></div>
        </div>
        <span style="width:22pt;text-align:right;font-weight:700;color:#0f172a">${value}</span>
      </div>`
    }

    const statusColors = ["#0369a1","#b45309","#15803d","#7c3aed","#475569"]
    const planColors   = ["#1f7a8c","#0369a1","#7c3aed","#16a34a"]
    const maxCase = Math.max(...topByCase.map(t => t.cases), 1)
    const statusBadge: Record<string, string> = { active:"badge-green", trial:"badge-blue", suspended:"badge-red", pending:"badge-amber" }
    const planBadge: Record<string, string>   = { pilot:"badge-blue", growth:"badge-teal", enterprise:"badge-green" }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SkinLink Platform Analytics</title>
  <style>
    @page { size: A4; margin: 12mm 14mm 14mm 14mm; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #0f172a; background: #fff; margin: 0; padding: 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0c2340; color: #fff; padding: 5pt 8pt; text-align: left; font-size: 7.5pt; font-weight: 700; }
    td { padding: 5pt 8pt; border-bottom: .5pt solid #e2e8f0; color: #334155; font-size: 8pt; }
    tr:nth-child(even) td { background: #f8fafc; }
    .num { text-align: right; font-weight: 600; }
    .badge { display:inline-block;border-radius:3pt;padding:1pt 5pt;font-size:7pt;font-weight:700;text-transform:uppercase; }
    .badge-green { background:#dcfce7;color:#166534; }
    .badge-amber { background:#fef3c7;color:#92400e; }
    .badge-red   { background:#fee2e2;color:#991b1b; }
    .badge-blue  { background:#dbeafe;color:#1e40af; }
    .badge-teal  { background:#ccfbf1;color:#0f766e; }
    .no-break { page-break-inside:avoid;break-inside:avoid; }
  </style>
</head>
<body>
  <!-- COVER -->
  <div style="background:linear-gradient(135deg,#0c2340 0%,#1f7a8c 100%);color:#fff;padding:20pt 24pt;border-radius:6pt;margin-bottom:16pt" class="no-break">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:20pt;font-weight:800;margin-bottom:4pt">SkinLink Platform Analytics</div>
        <div style="font-size:9pt;color:rgba(255,255,255,.8)">Provider-level BI across all organisations · Generated ${reportDate}</div>
      </div>
      <div style="background:rgba(255,255,255,.15);padding:8pt 12pt;border-radius:6pt;text-align:right">
        <div style="font-size:14pt;font-weight:800;color:#fff">SkinLink</div>
        <div style="font-size:8pt;color:rgba(255,255,255,.7)">Provider Console</div>
      </div>
    </div>
    <div style="margin-top:10pt;display:flex;gap:18pt;font-size:8pt;color:rgba(255,255,255,.7)">
      <span><strong style="color:#fff">Organisations:</strong> ${summary.totalTenants}</span>
      <span><strong style="color:#fff">Users:</strong> ${summary.totalUsers}</span>
      <span><strong style="color:#fff">Cases:</strong> ${summary.totalCases}</span>
      <span><strong style="color:#fff">Date:</strong> ${reportDate}</span>
    </div>
  </div>

  <!-- KPI STRIP -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8pt;margin-bottom:14pt" class="no-break">
    ${[
      { label:"Organisations",    value:summary.totalTenants,  accent:"#1f7a8c" },
      { label:"Active users",     value:summary.totalUsers,    accent:"#475569" },
      { label:"Total cases",      value:summary.totalCases,    accent:"#16a34a" },
      { label:"Open cases",       value:summary.openCases,     accent:"#f59e0b" },
      { label:"Total patients",   value:summary.totalPatients, accent:"#475569" },
      { label:"Seat utilisation", value:`${summary.seatUtilPct}%`, accent: summary.seatUtilPct >= 90 ? "#dc2626" : "#1f7a8c" },
      { label:"Est. MRR",         value:`TZS ${(revenueEst/1000).toFixed(0)}k`, accent:"#16a34a" },
      { label:"Suspended",        value:summary.suspendedTenants, accent: summary.suspendedTenants > 0 ? "#dc2626" : "#475569" },
    ].map(k => kpiCard(k.label, k.value, k.accent)).join("")}
  </div>

  <!-- STATUS + PLAN -->
  ${sectionH("Cases by Status & Plan Distribution")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin-bottom:12pt">
    <div style="border:1pt solid #e2e8f0;border-radius:6pt;padding:10pt" class="no-break">
      <div style="font-size:9pt;font-weight:700;margin-bottom:8pt">Cases by Status</div>
      ${statusSeries.map((s, i) => barRow(s.name, s.count, Math.max(...statusSeries.map(x => x.count), 1), statusColors[i % statusColors.length])).join("")}
    </div>
    <div style="border:1pt solid #e2e8f0;border-radius:6pt;padding:10pt" class="no-break">
      <div style="font-size:9pt;font-weight:700;margin-bottom:8pt">Subscription Plan Mix</div>
      ${planSeries.map((p, i) => barRow(p.name, p.value, Math.max(...planSeries.map(x => x.value), 1), planColors[i % planColors.length])).join("")}
    </div>
  </div>

  <!-- TOP ORGS + USER ROLES -->
  ${sectionH("Top Organisations & User Roles")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin-bottom:12pt">
    <div style="border:1pt solid #e2e8f0;border-radius:6pt;padding:10pt" class="no-break">
      <div style="font-size:9pt;font-weight:700;margin-bottom:8pt">Top Organisations by Cases</div>
      ${topByCase.map(t => barRow(t.name, t.cases, maxCase)).join("")}
    </div>
    <div style="border:1pt solid #e2e8f0;border-radius:6pt;padding:10pt" class="no-break">
      <div style="font-size:9pt;font-weight:700;margin-bottom:8pt">Users by Role</div>
      ${usersByRole.map((r, i) => barRow(r.role.replace("_"," "), r.count, Math.max(...usersByRole.map(x => x.count), 1), ["#7c3aed","#1f7a8c","#0369a1","#16a34a"][i % 4])).join("")}
    </div>
  </div>

  <!-- ORG BREAKDOWN TABLE -->
  ${sectionH("Per-Organisation Breakdown")}
  <div class="no-break">
    <table>
      <thead><tr><th>Organisation</th><th>Plan</th><th>Status</th><th class="num">Users</th><th class="num">Patients</th><th class="num">Cases</th><th class="num">Open</th><th class="num">AI</th><th class="num">Seats%</th></tr></thead>
      <tbody>
        ${tenantBreakdown.map(t => `<tr>
          <td>${t.name}<br><span style="font-size:7pt;color:#94a3b8">${t.region}, ${t.country}</span></td>
          <td><span class="badge ${planBadge[t.plan] ?? "badge-blue"}">${t.plan}</span></td>
          <td><span class="badge ${statusBadge[t.status] ?? ""}">${t.status}</span></td>
          <td class="num">${t.users}</td>
          <td class="num">${t.patients}</td>
          <td class="num">${t.cases}</td>
          <td class="num">${t.openCases}</td>
          <td class="num">${t.aiAssessments}</td>
          <td class="num">${t.seatUtilPct}%</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  <!-- SUMMARY TABLE -->
  ${sectionH("Platform Summary")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin-bottom:12pt" class="no-break">
    <table>
      <tbody>
        ${[
          ["Total organisations", summary.totalTenants],
          ["Active tenants",      summary.activeTenants],
          ["Trial tenants",       summary.trialTenants],
          ["Suspended",           summary.suspendedTenants],
          ["Total cases",         summary.totalCases],
          ["Open cases",          summary.openCases],
        ].map(([k, v]) => `<tr><td>${k}</td><td class="num">${v}</td></tr>`).join("")}
      </tbody>
    </table>
    <table>
      <tbody>
        ${[
          ["Total patients",      summary.totalPatients],
          ["Total referrals",     summary.totalReferrals],
          ["Total seats",         summary.totalSeats],
          ["Used seats",          summary.usedSeats],
          ["Seat utilisation",    `${summary.seatUtilPct}%`],
          ["Est. API MRR",        `TZS ${(revenueEst/1000).toFixed(0)}k`],
        ].map(([k, v]) => `<tr><td>${k}</td><td class="num">${v}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div style="border-top:1pt solid #e2e8f0;padding-top:8pt;margin-top:16pt;display:flex;justify-content:space-between;font-size:7.5pt;color:#94a3b8">
    <span><span style="font-weight:700;color:#1f7a8c">SkinLink</span> Provider Analytics · Platform Administration</span>
    <span>Generated ${reportDate} · Confidential</span>
  </div>
</body>
</html>`

    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) { toast.error("Pop-up blocked — allow pop-ups and try again"); setPrinting(false); return }
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
    setPrinting(false)
  }, [stats, derived, reportDate])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Activity className="h-6 w-6 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  if (error || !stats || !derived) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error ?? "No analytics data available."}</p>
        <Button size="sm" variant="outline" onClick={() => load()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    )
  }

  const { summary, casesByStatus, usersByRole, tenantsByPlan, tenantBreakdown, casesByPriority } = stats
  const { revenueEst, topByCase, statusSeries, planSeries, radarData } = derived
  const maxCase = Math.max(...topByCase.map(t => t.cases), 1)

  return (
    <div id="skinlink-report-root">
      {/* Screen header */}
      <div className="no-print">
        <PageHeader
          title="Platform Analytics"
          description="Live BI metrics across all SkinLink organisations"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => load(false)} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={printing}>
                {printing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Export PDF
              </Button>
            </div>
          }
        />
      </div>

      <div className="report-page" ref={reportRef}>

        {/* Print cover */}
        <div className="report-cover no-break hidden print:block">
          <h1>SkinLink Platform Analytics Report</h1>
          <p>Provider-level business intelligence across all organisations · Generated {reportDate}</p>
          <div className="meta">
            <span><strong>Organisations:</strong> {summary.totalTenants}</span>
            <span><strong>Active users:</strong> {summary.totalUsers}</span>
            <span><strong>Total cases:</strong> {summary.totalCases}</span>
            <span><strong>Report date:</strong> {reportDate}</span>
          </div>
        </div>

        {/* KPI row — screen */}
        <div className="no-print grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Organisations" value={summary.totalTenants} icon={Building2} tone="primary"
            trend={summary.activeTenants > 0 ? undefined : undefined} />
          <StatCard label="Active users" value={summary.totalUsers} icon={Users} />
          <StatCard label="Total cases" value={summary.totalCases} icon={ClipboardList} tone="success" />
          <StatCard label="Open cases" value={summary.openCases} icon={TrendingUp} tone="warning" />
        </div>
        <div className="no-print mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total patients" value={summary.totalPatients} icon={Activity} />
          <StatCard label="Seat utilisation" value={`${summary.seatUtilPct}%`} icon={Users} tone={summary.seatUtilPct >= 90 ? "warning" : "default"} />
          <StatCard label="Est. MRR" value={`TZS ${(revenueEst / 1000).toFixed(0)}k`} icon={DollarSign} tone="success" />
          <StatCard label="Suspended" value={summary.suspendedTenants} icon={AlertTriangle} tone={summary.suspendedTenants > 0 ? "destructive" : "default"} />
        </div>

        {/* Print KPI strip */}
        <div className="kpi-strip hidden print:grid print:mt-0" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          {[
            { label: "Organisations",    value: summary.totalTenants,      tone: "tone-primary"  },
            { label: "Active users",     value: summary.totalUsers,         tone: ""              },
            { label: "Total cases",      value: summary.totalCases,         tone: "tone-success"  },
            { label: "Open cases",       value: summary.openCases,          tone: "tone-warning"  },
            { label: "Total patients",   value: summary.totalPatients,      tone: ""              },
            { label: "Seat utilisation", value: `${summary.seatUtilPct}%`,  tone: ""              },
            { label: "Est. MRR",         value: `TZS ${(revenueEst/1000).toFixed(0)}k`, tone: "tone-success" },
            { label: "Suspended",        value: summary.suspendedTenants,   tone: summary.suspendedTenants > 0 ? "tone-danger" : "" },
          ].map(k => (
            <div key={k.label} className={`kpi-card ${k.tone}`}>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Cases by status + Plan distribution ── */}
        <div className="no-print mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Cases by status" description="Across all organisations" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusSeries} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                <Bar dataKey="count" name="Cases" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {statusSeries.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Subscription plan mix" description="Organisations by plan tier">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={planSeries} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                  {planSeries.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Print status + plan */}
        <div className="hidden print:grid print:two-col">
          <div className="chart-box no-break">
            <div className="chart-title">Cases by Status</div>
            {statusSeries.map((s, i) => (
              <div key={s.name} className="hbar-row">
                <span className="hbar-label">{s.name}</span>
                <PrintBar value={s.count} max={Math.max(...statusSeries.map(x => x.count), 1)} color={CHART_COLORS[i % CHART_COLORS.length] as string} />
                <span className="hbar-value">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="chart-box no-break">
            <div className="chart-title">Subscription Plan Mix</div>
            {planSeries.map((p, i) => (
              <div key={p.name} className="hbar-row">
                <span className="hbar-label">{p.name}</span>
                <PrintBar value={p.value} max={Math.max(...planSeries.map(x => x.value), 1)} color={CHART_COLORS[i % CHART_COLORS.length] as string} />
                <span className="hbar-value">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Users by role + Seat utilisation + Radar ── */}
        <div className="no-print mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-semibold">Users by role</h3>
            </div>
            <ul className="space-y-3">
              {usersByRole.map((r, i) => {
                const total = usersByRole.reduce((a, x) => a + x.count, 0)
                const pct = total ? Math.round((r.count / total) * 100) : 0
                return (
                  <li key={r.role}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize font-medium">{r.role.replace("_", " ")}</span>
                      <span className="text-muted-foreground">{r.count} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </li>
                )
              })}
            </ul>
          </Card>

          <ChartCard title="Top organisations by cases" description="Case volume leaders">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topByCase.slice(0, 5)} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={80} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="cases" name="Cases" fill="var(--chart-2)" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tenant health radar" description="Relative performance across top 5 orgs">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="tenant" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Cases" dataKey="Cases" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} />
                <Radar name="Users" dataKey="Users" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.15} />
                <Radar name="Seats" dataKey="Seats" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.15} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Per-organisation breakdown table ── */}
        <div className="no-print mt-6">
          <Card className="overflow-hidden">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-semibold">Per-organisation breakdown</h3>
                <p className="text-xs text-muted-foreground mt-0.5">All active tenants with health indicators</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Organisation", "Plan", "Status", "Users", "Patients", "Cases", "Open", "AI", "Seats"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tenantBreakdown.map(t => (
                    <tr key={t.tenantId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.region}, {t.country}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-xs">{t.plan}</td>
                      <td className="px-4 py-3"><TenantStatusBadge status={t.status as any} /></td>
                      <td className="px-4 py-3 text-center font-medium">{t.users}</td>
                      <td className="px-4 py-3 text-center font-medium">{t.patients}</td>
                      <td className="px-4 py-3 text-center font-medium">{t.cases}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                          t.openCases > 5 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground")}>
                          {t.openCases}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{t.aiAssessments}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Progress value={t.seatUtilPct} className={cn("h-1.5 w-16", t.seatUtilPct >= 90 && "[&>div]:bg-destructive")} />
                          <span className="text-xs text-muted-foreground">{t.seatUtilPct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Print org breakdown */}
        <div className="hidden print:block">
          <div className="section-heading">Per-Organisation Breakdown</div>
          <table className="data-table no-break">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Plan</th>
                <th>Status</th>
                <th className="num">Users</th>
                <th className="num">Patients</th>
                <th className="num">Cases</th>
                <th className="num">Open</th>
                <th className="num">AI</th>
                <th className="num">Seats%</th>
              </tr>
            </thead>
            <tbody>
              {tenantBreakdown.map(t => {
                const statusClass: Record<string, string> = { active: "badge-green", trial: "badge-blue", suspended: "badge-red", pending: "badge-amber" }
                const planClass: Record<string, string> = { pilot: "badge-blue", growth: "badge-teal", enterprise: "badge-green" }
                return (
                  <tr key={t.tenantId}>
                    <td>{t.name}<br /><span style={{ fontSize: "7pt", color: "#94a3b8" }}>{t.region}, {t.country}</span></td>
                    <td><span className={`badge ${planClass[t.plan] ?? "badge-blue"}`}>{t.plan}</span></td>
                    <td><span className={`badge ${statusClass[t.status] ?? ""}`}>{t.status}</span></td>
                    <td className="num">{t.users}</td>
                    <td className="num">{t.patients}</td>
                    <td className="num">{t.cases}</td>
                    <td className="num">{t.openCases}</td>
                    <td className="num">{t.aiAssessments}</td>
                    <td className="num">{t.seatUtilPct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Print top orgs bar */}
        <div className="hidden print:block">
          <div className="section-heading">Top Organisations by Case Volume</div>
          <div className="chart-box no-break">
            {topByCase.map(t => (
              <div key={t.tenantId} className="hbar-row">
                <span className="hbar-label">{t.name}</span>
                <PrintBar value={t.cases} max={maxCase} />
                <span className="hbar-value">{t.cases}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users by role print */}
        <div className="hidden print:grid print:two-col" style={{ marginTop: "10pt" }}>
          <div className="chart-box no-break">
            <div className="chart-title">Users by Role</div>
            {usersByRole.map((r, i) => {
              const total = usersByRole.reduce((a, x) => a + x.count, 0)
              const pct = total ? Math.round((r.count / total) * 100) : 0
              return (
                <div key={r.role} className="hbar-row">
                  <span className="hbar-label" style={{ textTransform: "capitalize" }}>{r.role.replace("_", " ")}</span>
                  <PrintBar value={r.count} max={total} color="#7c3aed" />
                  <span className="hbar-value">{r.count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
          <div className="chart-box no-break">
            <div className="chart-title">Summary Metrics</div>
            <table className="data-table">
              <tbody>
                {[
                  ["Total organisations", summary.totalTenants],
                  ["Active tenants", summary.activeTenants],
                  ["Trial tenants", summary.trialTenants],
                  ["Suspended", summary.suspendedTenants],
                  ["Total cases", summary.totalCases],
                  ["Open cases", summary.openCases],
                  ["Total referrals", summary.totalReferrals],
                  ["Total seats", summary.totalSeats],
                  ["Used seats", summary.usedSeats],
                  ["Seat utilisation", `${summary.seatUtilPct}%`],
                ].map(([k, v]) => (
                  <tr key={String(k)}><td>{k}</td><td className="num">{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="report-footer hidden print:flex">
          <span><span className="brand">SkinLink</span> Provider Analytics · Platform Administration</span>
          <span>Generated {reportDate} · Confidential</span>
        </div>
      </div>
    </div>
  )
}
