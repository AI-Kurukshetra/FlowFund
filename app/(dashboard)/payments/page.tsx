import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  scheduled: "warning",
  late: "danger",
  failed: "danger",
  overdue: "danger",
};

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from("repayment_schedules")
    .select("id,loan_id,due_date,amount,status")
    .order("due_date", { ascending: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("id,loan_id,amount,due_date,paid_at,status")
    .order("created_at", { ascending: false })
    .limit(12);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (schedules ?? []).filter((item) => item.status !== "paid" && item.due_date >= today);
  const past = (payments ?? []).filter((item) => item.status === "paid" || (item.due_date ?? "") < today);

  return (
    <div className="space-y-6">
      <Card title="Upcoming Payments" subtitle="Scheduled installments from automated repayment plans.">
        <div className="space-y-3">
          {upcoming.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="font-semibold text-slate-900">{payment.due_date}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Loan</p>
                <p className="font-semibold text-slate-900">{payment.loan_id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Amount</p>
                <p className="font-semibold text-slate-900">
                  ${Number(payment.amount).toLocaleString("en-US")}
                </p>
              </div>
              <div>
                <Badge label={payment.status} tone={statusTone[payment.status] ?? "neutral"} />
              </div>
            </div>
          ))}
        </div>
        {!upcoming.length && <p className="text-sm text-slate-500">No upcoming payments scheduled.</p>}
      </Card>

      <Card title="Past Payments" subtitle="Completed and historical payment records.">
        <div className="space-y-3">
          {past.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm text-slate-500">Paid/Due Date</p>
                <p className="font-semibold text-slate-900">{payment.paid_at?.slice(0, 10) ?? payment.due_date}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Loan</p>
                <p className="font-semibold text-slate-900">{payment.loan_id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Amount</p>
                <p className="font-semibold text-slate-900">${Number(payment.amount).toLocaleString("en-US")}</p>
              </div>
              <div>
                <Badge label={payment.status} tone={statusTone[payment.status] ?? "neutral"} />
              </div>
            </div>
          ))}
        </div>
        {!past.length && <p className="text-sm text-slate-500">No past payments yet.</p>}
      </Card>
    </div>
  );
}
