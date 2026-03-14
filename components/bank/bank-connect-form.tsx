"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const providers = ["Chase", "Bank of America", "Wells Fargo", "Other Bank"];

export function BankConnectForm() {
  const router = useRouter();
  const [bankName, setBankName] = useState(providers[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [bankError, setBankError] = useState("");

  const onConnect = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setBankError("");

    if (!bankName) {
      setBankError("Select a bank provider.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/bank-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bank_name: bankName }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Failed to connect bank account.");
      setLoading(false);
      return;
    }

    setMessage("Bank account connected successfully.");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={onConnect} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-5">
      <label className="text-sm font-semibold text-slate-700">Connect Bank Account</label>
      <select
        value={bankName}
        onChange={(event) => {
          setBankName(event.target.value);
          setBankError("");
        }}
        className={`w-full rounded-xl border px-3 py-2 ${bankError ? "border-rose-500" : "border-slate-200"}`}
      >
        {providers.map((provider) => (
          <option key={provider} value={provider}>
            {provider}
          </option>
        ))}
      </select>
      {bankError && <p className="text-xs text-rose-600">{bankError}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70 sm:w-auto"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Connecting..." : "Connect"}
      </button>
      {message && <p className={`text-sm ${message.includes("successfully") ? "text-slate-600" : "text-rose-600"}`}>{message}</p>}
    </form>
  );
}
