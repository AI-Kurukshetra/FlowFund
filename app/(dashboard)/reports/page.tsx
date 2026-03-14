import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: loans } = await supabase
    .from("loans")
    .select("id,principal_amount,outstanding_balance,status")
    .order("created_at", { ascending: false });
  const { data: payments } = await supabase.from("payments").select("id,amount,paid_at,status");

  const totalLoansIssued = (loans ?? []).reduce((acc, loan) => acc + Number(loan.principal_amount ?? 0), 0);
  const outstandingBalance = (loans ?? []).reduce((acc, loan) => acc + Number(loan.outstanding_balance ?? 0), 0);
  const totalRepayments = (payments ?? [])
    .filter((payment) => payment.status === "paid")
    .reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0);
  const defaultRate = loans && loans.length ? (loans.filter((loan) => loan.status === "defaulted").length / loans.length) * 100 : 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
        <p className="text-sm text-slate-500">Real-time summary of your loan portfolio performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Total Loans Issued</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">${totalLoansIssued.toLocaleString("en-US")}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">${outstandingBalance.toLocaleString("en-US")}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Repayments</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">${totalRepayments.toLocaleString("en-US")}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Default Rate</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{defaultRate.toFixed(1)}%</p>
        </Card>
      </div>

      <Card title="Loan Portfolio" subtitle="Individual loan status and repayments.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-2 py-3 font-medium">Loan ID</th>
                <th className="px-2 py-3 font-medium">Limit</th>
                <th className="px-2 py-3 font-medium">Outstanding</th>
                <th className="px-2 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans?.map((loan) => (
                <tr key={loan.id} className="border-b border-slate-100">
                  <td className="px-2 py-3 font-medium text-slate-900">{loan.id.slice(0, 8)}</td>
                  <td className="px-2 py-3 text-slate-600">${Number(loan.principal_amount ?? 0).toLocaleString("en-US")}</td>
                  <td className="px-2 py-3 text-slate-600">${Number(loan.outstanding_balance ?? 0).toLocaleString("en-US")}</td>
                  <td className="px-2 py-3 text-slate-600">{loan.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
