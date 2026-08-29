/**
 * SkinLink REST API client for the Next.js web app.
 * Set NEXT_PUBLIC_API_URL=http://localhost:8000 to point at the FastAPI backend.
 */

import type {
  DermCase,
  FollowUp,
  Patient,
  Referral,
  Resource,
  Tenant,
  User,
} from "./types"

const rawApiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://skinlinkbackendapp-production.up.railway.app"
const API_BASE = rawApiBase.replace(/\/+$/, "")

export const TOKEN_KEY = "skinlink.token"
export const SESSION_KEY = "skinlink.session.v1"

let activeTenantId: string | null = null

export function isApiEnabled() {
  return API_BASE.length > 0
}

export function getApiBase() {
  return API_BASE
}

export function setApiTenantId(id: string | null) {
  activeTenantId = id
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function apiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE}/api/v1${cleanPath}`
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (activeTenantId) headers["X-Tenant-Id"] = activeTenantId

  const res = await fetch(apiUrl(path), { ...init, headers })
  if (!res.ok) {
    let msg = `API error ${res.status}`
    try {
      const body = await res.json()
      if (body.detail) {
        msg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail)
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(msg)
  }
  if (res.status === 204) return {} as T
  const text = await res.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

export async function apiHealth(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl("/health"))
    return res.ok
  } catch {
    return false
  }
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    let msg = "Login failed"
    try {
      const body = await res.json()
      if (body.detail) msg = body.detail
    } catch {
      // ignore
    }
    throw new Error(msg)
  }
  return res.json() as Promise<{
    access_token: string
    user: User
    tenant: Tenant | null
  }>
}

export async function apiMe() {
  return apiFetch<{ user: User; tenant: Tenant | null }>("/auth/me")
}

export async function apiGetTenants() {
  return apiFetch<Tenant[]>("/tenants")
}

export async function apiGetUsers() {
  return apiFetch<User[]>("/users")
}

export async function apiGetPatients() {
  return apiFetch<Patient[]>("/patients")
}

export async function apiGetCases() {
  return apiFetch<DermCase[]>("/cases")
}

export async function apiGetCase(id: string) {
  return apiFetch<DermCase>(`/cases/${id}`)
}

export async function apiGetReferrals() {
  return apiFetch<Referral[]>("/referrals")
}

export async function apiGetFollowUps() {
  return apiFetch<FollowUp[]>("/follow-ups")
}

export async function apiGetResources() {
  return apiFetch<Resource[]>("/resources")
}

export async function apiCreatePatient(body: Record<string, unknown>) {
  return apiFetch<Patient>("/patients", { method: "POST", body: JSON.stringify(body) })
}

export async function apiUpdatePatient(id: string, patch: Record<string, unknown>) {
  return apiFetch<Patient>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
}

export async function apiCreateCase(body: Record<string, unknown>) {
  return apiFetch<DermCase>("/cases", { method: "POST", body: JSON.stringify(body) })
}

export async function apiUpdateCase(id: string, patch: Record<string, unknown>) {
  return apiFetch<DermCase>(`/cases/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
}

