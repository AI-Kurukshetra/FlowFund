"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  isReasonableAmount,
  isReasonableLoanPurpose,
  isValidBusinessName,
  isValidIndustry,
  isValidYearsInBusiness,
} from "@/lib/validation";

type Decision = {
  status: "approved" | "partial_approved" | "review";
  requestedAmount: number;
  approvedCreditAmount: number;
  interestRate: number;
  loanTermMonths: number;
  riskScore: number;
  reason: string;
};

type LoanForm = {
  businessName: string;
  industry: string;
  annualRevenue: number;
  yearsInBusiness: number;
  requestedAmount: number;
  loanPurpose: string;
};

const initialState: LoanForm = {
  businessName: "",
  industry: "",
  annualRevenue: 0,
  yearsInBusiness: 1,
  requestedAmount: 50000,
  loanPurpose: "",
};

export function LoanApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState<LoanForm>(initialState);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    businessName?: string;
    industry?: string;
    annualRevenue?: string;
    yearsInBusiness?: string;
    requestedAmount?: string;
    loanPurpose?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setDecision(null);
    setErrors({});
    const nextErrors: {
      businessName?: string;
      industry?: string;
      annualRevenue?: string;
      yearsInBusiness?: string;
      requestedAmount?: string;
      loanPurpose?: string;
    } = {};

    if (!isValidBusinessName(form.businessName)) {
      nextErrors.businessName = "Enter a valid business name.";
    }

    if (!isValidIndustry(form.industry)) {
      nextErrors.industry = "Enter a valid industry.";
    }

    if (!isReasonableAmount(form.annualRevenue, 1000, 1000000000)) {
      nextErrors.annualRevenue = "Annual revenue must be between $1,000 and $1,000,000,000.";
    }

    if (!isValidYearsInBusiness(form.yearsInBusiness)) {
      nextErrors.yearsInBusiness = "Years in business must be between 0 and 80.";
    }

    if (!isReasonableAmount(form.requestedAmount, 1000, 20000000)) {
      nextErrors.requestedAmount = "Requested amount must be between $1,000 and $20,000,000.";
    }

    if (!isReasonableLoanPurpose(form.loanPurpose)) {
      nextErrors.loanPurpose = "Loan purpose must be 10-300 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/loan-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Unable to submit application.");
        return;
      }

      setMessage("Application submitted successfully.");
      setDecision(data.decision ?? null);
      setForm(initialState);

      if (data.applicationId) {
        router.push(`/applications/result?id=${data.applicationId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2";

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <label className="text-sm text-slate-600">
          Business Name
          <input
            type="text"
            className={`${inputClass} ${errors.businessName ? "border-rose-500" : "border-slate-200"}`}
            value={form.businessName}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, businessName: event.target.value }));
              setErrors((curr) => ({ ...curr, businessName: undefined }));
            }}
            required
            minLength={2}
            maxLength={120}
          />
          {errors.businessName && <p className="mt-1 text-xs text-rose-600">{errors.businessName}</p>}
        </label>
        <label className="text-sm text-slate-600">
          Industry
          <input
            type="text"
            className={`${inputClass} ${errors.industry ? "border-rose-500" : "border-slate-200"}`}
            value={form.industry}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, industry: event.target.value }));
              setErrors((curr) => ({ ...curr, industry: undefined }));
            }}
            required
            minLength={2}
            maxLength={60}
          />
          {errors.industry && <p className="mt-1 text-xs text-rose-600">{errors.industry}</p>}
        </label>
        <label className="text-sm text-slate-600">
          Annual Revenue
          <input
            type="number"
            className={`${inputClass} ${errors.annualRevenue ? "border-rose-500" : "border-slate-200"}`}
            value={form.annualRevenue}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, annualRevenue: Number(event.target.value) }));
              setErrors((curr) => ({ ...curr, annualRevenue: undefined }));
            }}
            min={0}
            max={1000000000}
            required
          />
          {errors.annualRevenue && <p className="mt-1 text-xs text-rose-600">{errors.annualRevenue}</p>}
        </label>
        <label className="text-sm text-slate-600">
          Years in Business
          <input
            type="number"
            className={`${inputClass} ${errors.yearsInBusiness ? "border-rose-500" : "border-slate-200"}`}
            value={form.yearsInBusiness}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, yearsInBusiness: Number(event.target.value) }));
              setErrors((curr) => ({ ...curr, yearsInBusiness: undefined }));
            }}
            min={0}
            max={80}
            required
          />
          {errors.yearsInBusiness && <p className="mt-1 text-xs text-rose-600">{errors.yearsInBusiness}</p>}
        </label>
        <label className="text-sm text-slate-600">
          Requested Loan Amount
          <input
            type="number"
            className={`${inputClass} ${errors.requestedAmount ? "border-rose-500" : "border-slate-200"}`}
            value={form.requestedAmount}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, requestedAmount: Number(event.target.value) }));
              setErrors((curr) => ({ ...curr, requestedAmount: undefined }));
            }}
            min={1000}
            max={20000000}
            required
          />
          {errors.requestedAmount && <p className="mt-1 text-xs text-rose-600">{errors.requestedAmount}</p>}
        </label>
        <label className="text-sm text-slate-600">
          Loan Purpose
          <textarea
            className={`${inputClass} min-h-28 ${errors.loanPurpose ? "border-rose-500" : "border-slate-200"}`}
            value={form.loanPurpose}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, loanPurpose: event.target.value }));
              setErrors((curr) => ({ ...curr, loanPurpose: undefined }));
            }}
            required
            minLength={10}
            maxLength={300}
          />
          {errors.loanPurpose && <p className="mt-1 text-xs text-rose-600">{errors.loanPurpose}</p>}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>

      {message && <p className={`text-sm ${message.includes("successfully") ? "text-slate-600" : "text-rose-600"}`}>{message}</p>}
      {decision && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Decision</p>
          <p className="mt-1 text-lg font-semibold capitalize text-slate-900">
            {decision.status.replace("_", " ")}
          </p>
          <p className="text-sm text-slate-600">
            Approved Credit Amount: ${Number(decision.approvedCreditAmount).toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-sm text-slate-600">{decision.reason}</p>
        </div>
      )}
    </div>
  );
}
