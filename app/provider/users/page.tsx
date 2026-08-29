"use client"

import { useMemo, useState } from "react"
import { Search, Users, UserCog, Stethoscope, Activity } from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import type { UserRole } from "@/lib/types"

const ROLE_LABEL: Record<string, string> = {
  org_admin: "Org Admin", specialist: "Specialist",
  clinician: "Clinician", platform_admin: "Platform Admin",
}
const ROLE_FILTERS: { key: UserRole | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "org_admin", label: "Org Admins" },
  { key: "specialist", label: "Specialists" },
  { key: "clinician", label: "Clinicians" },
]

export default function AllUsersPage() {
  const { db } = useData()
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")

  const tenantMap = useMemo(
    () => Object.fromEntries(db.tenants.map((t) => [t.id, t])),
    [db.tenants],
  )

  const users = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.users
      .filter((u) => u.role !== "platform_admin")
      .filter((u) => roleFilter === "all" || u.role === roleFilter)
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (tenantMap[u.tenantId ?? ""]?.name ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [db.users, roleFilter, query, tenantMap])

  return (
    <div>
      <PageHeader
        title="All users"
        description="Every user across all tenant organizations"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or organization…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                roleFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No users match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => {
              const tenant = tenantMap[u.tenantId ?? ""]
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
                  <div className="hidden text-xs text-muted-foreground sm:block">
                    {tenant?.name ?? "—"}
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    u.status === "active" ? "bg-success/15 text-success"
                    : u.status === "invited" ? "bg-warning/15 text-warning-foreground"
                    : "bg-muted text-muted-foreground",
                  )}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {formatDate(u.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
