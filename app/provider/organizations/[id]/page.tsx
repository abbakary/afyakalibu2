"use client"

import { use, useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2, Users, ClipboardList, UserPlus, Pencil, PowerOff, Power,
  Trash2, MoreHorizontal, ArrowRight, Loader2, Check, X, ShieldCheck,
  Stethoscope, UserCog, Activity, TrendingUp, Calendar,
} from "lucide-react"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell,
} from "recharts"
import { useData } from "@/lib/data-store"
import {
  apiDeleteTenant, apiDeleteUser, apiGetUsers,
  apiFetch,
} from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { TenantStatusBadge } from "@/components/status-badge"
import { ChartCard, ChartTooltip, CHART_COLORS } from "@/components/charts/chart-primitives"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import type { TenantStatus, TenantPlan, UserRole, User } from "@/lib/types"

const PLAN_LABEL: Record<string, string> = { pilot: "Pilot", growth: "Growth", enterprise: "Enterprise" }
const ROLE_LABEL: Record<string, string> = {
  org_admin: "Org Admin", specialist: "Specialist",
  clinician: "Clinician", platform_admin: "Platform Admin",
}
const ROLE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  org_admin: UserCog, specialist: Stethoscope,
  clinician: Activity, platform_admin: ShieldCheck,
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { db, updateTenant, addUser, updateUser, refresh } = useData()

  const tenant = useMemo(() => db.tenants.find((t) => t.id === id), [db.tenants, id])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Load users scoped to this tenant via the API (platform admin has no
  // active tenant in state, so we pass X-Tenant-Id manually)
  useEffect(() => {
    setLoadingUsers(true)
    apiFetch<User[]>("/users", {
      headers: { "X-Tenant-Id": id } as Record<string, string>,
    })
      .then(setOrgUsers)
      .catch(() => {
        // fallback: filter from in-memory db
        setOrgUsers(db.users.filter((u) => u.tenantId === id))
      })
      .finally(() => setLoadingUsers(false))
  }, [id, db.users])

  const orgCases = useMemo(() => db.cases.filter((c) => c.tenantId === id), [db.cases, id])
  const orgPatients = useMemo(() => db.patients.filter((p) => p.tenantId === id), [db.patients, id])

  // ── Edit tenant dialog ──
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPlan, setEditPlan] = useState<TenantPlan>("pilot")
  const [editSeats, setEditSeats] = useState("")
  const [editClinics, setEditClinics] = useState("")
  const [editContact, setEditContact] = useState("")
  const [editContactEmail, setEditContactEmail] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  function openEdit() {
    if (!tenant) return
    setEditName(tenant.name)
    setEditPlan(tenant.plan)
    setEditSeats(String(tenant.seats))
    setEditClinics(String(tenant.clinics))
    setEditContact(tenant.contactName)
    setEditContactEmail(tenant.contactEmail)
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!tenant) return
    setEditSaving(true)
    try {
      await updateTenant(tenant.id, {
        name: editName.trim(),
        plan: editPlan,
        seats: Number(editSeats),
        clinics: Number(editClinics),
        contactName: editContact.trim(),
        contactEmail: editContactEmail.trim(),
      })
      toast.success("Organization updated")
      setEditOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setEditSaving(false)
    }
  }

  // ── Suspend / reactivate ──
  async function toggleSuspend() {
    if (!tenant) return
    const next: TenantStatus = tenant.status === "suspended" ? "active" : "suspended"
    await updateTenant(tenant.id, { status: next })
    toast.success(next === "suspended" ? `${tenant.name} suspended` : `${tenant.name} reactivated`)
  }

  // ── Delete tenant ──
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function deleteTenant() {
    if (!tenant || deleteConfirm !== tenant.name) return
    setDeleting(true)
    try {
      await apiDeleteTenant(tenant.id)
      await refresh()
      toast.success(`${tenant.name} deleted`)
      router.push("/provider/organizations")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
      setDeleting(false)
    }
  }

  // ── Add user dialog ──
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<UserRole>("clinician")
  const [newTitle, setNewTitle] = useState("")
  const [addingUser, setAddingUser] = useState(false)

  async function handleAddUser() {
    setAddingUser(true)
    try {
      const user = await addUser(
        {
          tenantId: id,
          name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
          title: newTitle.trim() || undefined,
          status: "active",
          avatarColor: CHART_COLORS[orgUsers.length % CHART_COLORS.length],
        },
        newPassword,
      )
      setOrgUsers((u) => [user, ...u])
      toast.success(`${user.name} added`)
      setAddUserOpen(false)
      setNewName(""); setNewEmail(""); setNewPassword("")
      setNewRole("clinician"); setNewTitle("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add user")
    } finally {
      setAddingUser(false)
    }
  }

  // ── Disable / re-enable user ──
  async function toggleUserStatus(user: User) {
    const next = user.status === "disabled" ? "active" : "disabled"
    await updateUser(user.id, { status: next })
    setOrgUsers((users) => users.map((u) => (u.id === user.id ? { ...u, status: next } : u)))
    toast.success(next === "disabled" ? `${user.name} disabled` : `${user.name} re-enabled`)
  }

  // ── Delete user ──
  async function deleteUser(user: User) {
    try {
      await apiDeleteUser(user.id)
      setOrgUsers((u) => u.filter((x) => x.id !== user.id))
      await refresh()
      toast.success(`${user.name} removed`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove user")
    }
  }

  // ── BI data ──
  const casesByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of orgCases) counts[c.status] = (counts[c.status] ?? 0) + 1
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  }, [orgCases])

  const usersByRole = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const u of orgUsers) counts[u.role] = (counts[u.role] ?? 0) + 1
    return Object.entries(counts).map(([role, count]) => ({
      role: ROLE_LABEL[role] ?? role, count,
    }))
  }, [orgUsers])

  // Cases in last 7 days by day
  const caseTrend = useMemo(() => {
    const days: { day: string; cases: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString("en", { weekday: "short" })
      const dateStr = d.toISOString().slice(0, 10)
      const count = orgCases.filter((c) => c.createdAt.slice(0, 10) === dateStr).length
      days.push({ day: label, cases: count })
    }
    return days
  }, [orgCases])

  if (!tenant) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Organization not found.</p>
        <Button variant="outline" onClick={() => router.push("/provider/organizations")}>
          Back to organizations
        </Button>
      </div>
    )
  }

  const seatPct = Math.round((tenant.usedSeats / tenant.seats) * 100)
  const openCases = orgCases.filter((c) => c.status === "new" || c.status === "in_review").length

  return (
    <div>
      <PageHeader
        title={tenant.name}
        description={`${tenant.region}, ${tenant.country} · ${PLAN_LABEL[tenant.plan]} plan`}
        breadcrumbs={[
          { label: "Organizations", href: "/provider/organizations" },
          { label: tenant.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={toggleSuspend}
                  className={tenant.status === "suspended" ? "text-success" : "text-warning-foreground"}>
                  {tenant.status === "suspended"
                    ? <><Power className="mr-2 h-4 w-4" /> Reactivate</>
                    : <><PowerOff className="mr-2 h-4 w-4" /> Suspend</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => { setDeleteConfirm(""); setDeleteOpen(true) }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Status banner */}
      {tenant.status === "suspended" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <PowerOff className="h-4 w-4 shrink-0" />
          This organization is suspended. Users cannot log in.
          <Button variant="link" size="sm" className="ml-auto text-destructive" onClick={toggleSuspend}>
            Reactivate
          </Button>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Users" value={orgUsers.length} icon={Users} color="text-primary" />
        <StatTile label="Patients" value={orgPatients.length} icon={Activity} color="text-success" />
        <StatTile label="Total cases" value={orgCases.length} icon={ClipboardList} color="text-chart-1" />
        <StatTile label="Open cases" value={openCases} icon={TrendingUp} color="text-warning-foreground" />
      </div>

      {/* ── BI charts ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Cases this week" description="New submissions per day (last 7 days)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={caseTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Bar dataKey="cases" name="Cases" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Users by role" description="Role distribution in this organization">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={usersByRole} dataKey="count" nameKey="role"
                innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                {usersByRole.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {usersByRole.map((r, i) => (
              <span key={r.role} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {r.role} ({r.count})
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Cases by status + seat utilization ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold">Cases by status</h3>
          </div>
          {casesByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cases yet.</p>
          ) : (
            <ul className="space-y-3">
              {casesByStatus.map((s) => {
                const pct = Math.round((s.count / orgCases.length) * 100)
                return (
                  <li key={s.status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize font-medium">{s.status.replace("_", " ")}</span>
                      <span className="text-muted-foreground">{s.count} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold">Seat utilization</h3>
          </div>
          <div className="mb-3 flex items-end justify-between">
            <span className="text-3xl font-bold">{seatPct}%</span>
            <span className="text-sm text-muted-foreground">{tenant.usedSeats} / {tenant.seats} seats</span>
          </div>
          <Progress value={seatPct} className={cn("h-3", seatPct >= 90 && "[&>div]:bg-destructive")} />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="font-bold text-base">{tenant.clinics}</p>
              <p className="text-muted-foreground">Clinics</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="font-bold text-base capitalize">{tenant.plan}</p>
              <p className="text-muted-foreground">Plan</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="font-bold text-base">
                <TenantStatusBadge status={tenant.status} />
              </p>
              <p className="text-muted-foreground">Status</p>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between"><span>Contact</span><span className="font-medium text-foreground">{tenant.contactName}</span></div>
            <div className="flex justify-between"><span>Email</span><span className="font-medium text-foreground">{tenant.contactEmail}</span></div>
            <div className="flex justify-between"><span>Created</span><span className="font-medium text-foreground">{formatDate(tenant.createdAt)}</span></div>
          </div>
        </Card>
      </div>

      {/* ── Users table ── */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold">
              Users
              {!loadingUsers && <span className="ml-1.5 text-muted-foreground font-normal">({orgUsers.length})</span>}
            </h3>
          </div>
          <Button size="sm" onClick={() => setAddUserOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add user
          </Button>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : orgUsers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No users yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orgUsers.map((u) => {
              const RoleIcon = ROLE_ICON[u.role] ?? Users
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{ROLE_LABEL[u.role] ?? u.role}</span>
                  </div>
                  <span className={cn(
                    "hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:block",
                    u.status === "active" ? "bg-success/15 text-success"
                    : u.status === "invited" ? "bg-warning/15 text-warning-foreground"
                    : "bg-muted text-muted-foreground line-through",
                  )}>
                    {u.status}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => toggleUserStatus(u)}>
                        {u.status === "disabled"
                          ? <><Power className="mr-2 h-4 w-4" /> Re-enable</>
                          : <><PowerOff className="mr-2 h-4 w-4" /> Disable</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteUser(u)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Recent cases ── */}
      {orgCases.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-semibold">Recent cases</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {orgCases.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.ref}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.primaryConcern}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                  c.status === "new" ? "bg-primary/10 text-primary"
                  : c.status === "in_review" ? "bg-warning/15 text-warning-foreground"
                  : c.status === "reviewed" ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground",
                )}>
                  {c.status.replace("_", " ")}
                </span>
                <span className={cn(
                  "hidden rounded-full px-2 py-0.5 text-[11px] font-medium capitalize sm:block",
                  c.priority === "emergency" ? "bg-destructive/10 text-destructive"
                  : c.priority === "urgent" ? "bg-warning/15 text-warning-foreground"
                  : "bg-muted/60 text-muted-foreground",
                )}>
                  {c.priority}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {formatDate(c.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ════ Dialogs ════ */}

      {/* Edit org */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit organization</DialogTitle>
            <DialogDescription>Update plan, capacity, and contact details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="edit-name">Organization name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan</Label>
                <Select value={editPlan} onValueChange={(v) => setEditPlan(v as TenantPlan)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pilot">Pilot</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-seats">Seats</Label>
                <Input id="edit-seats" type="number" min={1} value={editSeats} onChange={(e) => setEditSeats(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-clinics">Clinics / sites</Label>
              <Input id="edit-clinics" type="number" min={1} value={editClinics} onChange={(e) => setEditClinics(e.target.value)} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-contact">Contact name</Label>
                <Input id="edit-contact" value={editContact} onChange={(e) => setEditContact(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="edit-email">Contact email</Label>
                <Input id="edit-email" type="email" value={editContactEmail} onChange={(e) => setEditContactEmail(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add user */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>Create a new user account in {tenant.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="new-name">Full name</Label>
              <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Dr. Jane Smith" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@clinic.org" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org_admin">Org Admin</SelectItem>
                    <SelectItem value="specialist">Specialist</SelectItem>
                    <SelectItem value="clinician">Clinician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-title">Title (optional)</Label>
                <Input id="new-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Dermatologist" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="new-password">Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddUser}
              disabled={addingUser || !newName.trim() || !newEmail.trim().includes("@") || newPassword.length < 6}
            >
              {addingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete org confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete organization</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{tenant.name}</strong> and all its users, patients,
              cases, and data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-mono font-bold">{tenant.name}</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={tenant.name}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={deleteTenant}
              disabled={deleting || deleteConfirm !== tenant.name}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatTile({
  label, value, icon: Icon, color,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted", color)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}
