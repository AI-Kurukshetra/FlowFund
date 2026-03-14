import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type ResultPageProps = {
  searchParams: Promise<{ id?: string }>;
};

const statusMeta: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  approved: { label: "APPROVED", tone: "success" },
  partial_approved: { label: "PARTIAL APPROVAL", tone: "warning" },
  review: { label: "REVIEW", tone: "danger" },
};

export default async function ApplicationResultPage({ searchParams }: ResultPageProps) {
  const { id } = await searchParams;
  if (!id) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: application } = await supabase
    .from("loan_applications")
    .select("id,requested_amount,approved_amount,interest_rate,term_months,risk_score,loan_status,created_at")
    .eq("id", id)
    .eq("applicant_user_id", user.id)
    .maybeSingle();

  if (!application) {
    notFound();
  }

  const meta = statusMeta[application.loan_status] ?? { label: "REVIEW", tone: "neutral" as const };

  return (
    <Card title="Loan Decision" subtitle="Automated underwriting result for your submitted application.">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">Status</p>
          <Badge label={meta.label} tone={meta.tone} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Requested Amount</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              ${Number(application.requested_amount ?? 0).toLocaleString("en-US")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Approved Amount</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              ${Number(application.approved_amount ?? 0).toLocaleString("en-US")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Interest Rate</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{Number(application.interest_rate ?? 0)}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Loan Term</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{application.term_months} months</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
            <p className="text-sm text-slate-500">Risk Score</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{application.risk_score}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
