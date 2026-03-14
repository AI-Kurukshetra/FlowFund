"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function InvoiceAdvanceButton({ invoiceId, disabled }: { invoiceId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onAdvance = async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/invoices/advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Advance request failed.");
      setLoading(false);
      return;
    }

    setMessage(data.message ?? "Advance processed.");
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <button
        type="button"
        onClick={onAdvance}
        disabled={loading || disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-70 md:w-auto"
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        {loading ? "Processing..." : "Advance Funds"}
      </button>
      {message && <p className={`text-xs ${message.toLowerCase().includes("failed") ? "text-rose-600" : "text-slate-500"}`}>{message}</p>}
    </div>
  );
}
