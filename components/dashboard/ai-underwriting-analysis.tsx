import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Factor = {
  label: string;
  impact: string;
  description: string;
};

type RiskFlag = {
  label: string;
  description: string;
};

type Props = {
  decision: string;
  confidence: number;
  factors: Factor[];
  riskFlags: RiskFlag[];
};

function impactTone(impact: string): "success" | "warning" | "danger" {
  const numeric = Number(impact);
  if (numeric >= 10) return "success";
  if (numeric >= 0) return "warning";
  return "danger";
}

export function AIUnderwritingAnalysis({ decision, confidence, factors, riskFlags }: Props) {
  const decisionTone: "success" | "warning" | "danger" =
    decision === "Approved" ? "success" : decision === "Conditional Approval" ? "warning" : "danger";

  return (
    <Card title="AI Credit Decision Insights" subtitle="Explainable underwriting factors behind your lending decision.">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-600">Decision:</p>
            <Badge label={decision.toUpperCase()} tone={decisionTone} />
            <Badge label={`Confidence ${confidence}%`} tone="neutral" />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-800">Factors Considered</p>
          <div className="mt-3 space-y-3">
            {factors.length ? (
              factors.map((factor) => (
                <div key={`${factor.label}-${factor.impact}`} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 ${
                    impactTone(factor.impact) === "success"
                      ? "text-emerald-600"
                      : impactTone(factor.impact) === "warning"
                        ? "text-amber-600"
                        : "text-rose-600"
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {factor.label} ({factor.impact})
                    </p>
                    <p className="text-xs text-slate-500">{factor.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-500">
                Underwriting analysis will appear after lending activity.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
          <p className="text-sm font-semibold text-slate-800">Risk Flags</p>
          <div className="mt-3 space-y-3">
            {riskFlags.length ? (
              riskFlags.map((flag) => (
                <div key={flag.label} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/70 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-600" />
                  <div>
                    <p className="text-sm font-semibold text-rose-700">{flag.label}</p>
                    <p className="text-xs text-rose-600">{flag.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                <p className="text-sm font-semibold text-emerald-700">No critical risk flags detected.</p>
                <p className="text-xs text-emerald-600">Current profile appears stable for lending decisions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
