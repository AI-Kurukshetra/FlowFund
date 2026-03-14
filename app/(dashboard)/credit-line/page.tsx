import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DrawFundsForm } from "@/components/credit-line/draw-funds-form";
import { createClient } from "@/lib/supabase/server";

export default async function CreditLinePage() {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: creditLine } = business
    ? await supabase
        .from("credit_lines")
        .select("id,credit_limit,used_credit,available_credit,created_at")
        .eq("business_id", business.id)
        .maybeSingle()
    : { data: null };

  const { data: loans } = await supabase
    .from("loans")
    .select("id,principal_amount,outstanding_balance,status,created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Credit Line</h2>
        <p className="text-sm text-slate-500">Manage revolving credit and draw working capital instantly.</p>
      </div>

      <Card title="Credit Line Overview" subtitle="Current credit position and draw capacity.">
        {creditLine ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                <p className="text-sm text-slate-500">Credit Limit</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(Number(creditLine.credit_limit))}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                <p className="text-sm text-slate-500">Used Credit</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(Number(creditLine.used_credit))}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                <p className="text-sm text-slate-500">Available Credit</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(Number(creditLine.available_credit))}</p>
              </div>
            </div>
            <DrawFundsForm maxAmount={Number(creditLine.available_credit)} />
          </div>
        ) : (
          <div className="space-y-2">
            <Badge label="No credit line yet" tone="warning" />
            <p className="text-sm text-slate-600">Submit a loan application and get approved to create your revolving credit line.</p>
          </div>
        )}
      </Card>

      <Card title="Recent Draws" subtitle="Loan records created from credit line draws.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-2 py-3 font-medium">Loan ID</th>
                <th className="px-2 py-3 font-medium">Drawn</th>
                <th className="px-2 py-3 font-medium">Outstanding</th>
                <th className="px-2 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans?.map((loan) => (
                <tr key={loan.id} className="border-b border-slate-100">
                  <td className="px-2 py-3 font-medium text-slate-900">{loan.id.slice(0, 8)}</td>
                  <td className="px-2 py-3 text-slate-600">{formatCurrency(Number(loan.principal_amount ?? 0))}</td>
                  <td className="px-2 py-3 text-slate-600">{formatCurrency(Number(loan.outstanding_balance ?? 0))}</td>
                  <td className="px-2 py-3">
                    <Badge
                      label={loan.status.replace("_", " ")}
                      tone={loan.status === "paid_off" ? "success" : loan.status === "active" ? "warning" : "danger"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loans?.length && <p className="text-sm text-slate-500">No draws yet.</p>}
      </Card>
    </div>
  );
}
