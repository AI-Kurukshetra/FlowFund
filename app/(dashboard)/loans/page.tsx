import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MakePaymentButton } from "@/components/dashboard/make-payment-button";
import { createClient } from "@/lib/supabase/server";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "warning",
  paid_off: "success",
  defaulted: "danger",
  cancelled: "neutral",
};

export default async function LoansPage() {
  const supabase = await createClient();
  const { data: loans } = await supabase
    .from("loans")
    .select("id,application_id,principal_amount,outstanding_balance,term_months,status,apr,created_at")
    .order("created_at", { ascending: false });
  const { data: applications } = await supabase
    .from("loan_applications")
    .select("id,credit_score,risk_score")
    .order("created_at", { ascending: false });

  const creditScoreByApplicationId = new Map(
    (applications ?? []).map((application) => [application.id, application.risk_score ?? application.credit_score]),
  );
  const formatCurrency = (value: number) => `$${value.toLocaleString("en-US")}`;

  return (
    <Card title="Loan Management" subtitle="Track underwriting outcomes and active agreements.">
      <div className="space-y-4 md:hidden">
        {loans?.map((loan) => {
          const totalAmount = Number(loan.principal_amount ?? 0);
          const remaining = Number(loan.outstanding_balance ?? 0);
          const progressValue = totalAmount > 0 ? Math.round(((totalAmount - remaining) / totalAmount) * 100) : 0;
          const riskScore = loan.application_id ? creditScoreByApplicationId.get(loan.application_id) ?? "-" : "-";

          return (
            <div key={loan.id} className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Loan</p>
                  <p className="text-sm font-semibold text-slate-900">{loan.id.slice(0, 8)}</p>
                </div>
                <Badge label={loan.status.replace("_", " ")} tone={statusTone[loan.status] ?? "neutral"} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Outstanding</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(remaining)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Term</p>
                  <p className="font-semibold text-slate-900">{loan.term_months} mo</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">APR</p>
                  <p className="font-semibold text-slate-900">{loan.apr ?? "-"}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Risk Score</p>
                  <p className="font-semibold text-slate-900">{riskScore}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500">Repayment Progress</p>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-teal-600 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{progressValue}%</p>
              </div>
              <div className="mt-3">
                <MakePaymentButton loanId={loan.id} maxAmount={remaining} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-2 py-3 font-medium">Amount</th>
              <th className="px-2 py-3 font-medium">Outstanding</th>
              <th className="px-2 py-3 font-medium">Repayment Progress</th>
              <th className="px-2 py-3 font-medium">Term</th>
              <th className="px-2 py-3 font-medium">Risk Score</th>
              <th className="px-2 py-3 font-medium">APR</th>
              <th className="px-2 py-3 font-medium">Status</th>
              <th className="px-2 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loans?.map((loan) => {
              const totalAmount = Number(loan.principal_amount ?? 0);
              const remaining = Number(loan.outstanding_balance ?? 0);
              const progressValue = totalAmount > 0 ? Math.round(((totalAmount - remaining) / totalAmount) * 100) : 0;

              return (
                <tr key={loan.id} className="border-b border-slate-100 align-top">
                  <td className="px-2 py-3 font-medium text-slate-900">{formatCurrency(totalAmount)}</td>
                  <td className="px-2 py-3 text-slate-600">{formatCurrency(remaining)}</td>
                  <td className="px-2 py-3 text-slate-600">
                    <div className="min-w-40">
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-teal-600 transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{progressValue}%</p>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-slate-600">{loan.term_months} mo</td>
                  <td className="px-2 py-3 text-slate-600">
                    {loan.application_id ? creditScoreByApplicationId.get(loan.application_id) ?? "-" : "-"}
                  </td>
                  <td className="px-2 py-3 text-slate-600">{loan.apr ?? "-"}%</td>
                  <td className="px-2 py-3">
                    <Badge label={loan.status.replace("_", " ")} tone={statusTone[loan.status] ?? "neutral"} />
                  </td>
                  <td className="px-2 py-3">
                    <MakePaymentButton loanId={loan.id} maxAmount={remaining} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!loans?.length && <p className="mt-4 text-sm text-slate-500">No loan applications yet.</p>}
    </Card>
  );
}
