"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LoadDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onLoad = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/seed-demo", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Unable to load demo data.");
        return;
      }

      setMessage(data.seeded ? "Demo data loaded." : data.message ?? "Data already available.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        onClick={onLoad}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Loading..." : "Load Demo Data"}
      </button>
      {message && <p className={`text-sm ${message.toLowerCase().includes("unable") ? "text-rose-600" : "text-slate-500"}`}>{message}</p>}
    </div>
  );
}
