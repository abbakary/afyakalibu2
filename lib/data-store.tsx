"use client"

import type React from "react"
import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react"
import {
  apiAddCaseNote,
  apiCreateCase,
  apiCreateFollowUp,
  apiCreatePatient,
  apiCreateResource,
  apiCreateTenantAccount,
  apiCreateUser,
  apiGetCases,
  apiGetFollowUps,
  apiGetPatients,
  apiGetReferrals,
  apiGetResources,
  apiGetTenants,
  apiGetUsers,
  apiLogin,
  apiMe,
  apiUpdateCase,
  apiUpdateFollowUp,
  apiUpdatePatient,
  apiUpdateReferral,
  apiUpdateTenant,
  apiUpdateUser,
  getToken,
  normaliseAiField,
  SESSION_KEY,
  setApiTenantId,
  setToken,
} from "./api-client"
import type {
  Database,
  Tenant,
  User,
  Patient,
  DermCase,
  Referral,
  FollowUp,
  Resource,
  ID,
  TenantPlan,
  ReferralStatus,
} from "./types"

interface Session {
  userId: ID | null
  activeTenantId: ID | null
}

export interface LoginResult {
  ok: boolean
  user?: User
  error?: string
}

export interface CreateTenantAccountInput {
  name: string
  region: string
  country: string
  plan: TenantPlan
  seats: number
  clinics: number
  primaryColor?: string
  admin: {
    name: string
    email: string
    password: string
    title?: string
    phone?: string
  }
}

interface DataContextValue {
  db: Database
  session: Session
  currentUser: User
  activeTenant: Tenant | null
  isPlatformAdmin: boolean
  isAuthenticated: boolean
  authReady: boolean
  loading: boolean
  apiError: string | null

  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  refresh: () => Promise<void>

  setActiveTenant: (tenantId: ID | null) => void

  tenants: Tenant[]
  users: User[]
  patients: Patient[]
  cases: DermCase[]
  referrals: Referral[]
  followUps: FollowUp[]
  resources: Resource[]

  getPatient: (id: ID) => Patient | undefined
  getCase: (id: ID) => DermCase | undefined
  getUser: (id: ID) => User | undefined
  getUserName: (id?: ID) => string

  addPatient: (p: Omit<Patient, "id" | "tenantId" | "code" | "createdAt">) => Promise<Patient>
  updatePatient: (id: ID, patch: Partial<Patient>) => Promise<void>
  addCase: (c: Omit<DermCase, "id" | "tenantId" | "createdAt" | "updatedAt" | "notes">) => Promise<DermCase>
  updateCase: (id: ID, patch: Partial<DermCase>) => Promise<void>
  addCaseNote: (caseId: ID, body: string) => Promise<void>
  addUser: (u: Omit<User, "id" | "createdAt" | "lastActive">, password?: string) => Promise<User>
  updateUser: (id: ID, patch: Partial<User>) => Promise<void>
  addTenant: (t: Omit<Tenant, "id" | "createdAt" | "usedSeats">) => Promise<Tenant>
  updateTenant: (id: ID, patch: Partial<Tenant>) => Promise<void>
  createTenantAccount: (input: CreateTenantAccountInput) => Promise<{ tenant: Tenant; admin: User }>
  updateFollowUp: (id: ID, patch: Partial<FollowUp>) => Promise<void>
  addFollowUp: (f: Omit<FollowUp, "id" | "tenantId">) => Promise<FollowUp>
  addReferral: (r: Omit<Referral, "id" | "tenantId" | "createdAt">) => Promise<Referral>
  updateReferral: (id: ID, patch: Partial<Referral>) => Promise<void>
  addResource: (r: Omit<Resource, "id" | "tenantId" | "updatedAt">) => Promise<Resource>
}

const DataContext = createContext<DataContextValue | null>(null)

const GUEST_USER: User = {
  id: "guest",
  tenantId: null,
  name: "Guest",
  email: "",
  role: "clinician",
  status: "active",
  avatarColor: "#64748b",
  lastActive: "",
  createdAt: "",
}

