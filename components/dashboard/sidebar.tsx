"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  CircleDollarSign,
  Landmark,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Files,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/business", label: "Business Profile", icon: Building2 },
  { href: "/applications/new", label: "Apply for Loan", icon: FileSpreadsheet },
  { href: "/loans", label: "Loan Management", icon: CreditCard },
  { href: "/payments", label: "Payments", icon: CircleDollarSign },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Files },
  { href: "/bank-connect", label: "Bank Connect", icon: Landmark },
  { href: "/credit-line", label: "Credit Line", icon: BadgeDollarSign },
  { href: "/repayment-schedule", label: "Repayment Schedule", icon: RefreshCcw },
  { href: "/kyc", label: "KYC Verification", icon: ShieldCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <>
      <aside className="md:hidden">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">FlowFund</p>
              <h1 className="text-sm font-bold text-slate-900">Capital Command Center</h1>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((curr) => !curr)}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="mt-4 space-y-3">
              <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
              >
                {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </aside>

      <aside className="hidden h-full w-full flex-col rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.45)] md:sticky md:top-6 md:flex md:w-72">
        <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">FlowFund</p>
          <h1 className="mt-1 text-xl font-bold leading-tight">Capital Command Center</h1>
          <p className="mt-2 text-xs text-teal-100/90">AI-powered business lending operations</p>
        </div>

        <nav className="mt-6 flex flex-1 gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-w-max items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
        >
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </aside>
    </>
  );
}
