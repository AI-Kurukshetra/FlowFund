"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function DrawFundsForm({ maxAmount }: { maxAmount: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(Math.min(1000, Math.max(maxAmount, 0)));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [amountError, setAmountError] = useState("");

  const onDraw = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setAmountError("");

    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError("Enter a valid draw amount.");
      return;
    }

    if (amount > maxAmount) {
      setAmountError("Amount exceeds available credit.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/credit-line/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Unable to draw funds.");
      setLoading(false);
      return;
    }

    setMessage("Funds drawn and repayment schedule generated.");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={onDraw} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
      <label className="text-sm font-semibold text-slate-700">Draw Funds</label>
      <input
        type="number"
        min={100}
        max={maxAmount}
        step={100}
        value={amount}
        onChange={(event) => {
          setAmount(Number(event.target.value));
          setAmountError("");
        }}
        className={`rounded-xl border px-3 py-2 ${amountError ? "border-rose-500" : "border-slate-200"}`}
      />
      {amountError && <p className="text-xs text-rose-600">{amountError}</p>}
      <button
        type="submit"
        disabled={loading || maxAmount <= 0}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Processing..." : maxAmount <= 0 ? "No Credit Available" : "Draw Funds"}
      </button>
      {message && <p className={`text-sm ${message.includes("generated") ? "text-slate-600" : "text-rose-600"}`}>{message}</p>}
    </form>
  );
}
