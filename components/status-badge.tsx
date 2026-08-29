import { cn } from "@/lib/utils"
import type {
  CaseStatus,
  CasePriority,
  ReferralStatus,
  FollowUpStatus,
  TenantStatus,
  ConfidenceLevel,
} from "@/lib/types"

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  )
}

const dot = "h-1.5 w-1.5 rounded-full"

const unknownStyle = { label: "Unknown", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" }

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const map: Record<CaseStatus, { label: string; cls: string; dot: string }> = {
    new: { label: "New", cls: "bg-info/10 text-info", dot: "bg-info" },
    in_review: { label: "In review", cls: "bg-warning/15 text-warning-foreground", dot: "bg-warning" },
    reviewed: { label: "Reviewed", cls: "bg-success/12 text-success", dot: "bg-success" },
    follow_up: { label: "Follow-up", cls: "bg-primary/10 text-primary", dot: "bg-primary" },
    closed: { label: "Closed", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  }
  const s = map[status] ?? unknownStyle
  return (
    <Pill className={s.cls}>
      <span className={cn(dot, s.dot)} />
      {s.label}
    </Pill>
  )
}

export function PriorityBadge({ priority }: { priority: CasePriority }) {
  const map: Record<CasePriority, { label: string; cls: string }> = {
    routine: { label: "Routine", cls: "bg-muted text-muted-foreground" },
    urgent: { label: "Urgent", cls: "bg-warning/15 text-warning-foreground" },
    emergency: { label: "Emergency", cls: "bg-destructive/12 text-destructive" },
  }
  const s = map[priority] ?? { label: String(priority ?? "Unknown"), cls: unknownStyle.cls }
  return <Pill className={s.cls}>{s.label}</Pill>
}

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const map: Record<ReferralStatus, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-info/10 text-info" },
    accepted: { label: "Accepted", cls: "bg-primary/10 text-primary" },
    responded: { label: "Responded", cls: "bg-success/12 text-success" },
    declined: { label: "Declined", cls: "bg-destructive/12 text-destructive" },
  }
  const s = map[status] ?? { label: String(status ?? "Unknown"), cls: unknownStyle.cls }
  return <Pill className={s.cls}>{s.label}</Pill>
}

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  const map: Record<FollowUpStatus, { label: string; cls: string }> = {
    scheduled: { label: "Scheduled", cls: "bg-info/10 text-info" },
    due: { label: "Due today", cls: "bg-warning/15 text-warning-foreground" },
    overdue: { label: "Overdue", cls: "bg-destructive/12 text-destructive" },
    completed: { label: "Completed", cls: "bg-success/12 text-success" },
  }
  const s = map[status] ?? { label: String(status ?? "Unknown"), cls: unknownStyle.cls }
  return <Pill className={s.cls}>{s.label}</Pill>
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const map: Record<TenantStatus, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-success/12 text-success" },
    trial: { label: "Trial", cls: "bg-info/10 text-info" },
    suspended: { label: "Suspended", cls: "bg-destructive/12 text-destructive" },
    pending: { label: "Pending", cls: "bg-warning/15 text-warning-foreground" },
  }
  const s = map[status] ?? { label: String(status ?? "Unknown"), cls: unknownStyle.cls }
  return <Pill className={s.cls}>{s.label}</Pill>
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const map: Record<ConfidenceLevel, { cls: string }> = {
    High: { cls: "bg-success/12 text-success" },
    Moderate: { cls: "bg-warning/15 text-warning-foreground" },
    Low: { cls: "bg-muted text-muted-foreground" },
  }
  const s = map[level] ?? { cls: unknownStyle.cls }
  const dotColor = level === "High" ? "bg-success" : level === "Moderate" ? "bg-warning" : "bg-muted-foreground"
  return (
    <Pill className={s.cls}>
      <span className={cn(dot, dotColor)} />
      {level ?? "Unknown"}
    </Pill>
  )
}