const EMPTY_DB: Database = {
  tenants: [],
  users: [],
  patients: [],
  cases: [],
  referrals: [],
  followUps: [],
  resources: [],
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(EMPTY_DB)
  const [session, setSession] = useState<Session>({ userId: null, activeTenantId: null })
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER)
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const isAuthenticated = currentUser.id !== "guest"
  const isPlatformAdmin = currentUser.role === "platform_admin"

  const fetchAll = useCallback(async (tenantId: ID | null) => {
    setApiTenantId(tenantId)
    const [tenants, users, patients, rawCases, referrals, followUps, resources] = await Promise.all([
      apiGetTenants(),
      apiGetUsers(),
      apiGetPatients(),
      apiGetCases(),
      apiGetReferrals(),
      apiGetFollowUps(),
      apiGetResources(),
    ])
    // Normalise the ai field on every case so AiPanel always gets the right shape
    const cases = rawCases.map((c) =>
      c.ai ? { ...c, ai: normaliseAiField(c.ai) } : c,
    ) as typeof rawCases
    setDb({ tenants, users, patients, cases, referrals, followUps, resources })
    if (tenantId) {
      setActiveTenantState(tenants.find((t) => t.id === tenantId) ?? null)
    } else {
      setActiveTenantState(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) return
    setLoading(true)
    setApiError(null)
    try {
      const me = await apiMe()
      setCurrentUser(me.user)
      const tenantId = session.activeTenantId ?? me.user.tenantId
      await fetchAll(tenantId)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [fetchAll, session.activeTenantId])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        const raw = localStorage.getItem(SESSION_KEY)
        const token = getToken()
        if (!raw || !token) {
          setHydrated(true)
          return
        }
        const parsed = JSON.parse(raw) as Session
        setSession(parsed)
        setApiTenantId(parsed.activeTenantId ?? null)
        const me = await apiMe()
        if (cancelled) return
        setCurrentUser(me.user)
        await fetchAll(parsed.activeTenantId ?? me.user.tenantId)
      } catch {
        setToken(null)
        localStorage.removeItem(SESSION_KEY)
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [fetchAll])

  useEffect(() => {
    if (!hydrated) return
    try {
      if (session.userId) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  }, [session, hydrated])

  const tenantId = session.activeTenantId

  const users = useMemo(
    () => (tenantId ? db.users.filter((u) => u.tenantId === tenantId) : db.users),
    [db.users, tenantId],
  )
  const patients = useMemo(
    () => (tenantId ? db.patients.filter((p) => p.tenantId === tenantId) : db.patients),
    [db.patients, tenantId],
  )
  const cases = useMemo(
    () => (tenantId ? db.cases.filter((c) => c.tenantId === tenantId) : db.cases),
    [db.cases, tenantId],
  )
  const referrals = useMemo(
    () => (tenantId ? db.referrals.filter((r) => r.tenantId === tenantId) : db.referrals),
    [db.referrals, tenantId],
  )
  const followUps = useMemo(
    () => (tenantId ? db.followUps.filter((f) => f.tenantId === tenantId) : db.followUps),
    [db.followUps, tenantId],
  )
  const resources = useMemo(
    () => (tenantId ? db.resources.filter((r) => r.tenantId === tenantId) : db.resources),
    [db.resources, tenantId],
  )

  const getPatient = useCallback((id: ID) => db.patients.find((p) => p.id === id), [db.patients])
  const getCase = useCallback((id: ID) => db.cases.find((c) => c.id === id), [db.cases])
  const getUser = useCallback((id: ID) => db.users.find((u) => u.id === id), [db.users])
  const getUserName = useCallback(
    (id?: ID) => (id ? (db.users.find((u) => u.id === id)?.name ?? "Unassigned") : "Unassigned"),
    [db.users],
  )

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const result = await apiLogin(email, password)
        setToken(result.access_token)
        setCurrentUser(result.user)
        const activeId = result.user.tenantId
        setSession({ userId: result.user.id, activeTenantId: activeId })
        setApiTenantId(activeId)
        await fetchAll(activeId)
        return { ok: true, user: result.user }
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Unable to sign in." }
      }
    },
    [fetchAll],
  )

  const logout = useCallback(() => {
    setToken(null)
    setSession({ userId: null, activeTenantId: null })
    setCurrentUser(GUEST_USER)
    setActiveTenantState(null)
    setDb(EMPTY_DB)
    setApiTenantId(null)
  }, [])

  const setActiveTenant = useCallback(
    (id: ID | null) => {
      setSession((s) => ({ ...s, activeTenantId: id }))
      setApiTenantId(id)
      fetchAll(id).catch((e) => setApiError(e instanceof Error ? e.message : "Failed to load data"))
    },
    [fetchAll],
  )

  const addPatient: DataContextValue["addPatient"] = useCallback(async (p) => {
    const patient = await apiCreatePatient(p as unknown as Record<string, unknown>)
    setDb((d) => ({ ...d, patients: [patient, ...d.patients] }))
    return patient
  }, [])

  const updatePatient: DataContextValue["updatePatient"] = useCallback(async (id, patch) => {
    const updated = await apiUpdatePatient(id, patch as Record<string, unknown>)
    setDb((d) => ({ ...d, patients: d.patients.map((p) => (p.id === id ? updated : p)) }))
  }, [])

  const addCase: DataContextValue["addCase"] = useCallback(async (c) => {
    const rawCase = await apiCreateCase({
      patientId: c.patientId,
      primaryConcern: c.primaryConcern,
      clinicalInfo: c.clinicalInfo,
      durationDays: c.durationDays,
      suspectedCondition: c.suspectedCondition,
      priority: c.priority,
      images: c.images,
      bodySite: c.bodySite,
      previousTreatment: c.previousTreatment,
      redFlags: c.redFlags,
    })
    // Backend returns { case, ai } — handle both shapes
    const dermCase = (rawCase as Record<string, unknown>).case
      ? (rawCase as Record<string, unknown>).case as DermCase
      : rawCase
    const normCase = (dermCase as DermCase).ai
      ? { ...(dermCase as DermCase), ai: normaliseAiField((dermCase as DermCase).ai) }
      : (dermCase as DermCase)
    const refs = await apiGetReferrals()
    setDb((d) => ({ ...d, cases: [normCase, ...d.cases], referrals: refs }))
    return normCase
  }, [])

  const updateCase: DataContextValue["updateCase"] = useCallback(async (id, patch) => {
    const rawUpdated = await apiUpdateCase(id, patch as Record<string, unknown>)
    // Normalise ai field in case the server returned a fresh backend-shape assessment
    const updated = rawUpdated.ai
      ? { ...rawUpdated, ai: normaliseAiField(rawUpdated.ai) }
      : rawUpdated
    setDb((d) => ({ ...d, cases: d.cases.map((c) => (c.id === id ? updated : c)) }))
    if (patch.status === "reviewed" || patch.treatmentPlan) {
      const refs = await apiGetReferrals()
      setDb((d) => ({ ...d, referrals: refs }))
    }
  }, [])

  const addCaseNote: DataContextValue["addCaseNote"] = useCallback(async (caseId, body) => {
    const updated = await apiAddCaseNote(caseId, body)
    setDb((d) => ({ ...d, cases: d.cases.map((c) => (c.id === caseId ? updated : c)) }))
  }, [])

  const addUser: DataContextValue["addUser"] = useCallback(async (u, password) => {
    const user = await apiCreateUser({
      tenantId: u.tenantId,
      name: u.name,
      email: u.email,
      role: u.role,
      password: password ?? "clinic123",
      title: u.title,
      specialty: u.specialty,
      phone: u.phone,
    })
    setDb((d) => ({ ...d, users: [user, ...d.users] }))
    return user
  }, [])

  const updateUser: DataContextValue["updateUser"] = useCallback(async (id, patch) => {
    const updated = await apiUpdateUser(id, patch as Record<string, unknown>)
    setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? updated : u)) }))
  }, [])

  const addTenant: DataContextValue["addTenant"] = useCallback(async (t) => {
    const result = await apiCreateTenantAccount({
      name: t.name,
      region: t.region,
      country: t.country,
      plan: t.plan,
      seats: t.seats,
      clinics: t.clinics,
      primaryColor: t.primaryColor,
      adminName: t.contactName,
      adminEmail: t.contactEmail,
      adminPassword: "clinic123",
    })
    setDb((d) => ({
      ...d,
      tenants: [result.tenant, ...d.tenants],
      users: [result.admin, ...d.users],
    }))
    return result.tenant
  }, [])

  const updateTenant: DataContextValue["updateTenant"] = useCallback(async (id, patch) => {
    const updated = await apiUpdateTenant(id, patch as Record<string, unknown>)
    setDb((d) => ({ ...d, tenants: d.tenants.map((t) => (t.id === id ? updated : t)) }))
    if (activeTenant?.id === id) setActiveTenantState(updated)
  }, [activeTenant?.id])

  const createTenantAccount: DataContextValue["createTenantAccount"] = useCallback(async (input) => {
    const result = await apiCreateTenantAccount({
      name: input.name,
      region: input.region,
      country: input.country,
      plan: input.plan,
      seats: input.seats,
      clinics: input.clinics,
      primaryColor: input.primaryColor,
      adminName: input.admin.name,
      adminEmail: input.admin.email,
      adminPassword: input.admin.password,
      adminTitle: input.admin.title,
      adminPhone: input.admin.phone,
    })
    setDb((d) => ({
      ...d,
      tenants: [result.tenant, ...d.tenants],
      users: [result.admin, ...d.users],
    }))
    return result
  }, [])

  const updateFollowUp: DataContextValue["updateFollowUp"] = useCallback(async (id, patch) => {
    const updated = await apiUpdateFollowUp(id, patch as Record<string, unknown>)
    setDb((d) => ({ ...d, followUps: d.followUps.map((f) => (f.id === id ? updated : f)) }))
  }, [])

  const addFollowUp: DataContextValue["addFollowUp"] = useCallback(async (f) => {
    const followUp = await apiCreateFollowUp(f as unknown as Record<string, unknown>)
    setDb((d) => ({ ...d, followUps: [followUp, ...d.followUps] }))
    return followUp
  }, [])

  const addReferral: DataContextValue["addReferral"] = useCallback(async (r) => {
    const referral = {
      id: `r_${Date.now()}`,
      tenantId: r.tenantId ?? tenantId ?? "",
      createdAt: new Date().toISOString(),
      ...r,
    } as Referral
    setDb((d) => ({ ...d, referrals: [referral, ...d.referrals] }))
    return referral
  }, [tenantId])

  const updateReferral: DataContextValue["updateReferral"] = useCallback(
    async (id, patch) => {
      const updated = await apiUpdateReferral(id, patch as Record<string, unknown>)
      setDb((d) => ({ ...d, referrals: d.referrals.map((r) => (r.id === id ? updated : r)) }))
    },
    [],
  )

  const addResource: DataContextValue["addResource"] = useCallback(async (r) => {
    const resource = await apiCreateResource(r as unknown as Record<string, unknown>)
    setDb((d) => ({ ...d, resources: [resource, ...d.resources] }))
    return resource
  }, [])

  const value: DataContextValue = {
    db,
    session,
    currentUser,
    activeTenant,
    isPlatformAdmin,
    isAuthenticated,
    authReady: hydrated,
    loading,
    apiError,
    login,
    logout,
    refresh,
    setActiveTenant,
    tenants: db.tenants,
    users,
    patients,
    cases,
    referrals,
    followUps,
    resources,
    getPatient,
    getCase,
    getUser,
    getUserName,
    addPatient,
    updatePatient,
    addCase,
    updateCase,
    addCaseNote,
    addUser,
    updateUser,
    addTenant,
    updateTenant,
    createTenantAccount,
    updateFollowUp,
    addFollowUp,
    addReferral,
    updateReferral,
    addResource,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}

export type { ReferralStatus }
