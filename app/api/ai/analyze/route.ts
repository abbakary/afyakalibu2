import { type NextRequest, NextResponse } from "next/server"
import type { AiAnalysis } from "@/lib/types"

// ---------------------------------------------------------------------------
// AI analysis proxy — forwards to FastAPI /api/v1/ai/skin-assessment.
// No mock / knowledge-base fallback: failures are returned to the client.
// ---------------------------------------------------------------------------

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "")

interface AnalyzeBody {
  caseId?: string
  primaryConcern?: string
  clinicalInfo?: string
  suspectedCondition?: string
  durationDays?: number
  images?: { url: string; angle?: string }[]
  _token?: string
}

function likelihoodToProbability(likelihood: string, provided?: number | null): number {
  if (provided != null && provided >= 0) return provided
  switch (likelihood) {
    case "highly_likely": return 88
    case "probable":      return 70
    case "possible":      return 45
    case "unlikely":      return 15
    default:              return 30
  }
}

function likelihoodToConfidence(likelihood: string, prob: number): "High" | "Moderate" | "Low" {
  if (prob >= 65) return "High"
  if (prob >= 40) return "Moderate"
  return "Low"
}

function urgencyToFlag(urgency: string): "routine" | "urgent" | "emergency" {
  if (urgency === "emergency" || urgency === "emergent") return "emergency"
  if (urgency === "urgent" || urgency === "prompt")      return "urgent"
  return "routine"
}

function normaliseBackendResponse(data: Record<string, unknown>, model: string): AiAnalysis {
  const iq = (data.image_quality ?? {}) as Record<string, unknown>
  const iqScore = typeof iq.score === "number" ? iq.score : 0
  const iqIssues: string[] = Array.isArray(iq.issues) ? (iq.issues as string[]) : []
  const iqRating = (iq.rating as string) ?? "acceptable"
  if (iqRating === "poor") {
    iqIssues.unshift("Image quality poor — retake recommended before assessment")
  }
  if (iq.focus === false)          iqIssues.push("Motion blur or out-of-focus detected")
  if (iq.lighting === false)       iqIssues.push("Uneven lighting or glare present")
  if (iq.lesion_visible === false) iqIssues.push("Lesion may be cropped or not fully visible")

  const rawConds = Array.isArray(data.possible_conditions)
    ? (data.possible_conditions as Array<Record<string, unknown>>)
    : []
  const differentials = rawConds.map((c) => {
    const prob = likelihoodToProbability(c.likelihood as string, c.probability as number | null)
    return {
      condition:  (c.condition  as string) ?? "Unknown",
      probability: prob,
      confidence:  likelihoodToConfidence(c.likelihood as string, prob),
      rationale:   (c.rationale as string) ?? "",
    }
  })

  const urgencyFlag = urgencyToFlag((data.urgency as string) ?? "routine")
  const redFlags = Array.isArray(data.detected_red_flags) ? (data.detected_red_flags as string[]) : []
  const missingInfo = Array.isArray(data.missing_information) ? (data.missing_information as string[]) : []
  const nextStep = (data.suggested_next_step as string) ?? "specialist_review"

  let recommendedAction = (data.recommended_action as string) ?? ""
  if (!recommendedAction) {
    if (urgencyFlag === "emergency") {
      recommendedAction = "⚠ Emergency — refer in-person immediately."
    } else if (urgencyFlag === "urgent") {
      recommendedAction = "Urgent specialist review required. Do not delay."
    } else {
      recommendedAction = "Suitable for teledermatology management. Specialist review recommended."
    }
    if (nextStep === "additional_images") {
      recommendedAction += " Additional well-lit images requested before full assessment."
    }
    if (redFlags.length > 0) {
      recommendedAction += ` Red flags: ${redFlags.join("; ")}.`
    }
    if (missingInfo.length > 0) {
      recommendedAction += ` Missing: ${missingInfo.join(", ")}.`
    }
  }

  const qualityFlags = [...iqIssues]
  if (redFlags.length > 0) {
    qualityFlags.push(...redFlags.map((f) => `🚩 Red flag: ${f}`))
  }

  return {
    imageQualityAverage: iqScore,
    imageQualityFlags:   qualityFlags,
    differentials,
    recommendedAction,
    urgencyFlag,
    generatedAt: (data.generated_at as string) ?? new Date().toISOString(),
    model:       (data.model as string) ?? model,
  }
}

function extractErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>
    const detail = d.detail
    if (typeof detail === "string") return detail
    if (detail && typeof detail === "object") {
      const obj = detail as Record<string, unknown>
      if (typeof obj.message === "string") return obj.message
      if (typeof obj.error === "string") return obj.error
    }
    if (typeof d.message === "string") return d.message
    if (typeof d.error === "string") return d.error
  }
  return `AI service error (${status})`
}

export async function POST(req: NextRequest) {
  let body: AnalyzeBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const token =
    body._token ??
    req.headers.get("x-skinlink-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null

  if (!token) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Sign in required to run AI assessment.",
      },
      { status: 401 },
    )
  }

  const { _token: _removed, ...forwardBody } = body
  const backendUrl = `${API_BASE}/api/v1/ai/skin-assessment`
  const backendPayload: Record<string, unknown> = {
    patient_age:        null,
    sex:                null,
    symptoms:           [],
    duration:           forwardBody.durationDays ? `${forwardBody.durationDays} days` : null,
    duration_days:      forwardBody.durationDays ?? null,
    body_site:          null,
    severity:           null,
    previous_treatment: null,
    treatment_response: null,
    adherence:          null,
    red_flags:          [],
    primary_concern:    forwardBody.primaryConcern ?? null,
    clinical_info:      forwardBody.clinicalInfo ?? null,
    case_id:            forwardBody.caseId ?? null,
    images: (forwardBody.images ?? []).map((img) => ({
      url:   img.url,
      angle: img.angle ?? null,
    })),
    image_urls: (forwardBody.images ?? []).map((img) => img.url),
  }

  let backendRes: Response
  try {
    backendRes = await fetch(backendUrl, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(backendPayload),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backend unreachable"
    return NextResponse.json(
      {
        error: "backend_unreachable",
        message: `Cannot reach SkinLink API at ${API_BASE}. Start the backend and ensure it is configured. (${message})`,
      },
      { status: 503 },
    )
  }

  const raw = await backendRes.json().catch(() => ({}))
  if (!backendRes.ok) {
    return NextResponse.json(
      {
        error: "ai_failed",
        message: extractErrorMessage(raw, backendRes.status),
        detail: raw,
      },
      { status: backendRes.status },
    )
  }

  const data = raw as Record<string, unknown>
  const normalised = normaliseBackendResponse(
    data,
    (data.model as string) ?? "skinlink-ai",
  )
  return NextResponse.json(normalised)
}
