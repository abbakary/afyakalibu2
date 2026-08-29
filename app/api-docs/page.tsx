"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Code2, ChevronRight, Copy, Check, Key, Zap, Shield,
  Globe, BookOpen, Terminal, ArrowRight, ExternalLink,
  ChevronDown, AlertTriangle, CheckCircle2,
} from "lucide-react"
import { SkinLinkLogo } from "@/components/brand/logo"
import { cn } from "@/lib/utils"

// ── Code sample helpers ───────────────────────────────────────────────────────
type Lang = "curl" | "python" | "javascript" | "php"
const LANG_LABELS: Record<Lang, string> = { curl: "cURL", python: "Python", javascript: "JavaScript", php: "PHP" }

const SAMPLES: Record<string, Record<Lang, string>> = {
  auth: {
    curl: `curl -X GET https://api.skinlink.health/v1/cases \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    python: `import requests

headers = {
    "Authorization": "Bearer sk_live_YOUR_API_KEY",
    "Content-Type": "application/json"
}
response = requests.get(
    "https://api.skinlink.health/v1/cases",
    headers=headers
)
cases = response.json()
print(cases)`,
    javascript: `const response = await fetch(
  "https://api.skinlink.health/v1/cases",
  {
    headers: {
      "Authorization": "Bearer sk_live_YOUR_API_KEY",
      "Content-Type": "application/json"
    }
  }
);
const cases = await response.json();
console.log(cases);`,
    php: `<?php
$ch = curl_init("https://api.skinlink.health/v1/cases");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer sk_live_YOUR_API_KEY",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);
var_dump($data);`,
  },
  create_case: {
    curl: `curl -X POST https://api.skinlink.health/v1/cases/submit-referral \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "patient": {
      "fullName": "Fatuma Kweka",
      "age": 34,
      "gender": "Female",
      "village": "Mbuyuni",
      "region": "Mwanza",
      "consentObtained": true
    },
    "clinical": {
      "primaryConcern": "Persistent itchy rash on forearm",
      "durationDays": 14,
      "priority": "routine",
      "bodySite": "forearm"
    },
    "images": [
      {"url": "https://yourapp.com/images/img1.jpg", "angle": "Overview"},
      {"url": "https://yourapp.com/images/img2.jpg", "angle": "Close-up"}
    ]
  }'`,
    python: `import requests

payload = {
    "patient": {
        "fullName": "Fatuma Kweka",
        "age": 34,
        "gender": "Female",
        "village": "Mbuyuni",
        "region": "Mwanza",
        "consentObtained": True
    },
    "clinical": {
        "primaryConcern": "Persistent itchy rash on forearm",
        "durationDays": 14,
        "priority": "routine",
        "bodySite": "forearm"
    },
    "images": [
        {"url": "https://yourapp.com/images/img1.jpg", "angle": "Overview"},
        {"url": "https://yourapp.com/images/img2.jpg", "angle": "Close-up"}
    ]
}

response = requests.post(
    "https://api.skinlink.health/v1/cases/submit-referral",
    json=payload,
    headers={"Authorization": "Bearer sk_live_YOUR_API_KEY"}
)
result = response.json()
print("Case ref:", result["case"]["ref"])`,
    javascript: `const payload = {
  patient: {
    fullName: "Fatuma Kweka",
    age: 34,
    gender: "Female",
    village: "Mbuyuni",
    region: "Mwanza",
    consentObtained: true
  },
  clinical: {
    primaryConcern: "Persistent itchy rash on forearm",
    durationDays: 14,
    priority: "routine",
    bodySite: "forearm"
  },
  images: [
    { url: "https://yourapp.com/images/img1.jpg", angle: "Overview" },
    { url: "https://yourapp.com/images/img2.jpg", angle: "Close-up" }
  ]
};

const res = await fetch(
  "https://api.skinlink.health/v1/cases/submit-referral",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer sk_live_YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }
);
const { case: newCase } = await res.json();
console.log("Case ref:", newCase.ref);`,
    php: `<?php
$payload = [
    "patient" => [
        "fullName" => "Fatuma Kweka",
        "age" => 34,
        "gender" => "Female",
        "village" => "Mbuyuni",
        "region" => "Mwanza",
        "consentObtained" => true
    ],
    "clinical" => [
        "primaryConcern" => "Persistent itchy rash on forearm",
        "durationDays" => 14,
        "priority" => "routine"
    ],
    "images" => [
        ["url" => "https://yourapp.com/img1.jpg", "angle" => "Overview"]
    ]
];

$ch = curl_init("https://api.skinlink.health/v1/cases/submit-referral");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer sk_live_YOUR_API_KEY",
        "Content-Type: application/json"
    ],
    CURLOPT_RETURNTRANSFER => true,
]);
$result = json_decode(curl_exec($ch), true);
echo "Case ref: " . $result['case']['ref'];`,
  },
  webhook: {
    curl: `# Register a webhook endpoint
curl -X POST https://api.skinlink.health/v1/webhooks \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/webhooks/skinlink",
    "events": ["case.reviewed", "case.escalated", "ai.assessment_complete"],
    "secret": "your-webhook-signing-secret"
  }'`,
    python: `# Verify incoming webhook signature
import hmac, hashlib

def verify_webhook(payload_bytes: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

# In your Flask/FastAPI route:
# sig = request.headers.get("X-SkinLink-Signature")
# valid = verify_webhook(request.body, sig, "your-secret")`,
    javascript: `// Verify incoming webhook signature (Node.js/Express)
const crypto = require("crypto");

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(\`sha256=\${expected}\`),
    Buffer.from(signature)
  );
}

app.post("/webhooks/skinlink", express.raw({ type: "*/*" }), (req, res) => {
  const sig = req.headers["x-skinlink-signature"];
  if (!verifyWebhook(req.body, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid signature");
  }
  const event = JSON.parse(req.body);
  console.log("Event:", event.type, event.data);
  res.sendStatus(200);
});`,
    php: `<?php
// Verify incoming webhook
function verifyWebhook(string $payload, string $sig, string $secret): bool {
    $expected = "sha256=" . hash_hmac("sha256", $payload, $secret);
    return hash_equals($expected, $sig);
}

$payload = file_get_contents("php://input");
$sig = $_SERVER["HTTP_X_SKINLINK_SIGNATURE"] ?? "";
if (!verifyWebhook($payload, $sig, "your-secret")) {
    http_response_code(401);
    exit("Invalid signature");
}
$event = json_decode($payload, true);
echo "Event: " . $event["type"];`,
  },
}

