"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type MakePaymentButtonProps = {
  loanId: string;
  maxAmount: number;
};

export function MakePaymentButton({ loanId, maxAmount }: MakePaymentButtonProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(maxAmount > 0 ? Math.min(maxAmount, 500) : 0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [amountError, setAmountError] = useState("");

  const onPay = async () => {
    setAmountError("");
    if (amount <= 0) {
      setAmountError("Enter a valid amount.");
      return;
    }

    if (amount > maxAmount) {
      setAmountError("Payment cannot exceed outstanding balance.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, amount }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Payment failed.");
        return;
      }

      setMessage("Payment successful.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (maxAmount <= 0) {
    return <span className="text-xs text-slate-400">No balance</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="number"
          min={1}
          max={maxAmount}
          step={1}
          value={amount}
          onChange={(event) => {
            setAmount(Number(event.target.value));
            setAmountError("");
          }}
          className={`w-full rounded-lg border px-2 py-1 text-xs sm:w-24 ${amountError ? "border-rose-500" : "border-slate-200"}`}
        />
        <button
          type="button"
          onClick={onPay}
          disabled={loading}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-70 sm:w-auto"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          {loading ? "Paying..." : "Make Payment"}
        </button>
      </div>
      {amountError && <p className="text-xs text-rose-600">{amountError}</p>}
      {message && <p className={`text-xs ${message.includes("successful") ? "text-slate-500" : "text-rose-600"}`}>{message}</p>}
    </div>
  );
}
