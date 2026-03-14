"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  isDueDateInRange,
  isReasonableAmount,
  isValidBusinessName,
  isValidInvoiceNumber,
  isValidUpload,
} from "@/lib/validation";

export function InvoiceForm() {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    invoiceNumber?: string;
    clientName?: string;
    invoiceAmount?: string;
    dueDate?: string;
    file?: string;
  }>({});

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrors({});
    const nextErrors: {
      invoiceNumber?: string;
      clientName?: string;
      invoiceAmount?: string;
      dueDate?: string;
      file?: string;
    } = {};

    if (!isValidInvoiceNumber(invoiceNumber)) {
      nextErrors.invoiceNumber = "Invoice number must be 4-30 characters (letters, numbers, dashes).";
    }

    if (!isValidBusinessName(clientName)) {
      nextErrors.clientName = "Enter a valid client name.";
    }

    if (!isReasonableAmount(invoiceAmount, 100, 50000000)) {
      nextErrors.invoiceAmount = "Invoice amount must be between $100 and $50,000,000.";
    }

    if (!isDueDateInRange(dueDate, 365)) {
      nextErrors.dueDate = "Due date must be today or within 365 days.";
    }

    if (file && !isValidUpload(file, 10, ["application/pdf", "image/"])) {
      nextErrors.file = "Upload a valid PDF/image up to 10MB.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sign in to continue.");
      setLoading(false);
      return;
    }

    let invoiceDocumentPath: string | null = null;

    if (file) {
      const path = `${user.id}/invoices/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }

      invoiceDocumentPath = path;
    }

    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_number: invoiceNumber,
        client_name: clientName,
        invoice_amount: invoiceAmount,
        due_date: dueDate,
        invoice_document_url: invoiceDocumentPath,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Unable to create invoice.");
      setLoading(false);
      return;
    }

    setMessage("Invoice uploaded. You can now request an advance.");
    setInvoiceNumber("");
    setClientName("");
    setInvoiceAmount(0);
    setDueDate("");
    setFile(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-5">
      <label className="text-sm font-semibold text-slate-700">Invoice Number</label>
      <input
        value={invoiceNumber}
        onChange={(event) => {
          setInvoiceNumber(event.target.value);
          setErrors((curr) => ({ ...curr, invoiceNumber: undefined }));
        }}
        className={`w-full rounded-xl border px-3 py-2 ${errors.invoiceNumber ? "border-rose-500" : "border-slate-200"}`}
        required
        minLength={4}
        maxLength={30}
      />
      {errors.invoiceNumber && <p className="text-xs text-rose-600">{errors.invoiceNumber}</p>}

      <label className="text-sm font-semibold text-slate-700">Client Name</label>
      <input
        value={clientName}
        onChange={(event) => {
          setClientName(event.target.value);
          setErrors((curr) => ({ ...curr, clientName: undefined }));
        }}
        className={`w-full rounded-xl border px-3 py-2 ${errors.clientName ? "border-rose-500" : "border-slate-200"}`}
        required
        minLength={2}
        maxLength={120}
      />
      {errors.clientName && <p className="text-xs text-rose-600">{errors.clientName}</p>}

      <label className="text-sm font-semibold text-slate-700">Invoice Amount</label>
      <input
        type="number"
        min={100}
        max={50000000}
        value={invoiceAmount}
        onChange={(event) => {
          setInvoiceAmount(Number(event.target.value));
          setErrors((curr) => ({ ...curr, invoiceAmount: undefined }));
        }}
        className={`w-full rounded-xl border px-3 py-2 ${errors.invoiceAmount ? "border-rose-500" : "border-slate-200"}`}
        required
      />
      {errors.invoiceAmount && <p className="text-xs text-rose-600">{errors.invoiceAmount}</p>}

      <label className="text-sm font-semibold text-slate-700">Due Date</label>
      <input
        type="date"
        value={dueDate}
        onChange={(event) => {
          setDueDate(event.target.value);
          setErrors((curr) => ({ ...curr, dueDate: undefined }));
        }}
        className={`w-full rounded-xl border px-3 py-2 ${errors.dueDate ? "border-rose-500" : "border-slate-200"}`}
        required
      />
      {errors.dueDate && <p className="text-xs text-rose-600">{errors.dueDate}</p>}

      <label className="text-sm font-semibold text-slate-700">Upload Invoice Document</label>
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setErrors((curr) => ({ ...curr, file: undefined }));
        }}
        className={`w-full rounded-xl border px-3 py-2 ${errors.file ? "border-rose-500" : "border-slate-200"}`}
      />
      {errors.file && <p className="text-xs text-rose-600">{errors.file}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70 sm:w-auto"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Saving..." : "Save Invoice"}
      </button>

      {message && <p className={`text-sm ${message.includes("uploaded") ? "text-slate-600" : "text-rose-600"}`}>{message}</p>}
    </form>
  );
}
