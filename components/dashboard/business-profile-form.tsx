"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  isReasonableAmount,
  isValidBusinessName,
  isValidIndustry,
  isValidYearsInBusiness,
} from "@/lib/validation";

type BusinessProfile = {
  id?: string;
  legal_name: string;
  industry: string;
  annual_revenue: number;
  years_in_business: number;
};

export function BusinessProfileForm({ profile }: { profile: BusinessProfile | null }) {
  const [form, setForm] = useState<BusinessProfile>(
    profile ?? {
      legal_name: "",
      industry: "",
      annual_revenue: 0,
      years_in_business: 0,
    },
  );
  const [message, setMessage] = useState<string>("");
  const [errors, setErrors] = useState<{
    legal_name?: string;
    industry?: string;
    annual_revenue?: string;
    years_in_business?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors({});
    const nextErrors: {
      legal_name?: string;
      industry?: string;
      annual_revenue?: string;
      years_in_business?: string;
    } = {};

    if (!isValidBusinessName(form.legal_name)) {
      nextErrors.legal_name = "Enter a valid business name (2-120 characters).";
    }

    if (!isValidIndustry(form.industry)) {
      nextErrors.industry = "Enter a valid industry (2-60 characters).";
    }

    if (!isReasonableAmount(Number(form.annual_revenue), 1000, 1000000000)) {
      nextErrors.annual_revenue = "Annual revenue must be between $1,000 and $1,000,000,000.";
    }

    if (!isValidYearsInBusiness(Number(form.years_in_business))) {
      nextErrors.years_in_business = "Years in business must be between 0 and 80.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in again.");
      setLoading(false);
      return;
    }

    const payload = {
      owner_user_id: user.id,
      legal_name: form.legal_name,
      industry: form.industry,
      annual_revenue: Number(form.annual_revenue),
      years_in_business: Number(form.years_in_business),
    };

    const { data: existingBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = existingBusiness
      ? await supabase.from("businesses").update(payload).eq("id", existingBusiness.id)
      : await supabase.from("businesses").insert(payload);

    setMessage(error ? error.message : "Business profile saved.");
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-600">
          Business Name
          <input
            value={form.legal_name}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, legal_name: event.target.value }));
              setErrors((curr) => ({ ...curr, legal_name: undefined }));
            }}
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              errors.legal_name ? "border-rose-500" : "border-slate-200"
            }`}
            required
            minLength={2}
            maxLength={120}
          />
          {errors.legal_name && <p className="mt-1 text-xs text-rose-600">{errors.legal_name}</p>}
        </label>
        <label className="text-sm text-slate-600">
          Industry
          <input
            value={form.industry}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, industry: event.target.value }));
              setErrors((curr) => ({ ...curr, industry: undefined }));
            }}
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              errors.industry ? "border-rose-500" : "border-slate-200"
            }`}
            required
            minLength={2}
            maxLength={60}
          />
          {errors.industry && <p className="mt-1 text-xs text-rose-600">{errors.industry}</p>}
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-600">
          Annual Revenue (USD)
          <input
            type="number"
            min="1000"
            max="1000000000"
            value={form.annual_revenue}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, annual_revenue: Number(event.target.value) }));
              setErrors((curr) => ({ ...curr, annual_revenue: undefined }));
            }}
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              errors.annual_revenue ? "border-rose-500" : "border-slate-200"
            }`}
            required
          />
          {errors.annual_revenue && <p className="mt-1 text-xs text-rose-600">{errors.annual_revenue}</p>}
        </label>
        <label className="text-sm text-slate-600">
          Years in Business
          <input
            type="number"
            min="0"
            max="80"
            value={form.years_in_business}
            onChange={(event) => {
              setForm((curr) => ({ ...curr, years_in_business: Number(event.target.value) }));
              setErrors((curr) => ({ ...curr, years_in_business: undefined }));
            }}
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              errors.years_in_business ? "border-rose-500" : "border-slate-200"
            }`}
            required
          />
          {errors.years_in_business && <p className="mt-1 text-xs text-rose-600">{errors.years_in_business}</p>}
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Saving..." : "Save Profile"}
      </button>
      {message && <p className={`text-sm ${message.includes("saved") ? "text-slate-600" : "text-rose-600"}`}>{message}</p>}
    </form>
  );
}