export async function apiAddCaseNote(caseId: string, body: string) {
  return apiFetch<DermCase>(`/cases/${caseId}/notes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}

export async function apiCreateFollowUp(body: Record<string, unknown>) {
  return apiFetch<FollowUp>("/follow-ups", { method: "POST", body: JSON.stringify(body) })
}

export async function apiUpdateFollowUp(id: string, patch: Record<string, unknown>) {
  return apiFetch<FollowUp>(`/follow-ups/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
}

export async function apiCreateReferral(body: Record<string, unknown>) {
  return apiFetch<Referral>("/referrals", { method: "POST", body: JSON.stringify(body) })
}

export async function apiUpdateReferral(id: string, patch: Record<string, unknown>) {
  return apiFetch<Referral>(`/referrals/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
}

export async function apiCreateResource(body: Record<string, unknown>) {
  return apiFetch<Resource>("/resources", { method: "POST", body: JSON.stringify(body) })
}

export async function apiCreateUser(body: Record<string, unknown>) {
  return apiFetch<User>("/users", { method: "POST", body: JSON.stringify(body) })
}

export async function apiUpdateUser(id: string, patch: Record<string, unknown>) {
  return apiFetch<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
}

export async function apiUpdateTenant(id: string, patch: Record<string, unknown>) {
  return apiFetch<Tenant>(`/tenants/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
}

export async function apiCreateTenantAccount(body: Record<string, unknown>) {
  return apiFetch<{ tenant: Tenant; admin: User }>("/tenants", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function apiGetTenant(id: string) {
  return apiFetch<Tenant>(`/tenants/${id}`)
}

export async function apiDeleteTenant(id: string) {
  return apiFetch<void>(`/tenants/${id}`, { method: "DELETE" })
}

export async function apiDeleteUser(id: string) {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" })
}

export async function apiResetUserPassword(userId: string, password: string) {
  return apiFetch<void>(`/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  })
}

export interface PlatformStats {
  summary: {
    totalTenants: number
    activeTenants: number
    trialTenants: number
    suspendedTenants: number
    totalUsers: number
    totalPatients: number
    totalCases: number
    openCases: number
    totalReferrals: number
    totalSeats: number
    usedSeats: number
    seatUtilPct: number
  }
  casesByStatus: { status: string; count: number }[]
  casesByPriority: { priority: string; count: number }[]
  usersByRole: { role: string; count: number }[]
  tenantsByPlan: { plan: string; count: number }[]
  tenantsByStatus: { status: string; count: number }[]
  tenantBreakdown: {
    tenantId: string
    name: string
    plan: string
    status: string
    region: string
    country: string
    seats: number
    usedSeats: number
    seatUtilPct: number
    users: number
    patients: number
    cases: number
    referrals: number
    aiAssessments: number
    openCases: number
    createdAt: string
  }[]
  generatedAt: string
}

export async function apiGetPlatformStats() {
  return apiFetch<PlatformStats>("/stats/platform")
}

export interface ImageQualityResult {
  rating: "good" | "acceptable" | "poor"
  score: number
  issues: string[]
  focus: boolean
  lighting: boolean
  lesion_visible: boolean
  retake_required: boolean
}

export async function apiImageQualityCheck(
  imageUrl: string,
  angle?: string,
): Promise<ImageQualityResult> {
  const raw = await apiFetch<Record<string, unknown>>("/ai/image-quality-check", {
    method: "POST",
    body: JSON.stringify({ image_url: imageUrl, angle: angle ?? null, required_angles: [] }),
  })
  const iq = (raw.image_quality ?? raw) as Record<string, unknown>
  return {
    rating: (iq.rating as ImageQualityResult["rating"]) ?? "acceptable",
    score: typeof iq.score === "number" ? iq.score : 0,
    issues: Array.isArray(iq.issues) ? (iq.issues as string[]) : [],
    focus: iq.focus !== false,
    lighting: iq.lighting !== false,
    lesion_visible: iq.lesion_visible !== false,
    retake_required:
      raw.retake_required === true ||
      iq.rating === "poor" ||
      (typeof iq.score === "number" && iq.score < 60),
  }
}

export async function apiUploadImage(file: File): Promise<string> {
  const token = getToken()
  const form = new FormData()
  form.append("file", file)
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (activeTenantId) headers["X-Tenant-Id"] = activeTenantId

  const res = await fetch(`${API_BASE}/api/v1/cases/upload-image`, {
    method: "POST",
    headers,
    body: form,
  })
  if (!res.ok) throw new Error("Image upload failed")
  const data = (await res.json()) as { url: string }
  return `${API_BASE}${data.url}`
}

export async function apiUploadAccountDocument(file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`${API_BASE}/api/v1/applications/upload-document`, {
    method: "POST",
    body: form,
  })
  if (!res.ok) throw new Error("Document upload failed")
  const data = (await res.json()) as { url: string }
  return `${API_BASE}${data.url}`
}

// ---------------------------------------------------------------------------
// AI shape normalisation
// The backend stores the richer assessment shape (possible_conditions, urgency,
// image_quality etc.) under case.ai. The AiPanel component expects AiAnalysis.
// This utility bridges the two so cases fetched from the backend render
// correctly without requiring a second API round-trip.
// ---------------------------------------------------------------------------
import type { AiAnalysis } from "./types"

// Re-exported so callers don't need to import from types directly.
export type { AiAnalysis }

function _likelihoodToProb(likelihood: string, provided?: number | null): number {
  if (provided != null && provided >= 0) return provided
  switch (likelihood) {
    case "highly_likely": return 88
    case "probable": return 70
    case "possible": return 45
    case "unlikely": return 15
    default: return 30
  }
}

function _probToConfidence(p: number): "High" | "Moderate" | "Low" {
  return p >= 65 ? "High" : p >= 40 ? "Moderate" : "Low"
}

function _toUrgencyFlag(u: string): "routine" | "urgent" | "emergency" {
  if (u === "emergency" || u === "emergent") return "emergency"
  if (u === "urgent" || u === "prompt") return "urgent"
  return "routine"
}

/**
 * Accepts either an already-normalised AiAnalysis or a raw backend assessment
 * and always returns a properly shaped AiAnalysis ready for AiPanel.
 */
export function normaliseAiField(raw: unknown): AiAnalysis | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const r = raw as Record<string, unknown>

  // Already the frontend shape — imageQualityAverage is the tell-tale field
  if (typeof r.imageQualityAverage === "number") return raw as AiAnalysis

  // Backend shape — possible_conditions / urgency / image_quality
  const iq = (r.image_quality ?? {}) as Record<string, unknown>
  const iqScore = typeof iq.score === "number" ? iq.score : 70
  const iqIssues: string[] = Array.isArray(iq.issues) ? (iq.issues as string[]) : []
  if (iq.rating === "poor") iqIssues.unshift("Image quality poor — retake recommended")
  if (iq.focus === false) iqIssues.push("Motion blur or out-of-focus detected")
  if (iq.lighting === false) iqIssues.push("Uneven lighting or glare present")
  if (iq.lesion_visible === false) iqIssues.push("Lesion may be cropped or not fully visible")

  const rawConds = Array.isArray(r.possible_conditions)
    ? (r.possible_conditions as Array<Record<string, unknown>>)
    : []
  const differentials = rawConds.map((c) => {
    const prob = _likelihoodToProb(c.likelihood as string, c.probability as number | null)
    return {
      condition: (c.condition as string) ?? "Unknown",
      probability: prob,
      confidence: _probToConfidence(prob),
      rationale: (c.rationale as string) ?? "",
    }
  })

  const urgencyFlag = _toUrgencyFlag((r.urgency as string) ?? "routine")
  const redFlags = Array.isArray(r.detected_red_flags) ? (r.detected_red_flags as string[]) : []
  const missing = Array.isArray(r.missing_information) ? (r.missing_information as string[]) : []
  const nextStep = (r.suggested_next_step as string) ?? "specialist_review"

  let recommendedAction = ""
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
  if (redFlags.length > 0) recommendedAction += ` Red flags: ${redFlags.join("; ")}.`
  if (missing.length > 0) recommendedAction += ` Missing: ${missing.join(", ")}.`

  const qualityFlags = [...iqIssues, ...redFlags.map((f) => `🚩 Red flag: ${f}`)]

  return {
    imageQualityAverage: iqScore,
    imageQualityFlags: qualityFlags,
    differentials,
    recommendedAction,
    urgencyFlag,
    generatedAt: (r.generated_at as string) ?? new Date().toISOString(),
    model: (r.model as string) ?? "skinlink-ai",
  }
}
