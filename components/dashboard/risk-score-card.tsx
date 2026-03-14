import { Badge } from "@/components/ui/badge";
import { getRiskMeta } from "@/lib/underwritingEngine";

export function RiskScoreCard({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Risk Score</p>
          <Badge label="No Data" tone="neutral" />
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">N/A</p>
        <p className="text-sm text-slate-500">Credit Category: N/A</p>
      </div>
    );
  }

  const risk = getRiskMeta(score);
  const tone = risk.tone === "green" ? "success" : risk.tone === "yellow" ? "warning" : "danger";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Risk Score</p>
        <Badge label={risk.level} tone={tone} />
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{score}</p>
      <p className="text-sm text-slate-500">Credit Category: {risk.category}</p>
    </div>
  );
}
