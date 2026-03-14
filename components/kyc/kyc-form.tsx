"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  isValidAddress,
  isValidPersonName,
  isValidRegistrationNumber,
  isValidTaxId,
  isValidUpload,
} from "@/lib/validation";

type Props = {
  existingRecord?: {
    owner_full_name: string;
    business_registration_number: string;
    business_address: string;
    tax_id: string;
    identity_document_url: string;
  };
};

export function KycForm({ existingRecord }: Props) {
  const [form, setForm] = useState({
    owner_full_name: existingRecord?.owner_full_name ?? "",
    business_registration_number: existingRecord?.business_registration_number ?? "",
    business_address: existingRecord?.business_address ?? "",
    tax_id: existingRecord?.tax_id ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    owner_full_name?: string;
    business_registration_number?: string;
    tax_id?: string;
    business_address?: string;
    identity_document?: string;
  }>({});

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrors({});
    const nextErrors: {
      owner_full_name?: string;
      business_registration_number?: string;
      tax_id?: string;
      business_address?: string;
      identity_document?: string;
    } = {};

    if (!isValidPersonName(form.owner_full_name)) {
      nextErrors.owner_full_name = "Enter a valid owner name.";
    }

    if (!isValidRegistrationNumber(form.business_registration_number)) {
      nextErrors.business_registration_number = "Registration number must be 6-30 letters/numbers.";
    }

    if (!isValidTaxId(form.tax_id)) {
      nextErrors.tax_id = "Tax ID must be 6-20 letters/numbers.";
    }

    if (!isValidAddress(form.business_address)) {
      nextErrors.business_address = "Enter a valid business address with street number.";
    }

    if (file && !isValidUpload(file, 10, ["application/pdf", "image/"])) {
      nextErrors.identity_document = "Upload a valid PDF/image up to 10MB.";
    }

    if (!file && !existingRecord?.identity_document_url) {
      nextErrors.identity_document = "Upload an identity document.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setLoading(true);

    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sign in to continue.");
      setLoading(false);
      return;
    }

    let documentUrl = existingRecord?.identity_document_url ?? "";
    if (file) {
      const path = `${user.id}/kyc/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      documentUrl = urlData.publicUrl;
    }

    const response = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        identity_document_url: documentUrl,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Unable to save KYC data.");
      setLoading(false);
      return;
    }

    setMessage("KYC information saved.");
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-5">
      <label className="text-sm font-semibold text-slate-700">Owner Full Name</label>
      <input
        className={`w-full rounded-xl border px-3 py-2 ${errors.owner_full_name ? "border-rose-500" : "border-slate-200"}`}
        minLength={2}
        maxLength={80}
        value={form.owner_full_name}
        onChange={(event) => {
          setForm((prev) => ({ ...prev, owner_full_name: event.target.value }));
          setErrors((curr) => ({ ...curr, owner_full_name: undefined }));
        }}
        required
      />
      {errors.owner_full_name && <p className="text-xs text-rose-600">{errors.owner_full_name}</p>}
      <label className="text-sm font-semibold text-slate-700">Business Registration Number</label>
      <input
        className={`w-full rounded-xl border px-3 py-2 ${errors.business_registration_number ? "border-rose-500" : "border-slate-200"}`}
        minLength={6}
        maxLength={30}
        value={form.business_registration_number}
        onChange={(event) => {
          setForm((prev) => ({ ...prev, business_registration_number: event.target.value }));
          setErrors((curr) => ({ ...curr, business_registration_number: undefined }));
        }}
        required
      />
      {errors.business_registration_number && <p className="text-xs text-rose-600">{errors.business_registration_number}</p>}
      <label className="text-sm font-semibold text-slate-700">Tax ID</label>
      <input
        className={`w-full rounded-xl border px-3 py-2 ${errors.tax_id ? "border-rose-500" : "border-slate-200"}`}
        minLength={6}
        maxLength={20}
        value={form.tax_id}
        onChange={(event) => {
          setForm((prev) => ({ ...prev, tax_id: event.target.value }));
          setErrors((curr) => ({ ...curr, tax_id: undefined }));
        }}
        required
      />
      {errors.tax_id && <p className="text-xs text-rose-600">{errors.tax_id}</p>}
      <label className="text-sm font-semibold text-slate-700">Business Address</label>
      <input
        className={`w-full rounded-xl border px-3 py-2 ${errors.business_address ? "border-rose-500" : "border-slate-200"}`}
        minLength={10}
        maxLength={180}
        value={form.business_address}
        onChange={(event) => {
          setForm((prev) => ({ ...prev, business_address: event.target.value }));
          setErrors((curr) => ({ ...curr, business_address: undefined }));
        }}
        required
      />
      {errors.business_address && <p className="text-xs text-rose-600">{errors.business_address}</p>}
      <label className="text-sm font-semibold text-slate-700">Identity Document (PDF or Image)</label>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setErrors((curr) => ({ ...curr, identity_document: undefined }));
        }}
        className={`w-full rounded-xl border px-3 py-2 ${errors.identity_document ? "border-rose-500" : "border-slate-200"}`}
      />
      {errors.identity_document && <p className="text-xs text-rose-600">{errors.identity_document}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70 sm:w-auto"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Saving..." : "Submit KYC"}
      </button>
      {message && <p className={`text-sm ${message.includes("saved") ? "text-slate-600" : "text-rose-600"}`}>{message}</p>}
    </form>
  );
}