// ── Endpoint definitions ──────────────────────────────────────────────────────
const ENDPOINTS = [
  {
    section: "Authentication",
    items: [
      { method: "GET", path: "/api/v1/auth/me", scope: "—", desc: "Verify your API key and return account info", plan: "All" },
    ],
  },
  {
    section: "Patients",
    items: [
      { method: "GET",   path: "/api/v1/patients",       scope: "patients:read",  desc: "List patients (paginated)",       plan: "Starter" },
      { method: "GET",   path: "/api/v1/patients/{id}",  scope: "patients:read",  desc: "Get a single patient record",     plan: "Starter" },
      { method: "POST",  path: "/api/v1/patients",       scope: "patients:write", desc: "Register a new patient",          plan: "Starter" },
      { method: "PATCH", path: "/api/v1/patients/{id}",  scope: "patients:write", desc: "Update patient demographics",     plan: "Starter" },
    ],
  },
  {
    section: "Cases",
    items: [
      { method: "GET",  path: "/api/v1/cases",                        scope: "cases:read",  desc: "List cases (filterable by status/priority)", plan: "Starter" },
      { method: "GET",  path: "/api/v1/cases/{id}",                   scope: "cases:read",  desc: "Get case detail with images and AI output",  plan: "Starter" },
      { method: "POST", path: "/api/v1/cases/submit-referral",        scope: "cases:write", desc: "Submit a new referral (patient + images + clinical)", plan: "Starter" },
      { method: "PATCH",path: "/api/v1/cases/{id}",                   scope: "cases:write", desc: "Update case status, priority, or treatment plan",     plan: "Growth" },
      { method: "POST", path: "/api/v1/cases/{id}/notes",             scope: "cases:write", desc: "Add a clarification note to a case",       plan: "Growth" },
      { method: "GET",  path: "/api/v1/ai/cases/{id}/audit-trail",    scope: "cases:read",  desc: "Get AI assessment audit trail for a case",  plan: "Growth" },
    ],
  },
  {
    section: "Referrals",
    items: [
      { method: "GET",   path: "/api/v1/referrals",      scope: "referrals:read",  desc: "List referrals with status", plan: "Starter" },
      { method: "PATCH", path: "/api/v1/referrals/{id}", scope: "referrals:write", desc: "Update referral status",     plan: "Growth" },
    ],
  },
  {
    section: "AI",
    items: [
      { method: "POST", path: "/api/v1/ai/skin-assessment",    scope: "ai:assessments", desc: "Trigger an AI skin assessment on a case",        plan: "Growth" },
      { method: "POST", path: "/api/v1/ai/image-quality-check",scope: "ai:assessments", desc: "Check image quality before submitting for AI analysis", plan: "Growth" },
      { method: "GET",  path: "/api/v1/ai/health",             scope: "cases:read",     desc: "Check AI service health and model version",             plan: "Starter" },
    ],
  },
  {
    section: "FHIR R4",
    items: [
      { method: "GET", path: "/fhir/r4/Patient/{id}",            scope: "fhir:r4", desc: "Export patient as FHIR R4 Patient resource",        plan: "Enterprise" },
      { method: "GET", path: "/fhir/r4/DiagnosticReport/{id}",   scope: "fhir:r4", desc: "Export specialist review as FHIR DiagnosticReport",  plan: "Enterprise" },
      { method: "GET", path: "/fhir/r4/DocumentReference/{id}",  scope: "fhir:r4", desc: "Export full case packet as FHIR DocumentReference",  plan: "Enterprise" },
    ],
  },
  {
    section: "Webhooks",
    items: [
      { method: "POST",   path: "/api/v1/webhooks",       scope: "webhooks", desc: "Register a webhook endpoint",          plan: "Growth" },
      { method: "GET",    path: "/api/v1/webhooks",       scope: "webhooks", desc: "List registered webhooks",             plan: "Growth" },
      { method: "DELETE", path: "/api/v1/webhooks/{id}",  scope: "webhooks", desc: "Remove a webhook",                    plan: "Growth" },
    ],
  },
]

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700", POST: "bg-emerald-100 text-emerald-700",
  PATCH: "bg-amber-100 text-amber-700", DELETE: "bg-red-100 text-red-700",
  PUT: "bg-violet-100 text-violet-700",
}
const PLAN_COLORS: Record<string, string> = {
  All: "bg-slate-100 text-slate-600", Starter: "bg-blue-100 text-blue-700",
  Growth: "bg-teal-100 text-teal-700", Enterprise: "bg-violet-100 text-violet-700",
}

