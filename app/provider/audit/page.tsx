"use client"

import { ShieldCheck, Lock, Eye, Clock } from "lucide-react"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"

export default function AuditPage() {
  return (
    <div>
      <PageHeader
        title="Audit & security"
        description="Platform-level audit log and security controls"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <ShieldCheck className="h-12 w-12 text-primary opacity-40" />
          <div>
            <p className="font-heading font-semibold">Audit trail</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Per-tenant AI assessment logs, specialist decisions, and case activity are recorded
              and available on each organization's detail page under the case audit trail endpoint.
            </p>
          </div>
        </Card>
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <Lock className="h-12 w-12 text-primary opacity-40" />
          <div>
            <p className="font-heading font-semibold">Security controls</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Role-based access, JWT authentication, per-tenant data isolation, and CORS policies
              are enforced at the API layer. No cross-tenant data access is possible.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
