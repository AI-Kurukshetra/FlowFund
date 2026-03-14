import type { SupabaseClient } from "@supabase/supabase-js";

type Alert = {
  alert_type: string;
  message: string;
  severity: "low" | "warning" | "high";
};

type GenerateRiskAlertsInput = {
  supabase: SupabaseClient;
  businessId: string;
  userId: string;
};

export async function generateRiskAlerts({
  supabase,
  businessId,
  userId,
}: GenerateRiskAlertsInput): Promise<void> {
  const [{ data: creditLine }, { data: overduePayments }, { data: bank }, { data: latestApp }, { data: existing }] =
    await Promise.all([
      supabase
        .from("credit_lines")
        .select("credit_limit,used_credit")
        .eq("business_id", businessId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id,due_date,status")
        .eq("business_id", businessId)
        .neq("status", "paid")
        .lt("due_date", new Date().toISOString().slice(0, 10)),
      supabase
        .from("bank_accounts")
        .select("monthly_cash_flow")
        .eq("business_id", businessId)
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("loan_applications")
        .select("risk_score")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("risk_alerts")
        .select("id,alert_type,status")
        .eq("business_id", businessId)
        .eq("status", "open"),
    ]);

  const alerts: Alert[] = [];

  const limit = Number(creditLine?.credit_limit ?? 0);
  const used = Number(creditLine?.used_credit ?? 0);
  if (limit > 0 && used / limit > 0.8) {
    alerts.push({
      alert_type: "high_utilization",
      message: "Credit utilization above 80%.",
      severity: "warning",
    });
  }

  if ((overduePayments ?? []).length > 0) {
    alerts.push({
      alert_type: "overdue_payment",
      message: `${(overduePayments ?? []).length} payment(s) are overdue.`,
      severity: "high",
    });
  }

  if (Number(bank?.monthly_cash_flow ?? 0) < 0) {
    alerts.push({
      alert_type: "negative_cash_flow",
      message: "Cash flow is negative based on your latest bank data.",
      severity: "warning",
    });
  }

  if (Number(latestApp?.risk_score ?? 999) < 620) {
    alerts.push({
      alert_type: "low_risk_score",
      message: "Risk score is below 620 and requires review.",
      severity: "high",
    });
  }

  const openByType = new Map((existing ?? []).map((row) => [row.alert_type, row]));

  for (const alert of alerts) {
    if (!openByType.has(alert.alert_type)) {
      await supabase.from("risk_alerts").insert({
        business_id: businessId,
        alert_type: alert.alert_type,
        message: alert.message,
        severity: alert.severity,
        status: "open",
      });

      await supabase.from("notifications").insert({
        user_id: userId,
        category: "loan_review",
        title: "Risk alert",
        message: alert.message,
        status: "unread",
      });
    }
  }

  const activeTypes = new Set(alerts.map((item) => item.alert_type));
  const resolvedIds = (existing ?? [])
    .filter((row) => !activeTypes.has(row.alert_type))
    .map((row) => row.id);

  if (resolvedIds.length) {
    await supabase.from("risk_alerts").update({ status: "resolved" }).in("id", resolvedIds);
  }
}
