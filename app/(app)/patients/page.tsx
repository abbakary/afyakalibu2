"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, MapPin, ChevronRight } from "lucide-react"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, ShieldCheck, ClipboardList } from "lucide-react"
import { formatDate, initials } from "@/lib/format"

export default function PatientsPage() {
  const router = useRouter()
  const { patients, cases } = useData()
  const [query, setQuery] = useState("")

  const casesByPatient = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of cases) map[c.patientId] = (map[c.patientId] ?? 0) + 1
    return map
  }, [cases])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return patients
      .filter((p) => !q || `${p.fullName} ${p.code} ${p.village}`.toLowerCase().includes(q))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [patients, query])

  const consented = patients.filter((p) => p.consentObtained).length

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Registered patients across your clinics"
        actions={
          <Button onClick={() => router.push("/patients/new")}>
            <Plus className="h-4 w-4" /> Register patient
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total patients" value={patients.length} icon={Users} tone="primary" />
        <StatCard label="With consent on file" value={consented} icon={ShieldCheck} tone="success" />
        <StatCard label="Total cases" value={cases.length} icon={ClipboardList} />
      </div>

      <div className="my-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, code or village…" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">No patients match your search.</Card>
      ) : (
        <Card className="divide-y divide-border">
          {filtered.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{initials(p.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{p.fullName}</p>
                  <span className="font-mono text-[11px] text-muted-foreground">{p.code}</span>
                </div>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {p.village}, {p.region} · {p.age}/{p.gender[0]}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{casesByPatient[p.id] ?? 0}</p>
                <p className="text-[11px] text-muted-foreground">cases</p>
              </div>
              <span className="hidden text-xs text-muted-foreground md:block">Registered {formatDate(p.createdAt)}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}
