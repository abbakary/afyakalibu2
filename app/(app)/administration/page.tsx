"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Users,
  Building2,
  Armchair,
  MapPin,
  Mail,
  UserPlus,
  Settings,
  ExternalLink,
  MoreHorizontal,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react"
import { toast } from "sonner"
import { useData } from "@/lib/data-store"
import { apiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, initials, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { User, UserRole } from "@/lib/types"

const ROLE_LABEL: Record<UserRole, string> = {
  platform_admin: "Platform Admin",
  org_admin: "Org Admin",
  specialist: "Specialist",
  clinician: "Clinician",
}

const PLAN_LABEL: Record<string, string> = {
  pilot: "Pilot",
  growth: "Growth",
  enterprise: "Enterprise",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  invited: "secondary",
  disabled: "destructive",
}

export default function AdministrationPage() {
  const {
    users,
    activeTenant,
    currentUser,
    isPlatformAdmin,
    cases,
    patients,
    addUser,
    updateUser,
  } = useData()
  const [showInvite, setShowInvite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetUserId, setResetUserId] = useState<string | null>(null)

  const canManage = currentUser.role === "org_admin" || currentUser.role === "platform_admin"

  const seatPct = activeTenant ? Math.round((activeTenant.usedSeats / activeTenant.seats) * 100) : 0

  const roleCounts = useMemo(() => {
    const counts: Partial<Record<UserRole, number>> = {}
    for (const u of users) counts[u.role] = (counts[u.role] ?? 0) + 1
    return counts
  }, [users])

  if (!activeTenant && !isPlatformAdmin) {
    return (
      <div>
        <PageHeader title="Administration" description="Organization settings and team management" />
        <Card className="p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No organization selected</p>
          <p className="mt-1 text-sm text-muted-foreground">Select an organization from the top bar to manage its settings.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Manage your organization, team members, and workspace settings"
        actions={
          <>
            {isPlatformAdmin && (
              <Link href="/provider" className={cn(buttonVariants({ variant: "outline" }))}>
                <ExternalLink className="h-4 w-4" /> Platform console
              </Link>
            )}
            {canManage && (
              <Button onClick={() => setShowInvite((v) => !v)}>
                <UserPlus className="h-4 w-4" /> {showInvite ? "Cancel" : "Create member"}
              </Button>
            )}
          </>
        }
      />

      {activeTenant && (
        <>
          {/* Org header card */}
          <Card className="overflow-hidden">
            <div
              className="h-2"
              style={{ backgroundColor: activeTenant.primaryColor }}
            />
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
                  style={{ backgroundColor: activeTenant.primaryColor }}
                >
                  {activeTenant.region.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold">{activeTenant.name}</h2>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {activeTenant.region}, {activeTenant.country}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{PLAN_LABEL[activeTenant.plan] ?? activeTenant.plan}</Badge>
                    <Badge variant={activeTenant.status === "active" ? "default" : "secondary"}>
                      {activeTenant.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{activeTenant.clinics} clinic sites</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Primary contact</p>
                <p className="font-medium">{activeTenant.contactName}</p>
                <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {activeTenant.contactEmail}
                </p>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Team members" value={users.length} icon={Users} tone="primary" />
            <StatCard label="Seat utilization" value={`${seatPct}%`} icon={Armchair} tone={seatPct > 85 ? "warning" : "default"} />
            <StatCard label="Active cases" value={cases.filter((c) => c.status !== "closed").length} icon={ShieldCheck} />
            <StatCard label="Patients" value={patients.length} icon={Building2} tone="success" />
          </div>
        </>
      )}

      {showInvite && canManage && activeTenant && (
        <CreateMemberForm
          tenantId={activeTenant.id}
          primaryColor={activeTenant.primaryColor}
          saving={saving}
          onCancel={() => setShowInvite(false)}
          onSave={async (data, password) => {
            setSaving(true)
            try {
              const user = await addUser(data, password)
              toast.success(`${user.name} created`, {
                description: `They can log in with ${user.email} immediately.`,
              })
              setShowInvite(false)
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed to create member")
            } finally {
              setSaving(false)
            }
          }}
        />
      )}

      {resetUserId && (
        <ResetPasswordForm
          userId={resetUserId}
          userName={users.find((u) => u.id === resetUserId)?.name ?? ""}
          onClose={() => setResetUserId(null)}
        />
      )}

      <Tabs defaultValue="team" className="mt-6">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="seats">Seats & usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="font-heading text-base font-semibold">Team members</h3>
                <p className="text-xs text-muted-foreground">
                  {roleCounts.specialist ?? 0} specialists · {roleCounts.clinician ?? 0} clinicians · {roleCounts.org_admin ?? 0} admins
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Last active</TableHead>
                  {canManage && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback style={{ backgroundColor: user.avatarColor }} className="text-xs font-semibold text-white">
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ROLE_LABEL[user.role]}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{user.title ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[user.status] ?? "outline"}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">{user.lastActive ? timeAgo(user.lastActive) : "—"}</span>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {user.id !== currentUser.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}>
                                <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setResetUserId(user.id)}>
                                <KeyRound className="mr-2 h-3.5 w-3.5" /> Reset password
                              </DropdownMenuItem>
                              {user.status !== "active" && (
                                <DropdownMenuItem onClick={() => { updateUser(user.id, { status: "active" }); toast.success("Member activated") }}>
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {user.status === "active" && (
                                <DropdownMenuItem onClick={() => { updateUser(user.id, { status: "disabled" }); toast.success("Member disabled") }}>
                                  Disable
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="seats" className="mt-4">
          {activeTenant && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="font-heading text-base font-semibold">Seat allocation</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeTenant.usedSeats} of {activeTenant.seats} seats in use across your organization
                </p>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{seatPct}% utilized</span>
                    <span className="text-muted-foreground">{activeTenant.seats - activeTenant.usedSeats} available</span>
                  </div>
                  <Progress value={seatPct} className="h-2.5" />
                </div>
                {seatPct > 85 && (
                  <p className="mt-4 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
                    You're approaching your seat limit. Contact SkinLink to upgrade your plan.
                  </p>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="font-heading text-base font-semibold">Usage by role</h3>
                <ul className="mt-4 space-y-3">
                  {(["org_admin", "specialist", "clinician"] as UserRole[]).map((role) => (
                    <li key={role} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{ROLE_LABEL[role]}</span>
                      <span className="font-semibold">{roleCounts[role] ?? 0}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Clinic sites</span>
                    <span className="font-semibold">{activeTenant.clinics}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-medium">Plan</span>
                    <Badge variant="outline">{PLAN_LABEL[activeTenant.plan]}</Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          {activeTenant && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <h3 className="font-heading text-base font-semibold">Organization profile</h3>
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <SettingRow label="Organization name" value={activeTenant.name} />
                  <SettingRow label="Region" value={`${activeTenant.region}, ${activeTenant.country}`} />
                  <SettingRow label="Slug" value={activeTenant.slug} mono />
                  <SettingRow label="Contact" value={activeTenant.contactName} />
                  <SettingRow label="Email" value={activeTenant.contactEmail} />
                  <SettingRow label="Created" value={formatDate(activeTenant.createdAt)} />
                </dl>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-heading text-base font-semibold">Security & compliance</h3>
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  <SecurityItem label="Tenant data isolation" status="Enabled" />
                  <SecurityItem label="Patient consent tracking" status="Enabled" />
                  <SecurityItem label="Audit logging" status="Enabled" />
                  <SecurityItem label="Two-factor authentication" status="Coming soon" muted />
                </ul>
                {!canManage && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Contact your organization administrator to change settings.
                  </p>
                )}
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SettingRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium text-right", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  )
}

function SecurityItem({ label, status, muted }: { label: string; status: string; muted?: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={muted ? "outline" : "secondary"} className="text-[11px]">
        {status}
      </Badge>
    </li>
  )
}

function CreateMemberForm({
  tenantId,
  primaryColor,
  saving,
  onCancel,
  onSave,
}: {
  tenantId: string
  primaryColor: string
  saving: boolean
  onCancel: () => void
  onSave: (data: Omit<User, "id" | "createdAt" | "lastActive">, password: string) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [role, setRole] = useState<UserRole>("clinician")
  const [title, setTitle] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [phone, setPhone] = useState("")

  const valid =
    name.trim().length > 0 &&
    email.trim().includes("@") &&
    password.length >= 6

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onSave(
      {
        tenantId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        title: title.trim() || undefined,
        specialty: specialty.trim() || undefined,
        phone: phone.trim() || undefined,
        status: "active",
        avatarColor: primaryColor,
      },
      password,
    )
  }

  return (
    <Card className="mt-6 p-5">
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold">Create team member</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The account is created immediately and the member can log in with these credentials right away — on both the web app and the mobile app.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <Label htmlFor="cm-name">Full name <span className="text-destructive">*</span></Label>
          <Input
            id="cm-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
            placeholder="Dr. Jane Doe"
            required
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="cm-email">Email address <span className="text-destructive">*</span></Label>
          <Input
            id="cm-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            placeholder="jane@clinic.org"
            required
          />
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="cm-password">Password <span className="text-destructive">*</span></Label>
          <div className="relative mt-1.5">
            <Input
              id="cm-password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {password.length > 0 && password.length < 6 && (
            <p className="mt-1 text-xs text-destructive">Password must be at least 6 characters</p>
          )}
        </div>

        {/* Role */}
        <div>
          <Label>Role <span className="text-destructive">*</span></Label>
          <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clinician">Clinician</SelectItem>
              <SelectItem value="specialist">Specialist</SelectItem>
              <SelectItem value="org_admin">Org Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="cm-title">Job title</Label>
          <Input
            id="cm-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5"
            placeholder="e.g. Community Health Worker"
          />
        </div>

        {/* Specialty */}
        <div>
          <Label htmlFor="cm-specialty">Specialty</Label>
          <Input
            id="cm-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1.5"
            placeholder="e.g. General Dermatology"
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="cm-phone">Phone number</Label>
          <Input
            id="cm-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5"
            placeholder="+255 7XX XXX XXX"
          />
        </div>

        {/* Hint */}
        <div className="sm:col-span-2 rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
          <strong className="font-medium text-foreground">Login credentials</strong> — share the email and password
          with the member. They can use these to log in on the web app at{" "}
          <span className="font-mono">app.skinlink.health</span> and the mobile app immediately.
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={!valid || saving}>
            {saving ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Creating…</>
            ) : (
              <><UserPlus className="h-4 w-4" /> Create account</>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

function ResetPasswordForm({
  userId,
  userName,
  onClose,
}: {
  userId: string
  userName: string
  onClose: () => void
}) {
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) return
    setSaving(true)
    try {
      await apiFetch(`/users/${userId}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password }),
      })
      toast.success(`Password updated for ${userName}`, {
        description: "They can now log in with the new password on web and mobile.",
      })
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password reset failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mt-6 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Reset password
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Set a new password for <strong>{userName}</strong>. They can use it to log in immediately on web and mobile.
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="rp-password">New password</Label>
          <div className="relative mt-1.5">
            <Input
              id="rp-password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPwd ? "Hide" : "Show"}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && password.length < 6 && (
            <p className="mt-1 text-xs text-destructive">At least 6 characters required</p>
          )}
        </div>
        <Button type="submit" disabled={password.length < 6 || saving}>
          {saving ? "Saving…" : "Update password"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
      </form>
    </Card>
  )
}
