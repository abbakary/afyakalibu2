/**
 * SkinLink Global Package Catalogue — single source of truth.
 *
 * This file is the ONLY place where package names, amounts, and metadata are
 * defined. Every surface that shows or accepts package data (landing page,
 * register form, subscriptions management) must import from here.
 *
 * Currency: Tanzanian Shilling (TZS). Amounts are monthly base prices.
 */

export type PackageForType = "org" | "solo" | "nurse"
export type BillingCycle = "monthly" | "quarterly" | "annually"

export interface SkinLinkPackage {
  /** Canonical package name — stored in the database. Never change this. */
  name: string
  /** Base monthly amount in TZS */
  amount: number
  /** Default billing cycle */
  billingCycle: BillingCycle
  /** Short badge label shown on cards */
  badge: string
  /** Tailwind classes for the badge pill */
  badgeColor: string
  /** One-line description shown on cards */
  desc: string
  /** Account types this package is offered to */
  forTypes: PackageForType[]
  /** Feature bullet points shown on landing/register */
  features: string[]
  /** Seats included */
  seats: string
  /** Whether this is the highlighted/recommended plan on public pages */
  highlight?: boolean
}

export const SKINLINK_PACKAGES: SkinLinkPackage[] = [
  {
    name: "Village Nurse Basic",
    amount: 80_000,
    billingCycle: "monthly",
    badge: "Starter",
    badgeColor: "bg-slate-100 text-slate-700",
    desc: "Wafanyakazi wa afya wa mstari wa mbele · TZS 80,000/mwezi",
    forTypes: ["nurse", "org"],
    seats: "Hadi watumiaji 5",
    features: [
      "Workspace moja ya shirika",
      "Viti 5 — wataalam na matabibu",
      "Ukaguzi wa ubora wa picha (AI)",
      "Tathmini ya kimsingi ya AI",
      "Msaada wa barua pepe",
    ],
  },
  {
    name: "Solo Pro Specialist",
    amount: 350_000,
    billingCycle: "monthly",
    badge: "Individual",
    badgeColor: "bg-teal-100 text-teal-700",
    desc: "Daktari wa ngozi binafsi · TZS 350,000/mwezi",
    forTypes: ["solo"],
    seats: "Hadi watumiaji 5",
    features: [
      "Workspace ya kibinafsi ya mtaalamu",
      "Viti 5 kwa wafanyakazi wa kliniki",
      "Tathmini kamili ya ngozi ya AI",
      "Msaada wa kipaumbele",
      "Ripoti za ukaguzi wa kesi",
    ],
  },
  {
    name: "Rural Clinic Hub",
    amount: 250_000,
    billingCycle: "monthly",
    badge: "Popular",
    badgeColor: "bg-emerald-100 text-emerald-700",
    desc: "Hadi wafanyakazi wa afya 5 · TZS 250,000/mwezi",
    forTypes: ["org"],
    seats: "Hadi watumiaji 20",
    highlight: true,
    features: [
      "Workspace moja ya shirika",
      "Viti 20 kwa majukumu yote",
      "Tathmini kamili ya ngozi ya AI",
      "Ripoti za ukaguzi na utawala",
      "Mtiririko wa rufaa uliobinafsishwa",
      "Msaada wa kipaumbele",
    ],
  },
  {
    name: "Regional Hospital",
    amount: 600_000,
    billingCycle: "monthly",
    badge: "Pro",
    badgeColor: "bg-indigo-100 text-indigo-700",
    desc: "Wafanyakazi wasio na kikomo & SLA ya kipaumbele · TZS 600,000/mwezi",
    forTypes: ["org"],
    seats: "Hadi watumiaji 100",
    features: [
      "Workspace moja ya shirika",
      "Viti 100 kwa majukumu yote",
      "Tathmini kamili ya AI + kipaumbele",
      "SLA ya kuitikia ndani ya masaa 4",
      "Ripoti na analytics za kina",
      "Mafunzo ya mtumiaji & onboarding",
    ],
  },
  {
    name: "Enterprise System",
    amount: 1_200_000,
    billingCycle: "monthly",
    badge: "Enterprise",
    badgeColor: "bg-rose-100 text-rose-700",
    desc: "SLA iliyotengwa & vipengele vya kibinafsi · TZS 1,200,000/mwezi",
    forTypes: ["org"],
    seats: "Watumiaji wasio na kikomo",
    features: [
      "Mashirika mengi / kliniki nyingi",
      "SLA iliyotengwa & dhamana ya uptime",
      "Nembo nyeupe & branding ya kibinafsi",
      "Toleo la kibinafsi (dedicated instance)",
      "Msimamizi wa akaunti aliyejitolea",
      "Mafunzo ya ndani na usaidizi wa haraka",
    ],
  },
]

/** Lookup a package by its canonical name. Returns undefined if not found. */
export function getPackageByName(name: string): SkinLinkPackage | undefined {
  return SKINLINK_PACKAGES.find(p => p.name === name)
}

/** Filter packages for a given account type. */
export function packagesForType(type: PackageForType): SkinLinkPackage[] {
  return SKINLINK_PACKAGES.filter(p => p.forTypes.includes(type))
}

/** Format a TZS amount for display: 250000 → "TZS 250,000" */
export function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString("en-TZ")}`
}

/**
 * Billing cycle multiplier for displaying annual/quarterly savings.
 * monthly=1, quarterly=3, annually=12 (months in the cycle).
 */
export const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  annually: 12,
}

/** Calculate the total amount for a given cycle (monthly * months in cycle). */
export function cycleTotalAmount(pkg: SkinLinkPackage, cycle: BillingCycle): number {
  return pkg.amount * BILLING_CYCLE_MONTHS[cycle]
}
