import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BankConnectForm } from "@/components/bank/bank-connect-form";
import { createClient } from "@/lib/supabase/server";

export default async function BankConnectPage() {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: accounts } = business
    ? await supabase
        .from("bank_accounts")
        .select("id,bank_name,account_type,monthly_revenue,monthly_expenses,monthly_cash_flow,connected_at")
        .eq("business_id", business.id)
        .order("connected_at", { ascending: false })
    : { data: [] };

  const activeAccount = accounts?.[0] ?? null;

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Bank Account Connection</h2>
        <p className="text-sm text-slate-500">Connect a provider to import monthly cash flow signals (simulated).</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <BankConnectForm />

        <Card title="Connected Bank Data" subtitle="Used in risk and cash flow forecasting." className="min-w-0">
          {activeAccount ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{activeAccount.bank_name}</p>
                <Badge label="Connected" tone="success" />
              </div>
              <p className="break-words text-xs uppercase tracking-wide text-slate-500">{activeAccount.account_type.replace("_", " ")}</p>
              <div className="grid gap-2 text-sm">
                <p className="text-slate-600">Monthly Revenue: <span className="font-semibold text-slate-900">{formatCurrency(Number(activeAccount.monthly_revenue ?? 0))}</span></p>
                <p className="text-slate-600">Monthly Expenses: <span className="font-semibold text-slate-900">{formatCurrency(Number(activeAccount.monthly_expenses ?? 0))}</span></p>
                <p className="text-slate-600">Net Cash Flow: <span className={`font-semibold ${Number(activeAccount.monthly_cash_flow ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{Number(activeAccount.monthly_cash_flow ?? 0) >= 0 ? "+" : "-"}{formatCurrency(Math.abs(Number(activeAccount.monthly_cash_flow ?? 0)))}</span></p>
              </div>
              <p className="text-xs text-slate-500">Connected {new Date(activeAccount.connected_at).toLocaleString()}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge label="Not connected" tone="warning" />
              <p className="text-sm text-slate-600">Connect a bank account to enable cash-flow based underwriting improvements.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
