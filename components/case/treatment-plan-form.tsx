"use client"

import { useState } from "react"
import { Plus, X, Pill } from "lucide-react"
import type { TreatmentPlan } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type DraftPlan = Omit<TreatmentPlan, "id" | "createdById" | "createdAt">

export function TreatmentPlanForm({
  initial,
  suggestedDiagnosis,
  onSave,
}: {
  initial?: TreatmentPlan
  suggestedDiagnosis?: string
  onSave: (plan: DraftPlan) => void
}) {
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? suggestedDiagnosis ?? "")
  const [medications, setMedications] = useState<{ name: string; instructions: string }[]>(
    initial?.medications ?? [{ name: "", instructions: "" }],
  )
  const [education, setEducation] = useState<string[]>(initial?.patientEducation ?? [""])
  const [triggers, setTriggers] = useState<string[]>(initial?.avoidTriggers ?? [""])
  const [followUpDays, setFollowUpDays] = useState(initial?.followUpDays ?? 14)
  const [notes, setNotes] = useState(initial?.notes ?? "")

  const submit = () => {
    onSave({
      diagnosis: diagnosis.trim(),
      medications: medications.filter((m) => m.name.trim()),
      patientEducation: education.map((e) => e.trim()).filter(Boolean),
      avoidTriggers: triggers.map((t) => t.trim()).filter(Boolean),
      followUpDays,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="dx">Diagnosis / clinical impression</Label>
        <Input id="dx" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Atopic Dermatitis" className="mt-1.5" />
      </div>

      {/* Medications */}
      <div>
        <Label>Recommended treatment</Label>
        <div className="mt-1.5 space-y-2">
          {medications.map((m, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <Input
                  value={m.name}
                  onChange={(e) =>
                    setMedications((rows) => rows.map((r, ri) => (ri === i ? { ...r, name: e.target.value } : r)))
                  }
                  placeholder="Medication / therapy"
                />
                <Input
                  value={m.instructions}
                  onChange={(e) =>
                    setMedications((rows) => rows.map((r, ri) => (ri === i ? { ...r, instructions: e.target.value } : r)))
                  }
                  placeholder="Dose & instructions (e.g. bd for 7–14 days)"
                />
              </div>
              {medications.length > 1 && (
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setMedications((r) => r.filter((_, ri) => ri !== i))} aria-label="Remove medication">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setMedications((r) => [...r, { name: "", instructions: "" }])}>
            <Plus className="h-4 w-4" /> Add medication
          </Button>
        </div>
      </div>

      <ListEditor label="Patient education" items={education} setItems={setEducation} placeholder="e.g. Apply emollient after bathing" />
      <ListEditor label="Avoid / triggers" items={triggers} setItems={setTriggers} placeholder="e.g. Fragrances, harsh soaps" />

      <div>
        <Label htmlFor="fu">Suggested follow-up (days)</Label>
        <Input id="fu" type="number" min={0} value={followUpDays} onChange={(e) => setFollowUpDays(Number(e.target.value) || 0)} className="mt-1.5 w-32" />
      </div>

      <div>
        <Label htmlFor="tnotes">Safety-net advice / notes</Label>
        <Textarea id="tnotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="When to return urgently, expected course…" className="mt-1.5" rows={2} />
      </div>

      <Button className="w-full" onClick={submit} disabled={!diagnosis.trim()}>
        <Pill className="h-4 w-4" /> {initial ? "Update treatment plan" : "Save & send to clinic"}
      </Button>
    </div>
  )
}

function ListEditor({
  label,
  items,
  setItems,
  placeholder,
}: {
  label: string
  items: string[]
  setItems: React.Dispatch<React.SetStateAction<string[]>>
  placeholder: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={item} onChange={(e) => setItems((r) => r.map((x, ri) => (ri === i ? e.target.value : x)))} placeholder={placeholder} />
            {items.length > 1 && (
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setItems((r) => r.filter((_, ri) => ri !== i))} aria-label={`Remove ${label}`}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setItems((r) => [...r, ""])}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  )
}