// ── Code block component ──────────────────────────────────────────────────────
function CodeBlock({ sample, defaultLang = "curl" }: { sample: Record<Lang, string>; defaultLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(sample[lang])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
        <div className="flex gap-1">
          {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={cn("rounded px-2.5 py-1 text-xs font-medium transition-colors",
                lang === l ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white")}>
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
          {copied ? <><Check className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="h-3.5 w-3.5" />Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-300">{sample[lang]}</pre>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("quickstart")
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const NAV_SECTIONS = [
    { id: "quickstart", label: "Quick start" },
    { id: "auth",       label: "Authentication" },
    { id: "errors",     label: "Error codes" },
    { id: "endpoints",  label: "Endpoints" },
    { id: "webhooks",   label: "Webhooks" },
    { id: "fhir",       label: "FHIR R4" },
    { id: "pricing",    label: "Pricing & apply" },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/"><SkinLinkLogo /></Link>
            <span className="hidden rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 sm:block">API Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/api-docs/apply" className="rounded-lg border border-border px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Apply for access</Link>
            <Link href="/dashboard/api" className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-primary/90">
              Manage keys <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
        {/* Sidebar */}
        <aside className="sticky top-14 hidden w-52 shrink-0 self-start py-8 pr-6 lg:block">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Contents</p>
          <nav className="space-y-0.5">
            {NAV_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors",
                  activeSection === s.id ? "bg-primary/8 text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                {s.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-xs font-bold text-teal-800 mb-1">Base URL</p>
            <code className="text-xs font-mono text-teal-700 break-all">https://api.skinlink.health</code>
            <p className="mt-2 text-xs font-bold text-teal-800 mb-1">API version</p>
            <code className="text-xs font-mono text-teal-700">v1</code>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 py-8 pl-0 lg:pl-8 min-w-0">

          {/* ── QUICK START ── */}
          {activeSection === "quickstart" && (
            <div className="space-y-10 max-w-3xl">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 mb-3">
                  <Zap className="h-3.5 w-3.5" /> Quick start
                </div>
                <h1 className="font-heading text-4xl font-extrabold text-slate-900">SkinLink API</h1>
                <p className="mt-3 text-lg text-slate-500 leading-relaxed">
                  Integrate SkinLink's tele-dermatology case management, AI skin assessment, and FHIR-compatible patient data exports into your own health system, mobile app, or EMR.
                </p>
              </div>

              {/* Steps */}
              {[
                {
                  n: "1", title: "Apply for an API key",
                  body: "Submit your application at skinlink.health/api-docs/apply. Choose your plan, describe your integration, and agree to the clinical use terms. You'll receive credentials within 2 business days.",
                  action: <Link href="/api-docs/apply" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">Apply now <ArrowRight className="h-4 w-4" /></Link>,
                },
                {
                  n: "2", title: "Make your first request",
                  body: "Use your Bearer token in the Authorization header on every request. All responses are JSON.",
                  code: SAMPLES.auth,
                },
                {
                  n: "3", title: "Submit a case referral",
                  body: "The most common operation is submitting a new referral case with patient demographics, clinical info, and images.",
                  code: SAMPLES.create_case,
                },
                {
                  n: "4", title: "Listen for case updates via webhooks",
                  body: "Register a webhook to receive real-time notifications when a specialist reviews a case, when AI assessment completes, or when a case is escalated.",
                  code: SAMPLES.webhook,
                },
              ].map(s => (
                <div key={s.n} className="flex gap-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white mt-0.5">{s.n}</div>
                  <div className="flex-1 space-y-3">
                    <h2 className="font-heading text-xl font-bold text-slate-900">{s.title}</h2>
                    <p className="text-slate-500">{s.body}</p>
                    {"action" in s && s.action}
                    {"code" in s && s.code && <CodeBlock sample={s.code} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── AUTH ── */}
          {activeSection === "auth" && (
            <div className="space-y-8 max-w-3xl">
              <div>
                <h1 className="font-heading text-3xl font-extrabold text-slate-900">Authentication</h1>
                <p className="mt-2 text-slate-500">All API requests must include your API key as a Bearer token in the Authorization header.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-semibold">Keep your API key secret</p>
                  <p className="mt-0.5 text-amber-700">Never expose your key in client-side JavaScript, public repositories, or logs. Use environment variables. Rotate your key immediately if it is compromised.</p>
                </div>
              </div>
              <CodeBlock sample={SAMPLES.auth} />
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold text-slate-900">Scopes</h2>
                <p className="text-slate-500">Each API key is issued with a set of scopes that restrict what operations it can perform. Scopes are defined at key issuance and cannot be self-upgraded.</p>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Scope</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Min plan</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["cases:read","Read cases, images, AI output, notes","Starter"],
                        ["cases:write","Create and update cases","Starter"],
                        ["patients:read","Read patient demographics","Starter"],
                        ["patients:write","Register and update patients","Starter"],
                        ["referrals:read","Read referral status","Starter"],
                        ["referrals:write","Update referral status","Growth"],
                        ["ai:assessments","Trigger AI skin assessments","Growth"],
                        ["webhooks","Register and manage webhooks","Growth"],
                        ["fhir:r4","Access FHIR R4 export endpoints","Enterprise"],
                        ["*","All scopes (Enterprise only)","Enterprise"],
                      ].map(([scope, desc, plan]) => (
                        <tr key={scope}>
                          <td className="px-4 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">{scope}</code></td>
                          <td className="px-4 py-3 text-slate-600">{desc}</td>
                          <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", PLAN_COLORS[plan])}>{plan}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ERRORS ── */}
          {activeSection === "errors" && (
            <div className="space-y-8 max-w-3xl">
              <h1 className="font-heading text-3xl font-extrabold text-slate-900">Error codes</h1>
              <p className="text-slate-500">All errors return a JSON body with <code className="bg-slate-100 px-1 rounded text-sm">error</code> and <code className="bg-slate-100 px-1 rounded text-sm">message</code> fields.</p>
              <CodeBlock sample={{ curl: `{
  "error": "quota_exceeded",
  "message": "Monthly request quota reached. Upgrade your plan at skinlink.health/dashboard/api"
}`, python: "", javascript: "", php: "" }} defaultLang="curl" />
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">HTTP</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">error code</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Meaning</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ["200", "—", "Success"],
                      ["201", "—", "Resource created"],
                      ["400", "bad_request", "Validation error or missing required field"],
                      ["401", "unauthorized", "Missing or invalid API key"],
                      ["403", "forbidden", "Valid key but insufficient scope for this operation"],
                      ["404", "not_found", "Resource not found or not in your tenant"],
                      ["422", "image_quality_failed", "Image quality check failed — retake required before AI"],
                      ["429", "quota_exceeded", "Rate limit or monthly quota exceeded"],
                      ["500", "server_error", "Unexpected server error — contact support"],
                      ["503", "ai_unavailable", "AI service temporarily unavailable"],
                    ].map(([code, err, meaning]) => (
                      <tr key={code + err}>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-700">{code}</td>
                        <td className="px-4 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{err}</code></td>
                        <td className="px-4 py-3 text-slate-600">{meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ENDPOINTS ── */}
          {activeSection === "endpoints" && (
            <div className="space-y-8 max-w-3xl">
              <h1 className="font-heading text-3xl font-extrabold text-slate-900">Endpoints</h1>
              {ENDPOINTS.map(section => (
                <div key={section.section} className="space-y-2">
                  <h2 className="font-heading text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">{section.section}</h2>
                  {section.items.map(ep => {
                    const key = `${ep.method}:${ep.path}`
                    const open = expandedEndpoints.has(key)
                    return (
                      <div key={key} className={cn("rounded-xl border transition-all", open ? "border-primary/30 bg-primary/3" : "border-slate-200 bg-white")}>
                        <button onClick={() => toggleEndpoint(key)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                          <span className={cn("shrink-0 rounded px-2 py-0.5 text-[11px] font-bold w-14 text-center", METHOD_COLORS[ep.method])}>{ep.method}</span>
                          <code className="flex-1 font-mono text-sm text-slate-800">{ep.path}</code>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold hidden sm:block", PLAN_COLORS[ep.plan])}>{ep.plan}</span>
                          {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        </button>
                        {open && (
                          <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                            <p className="text-sm text-slate-600">{ep.desc}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-slate-600"><Shield className="h-3 w-3" />Scope: <code className="font-mono ml-0.5">{ep.scope}</code></span>
                              <span className={cn("flex items-center gap-1 rounded px-2 py-1 font-semibold", PLAN_COLORS[ep.plan])}>{ep.plan} plan+</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── WEBHOOKS ── */}
          {activeSection === "webhooks" && (
            <div className="space-y-8 max-w-3xl">
              <h1 className="font-heading text-3xl font-extrabold text-slate-900">Webhooks</h1>
              <p className="text-slate-500">Webhooks deliver real-time event notifications to your endpoint via HTTP POST. Requires <code className="bg-slate-100 px-1 rounded text-sm">webhooks</code> scope (Growth+ plan).</p>
              <div className="space-y-2">
                <h2 className="font-heading text-lg font-bold text-slate-800">Event types</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Event</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Triggered when</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["case.created","A new referral is submitted"],
                        ["case.in_review","A specialist opens and starts reviewing a case"],
                        ["case.reviewed","Specialist completes review and issues treatment guidance"],
                        ["case.follow_up","A follow-up report is submitted by the clinic"],
                        ["case.closed","Case is closed / patient discharged"],
                        ["case.escalated","Case is escalated to urgent in-person referral"],
                        ["ai.assessment_complete","AI assessment is attached to a case"],
                        ["patient.created","A new patient is registered"],
                      ].map(([event, when]) => (
                        <tr key={event}>
                          <td className="px-4 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{event}</code></td>
                          <td className="px-4 py-3 text-slate-600">{when}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="font-heading text-lg font-bold text-slate-800">Signature verification</h2>
                <p className="text-slate-500">Every webhook request includes a <code className="bg-slate-100 px-1 rounded text-sm">X-SkinLink-Signature</code> header. Always verify this to prevent spoofed events.</p>
                <CodeBlock sample={SAMPLES.webhook} />
              </div>
            </div>
          )}

          {/* ── FHIR ── */}
          {activeSection === "fhir" && (
            <div className="space-y-8 max-w-3xl">
              <h1 className="font-heading text-3xl font-extrabold text-slate-900">FHIR R4 Export</h1>
              <p className="text-slate-500">Enterprise plan keys with the <code className="bg-slate-100 px-1 rounded text-sm">fhir:r4</code> scope can export SkinLink data as HL7 FHIR R4 resources — compatible with OpenMRS, DHIS2, Epic SMART, and any standard-compliant EMR.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { resource: "Patient", path: "/fhir/r4/Patient/{id}", desc: "Demographics, consent, contact details" },
                  { resource: "DiagnosticReport", path: "/fhir/r4/DiagnosticReport/{id}", desc: "Specialist assessment, differential, treatment" },
                  { resource: "DocumentReference", path: "/fhir/r4/DocumentReference/{id}", desc: "Full case packet — images, notes, plan" },
                ].map(f => (
                  <div key={f.resource} className="rounded-xl border border-slate-200 p-5">
                    <code className="text-sm font-bold text-primary">{f.resource}</code>
                    <p className="mt-1 text-xs text-muted-foreground font-mono">{f.path}</p>
                    <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                  </div>
                ))}
              </div>
              <CodeBlock sample={{
                curl: `# Export a patient as FHIR R4
curl https://api.skinlink.health/fhir/r4/Patient/p_abc123 \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Accept: application/fhir+json"`,
                python: `import requests
r = requests.get(
    "https://api.skinlink.health/fhir/r4/Patient/p_abc123",
    headers={"Authorization": "Bearer sk_live_YOUR_KEY",
             "Accept": "application/fhir+json"}
)
fhir_patient = r.json()
print(fhir_patient["resourceType"])  # → "Patient"`,
                javascript: `const r = await fetch(
  "https://api.skinlink.health/fhir/r4/Patient/p_abc123",
  { headers: { "Authorization": "Bearer sk_live_YOUR_KEY",
               "Accept": "application/fhir+json" } }
);
const fhirPatient = await r.json();
console.log(fhirPatient.resourceType); // → "Patient"`,
                php: `$ch = curl_init("https://api.skinlink.health/fhir/r4/Patient/p_abc123");
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => ["Authorization: Bearer sk_live_YOUR_KEY", "Accept: application/fhir+json"],
    CURLOPT_RETURNTRANSFER => true
]);
$fhir = json_decode(curl_exec($ch), true);
echo $fhir["resourceType"]; // → Patient`,
              }} />
            </div>
          )}

          {/* ── PRICING & APPLY ── */}
          {activeSection === "pricing" && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h1 className="font-heading text-3xl font-extrabold text-slate-900">Pricing & Apply</h1>
                <p className="mt-2 text-slate-500">All plans billed monthly in TZS. A 30-day free evaluation period is available for Starter and Growth.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { id: "free", name: "Developer", price: "Free", period: "", desc: "For testing and evaluation", features: ["500 req/month","10 req/minute","cases:read, patients:read","Community support"], highlight: false },
                  { id: "starter", name: "Starter", price: "TZS 150,000", period: "/mo", desc: "Small integrations and clinics", features: ["10,000 req/month","60 req/minute","Read + write (cases, patients)","Email support (48h)","30-day free trial"], highlight: false },
                  { id: "growth", name: "Growth", price: "TZS 400,000", period: "/mo", desc: "Production apps and EMR sync", features: ["100,000 req/month","300 req/minute","Full scopes incl. AI + webhooks","Email support (24h)","30-day free trial"], highlight: true },
                  { id: "enterprise", name: "Enterprise", price: "Negotiated", period: "", desc: "National programmes and FHIR", features: ["Unlimited requests","Unlimited rate","All scopes + FHIR R4","Dedicated account manager","Custom SLA"], highlight: false },
                ].map(p => (
                  <div key={p.id} className={cn("flex flex-col rounded-2xl border p-6", p.highlight ? "border-primary bg-gradient-to-b from-primary to-[#0c2340] text-white shadow-xl shadow-primary/20" : "border-slate-200 bg-white")}>
                    {p.highlight && <span className="mb-2 self-start rounded-full bg-teal-400 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-950">Most popular</span>}
                    <p className={cn("text-xs font-bold uppercase tracking-wider", p.highlight ? "text-teal-200" : "text-slate-400")}>{p.name}</p>
                    <div className="mt-2 flex items-end gap-1">
                      <span className={cn("font-heading text-2xl font-extrabold", p.highlight ? "text-white" : "text-slate-900")}>{p.price}</span>
                      {p.period && <span className={cn("mb-1 text-sm", p.highlight ? "text-teal-200" : "text-slate-400")}>{p.period}</span>}
                    </div>
                    <p className={cn("mt-1 text-xs", p.highlight ? "text-teal-100/80" : "text-slate-500")}>{p.desc}</p>
                    <ul className="mt-5 flex-1 space-y-2">
                      {p.features.map(f => (
                        <li key={f} className={cn("flex items-start gap-2 text-xs", p.highlight ? "text-white/90" : "text-slate-600")}>
                          <CheckCircle2 className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", p.highlight ? "text-teal-300" : "text-emerald-500")} />{f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/api-docs/apply"
                      className={cn("mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                        p.highlight ? "bg-white text-primary hover:bg-teal-50" : "bg-primary text-white hover:bg-primary/90")}>
                      Apply <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
