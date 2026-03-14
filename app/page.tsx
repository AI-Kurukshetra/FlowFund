import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CircleDollarSign,
  CreditCard,
  Gauge,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

const features = [
  {
    title: "Instant Credit Decisions",
    description:
      "AI-powered underwriting evaluates business health and provides quick loan approvals.",
    icon: Sparkles,
  },
  {
    title: "Flexible Credit Lines",
    description: "Access working capital whenever you need it with dynamic credit limits.",
    icon: CircleDollarSign,
  },
  {
    title: "Smart Loan Management",
    description:
      "Track repayments, monitor cash flow, and manage your financing in one dashboard.",
    icon: Gauge,
  },
];

const steps = [
  { title: "Create Business Profile", icon: UserCheck },
  { title: "Apply for Funding", icon: CreditCard },
  { title: "AI Credit Assessment", icon: Activity },
  { title: "Access Capital Instantly", icon: Rocket },
];

export default function Home() {
  return (
    <main className="pb-14">
      <header className="mx-auto w-full max-w-7xl px-4 pt-5 md:px-6">
        <nav className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur-sm">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
            FlowFund
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How it Works
            </a>
            <a href="#dashboard-preview" className="hover:text-slate-900">
              Dashboard
            </a>
            <Link href="/login" className="hover:text-slate-900">
              Login
            </Link>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            Apply for Credit
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pt-12 md:grid-cols-2 md:px-6">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Modern Fintech Platform
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
            AI-powered working capital for modern businesses.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
            FlowFund helps small businesses access credit instantly, manage loans, and track
            repayments with intelligent financial insights.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
            >
              Apply for Credit
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.45)]">
          <p className="text-sm font-semibold text-slate-500">Fintech Intelligence Preview</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <p className="text-xs text-slate-300">Total Credit Limit</p>
              <p className="mt-1 text-2xl font-bold">$250,000</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs text-slate-500">Active Loan</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">$80,000</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs text-slate-500">Risk Score</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">721</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs text-slate-500">Next Payment</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">Apr 20</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 pt-18 md:px-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Key Features</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.8)]"
              >
                <div className="inline-flex rounded-lg bg-teal-600 p-2 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 pt-18 md:px-6">
        <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
                  Step {index + 1}
                </p>
                <Icon className="mt-4 h-5 w-5 text-slate-800" />
                <p className="mt-3 text-base font-semibold text-slate-900">{step.title}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="dashboard-preview" className="mx-auto w-full max-w-7xl px-4 pt-18 md:px-6">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.55)]">
          <h2 className="text-3xl font-bold text-slate-900">Product Dashboard Preview</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total Credit Limit</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">$250,000</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Active Loan</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">$80,000</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Remaining Balance</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">$54,200</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Next Payment Date</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Apr 20</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pt-18 md:px-6">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Loans Funded</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">$12M+</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Average Approval Time</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">4 min</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Repayment Rate</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">96%</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pt-18 md:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-900 to-cyan-800 px-6 py-12 text-white md:px-10">
          <h2 className="text-3xl font-bold md:text-4xl">Access business funding in minutes.</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Join modern operators using FlowFund to unlock credit, automate decisions, and scale
            with confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Start Free Trial
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Apply for Credit
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-16 w-full max-w-7xl border-t border-slate-200 px-4 pt-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-slate-900">FlowFund</p>
            <p className="mt-2 text-sm text-slate-500">AI-powered lending for growth-ready businesses.</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-900">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a href="#dashboard-preview" className="hover:text-slate-900">
                  Features
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-slate-900">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-slate-900">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-900">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>About</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 pb-8 text-sm text-slate-500">© FlowFund 2026</p>
      </footer>
    </main>
  );
}
