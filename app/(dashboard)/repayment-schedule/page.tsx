import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  scheduled: "warning",
  overdue: "danger",
};

export default async function RepaymentSchedulePage() {
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from("repayment_schedules")
    .select("id,loan_id,due_date,amount,status")
    .order("due_date", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (schedules ?? []).filter((item) => item.status !== "paid" && item.due_date >= today);
  const past = (schedules ?? []).filter((item) => item.status === "paid" || item.due_date < today);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Repayment Schedule</h2>
        <p className="text-sm text-slate-500">Automated schedule for all active credit-line draws.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Upcoming Payments" subtitle="Scheduled installments due soon.">
          <div className="space-y-3">
            {upcoming.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Loan {item.loan_id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">Due {item.due_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(Number(item.amount ?? 0))}</p>
                  <Badge label={item.status} tone={statusTone[item.status] ?? "neutral"} />
                </div>
              </div>
            ))}
            {!upcoming.length && <p className="text-sm text-slate-500">No upcoming installments.</p>}
          </div>
        </Card>

        <Card title="Past Payments" subtitle="Paid or previously due installments.">
          <div className="space-y-3">
            {past.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Loan {item.loan_id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">Due {item.due_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(Number(item.amount ?? 0))}</p>
                  <Badge label={item.status} tone={statusTone[item.status] ?? "neutral"} />
                </div>
              </div>
            ))}
            {!past.length && <p className="text-sm text-slate-500">No historical installments yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
