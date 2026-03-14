import type { SupabaseClient } from "@supabase/supabase-js";

type FundingRecommendation = {
  product: string;
  message: string;
};

type InsightPayload = {
  loanHealthScore: number;
  recommendation: string;
  cashFlow30: number;
  cashFlow60: number;
  cashFlow90: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function getFundingRecommendation(
  supabase: SupabaseClient,
  businessId: string,
): Promise<FundingRecommendation> {
  const [{ data: business }, { data: invoices }, { data: bank }, { data: creditLine }, { data: payments }] =
    await Promise.all([
      supabase.from("businesses").select("annual_revenue").eq("id", businessId).maybeSingle(),
      supabase.from("invoices").select("invoice_amount").eq("business_id", businessId),
      supabase
        .from("bank_accounts")
        .select("monthly_cash_flow")
        .eq("business_id", businessId)
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("credit_lines").select("credit_limit,used_credit").eq("business_id", businessId).maybeSingle(),
      supabase.from("payments").select("status").eq("business_id", businessId),
    ]);

  const annualRevenue = Number(business?.annual_revenue ?? 0);
  const invoiceValue = (invoices ?? []).reduce((sum, row) => sum + Number(row.invoice_amount ?? 0), 0);
  const monthlyCashFlow = Number(bank?.monthly_cash_flow ?? 0);
  const creditLimit = Number(creditLine?.credit_limit ?? 0);
  const usedCredit = Number(creditLine?.used_credit ?? 0);
  const utilization = creditLimit > 0 ? usedCredit / creditLimit : 0;

  const paidPayments = (payments ?? []).filter((row) => row.status === "paid").length;
  const totalPayments = Math.max((payments ?? []).length, 1);
  const repaymentRate = paidPayments / totalPayments;

  if (invoiceValue > 3000) {
    return {
      product: "Invoice Financing",
      message: `Advance up to $${Math.round(invoiceValue * 0.8).toLocaleString("en-US")} based on current receivables.`,
    };
  }

  if (monthlyCashFlow > 5000) {
    const suggestedLimit = creditLimit > 0 ? Math.round(creditLimit * 1.2) : 10000;
    return {
      product: "Credit Line Increase",
      message: `Strong cash flow detected. You may qualify for a limit increase up to $${suggestedLimit.toLocaleString("en-US")}.`,
    };
  }

  if (annualRevenue < 50000) {
    return {
      product: "Working Capital Micro Loan",
      message: "Start with a smaller working capital loan to build repayment history and improve terms.",
    };
  }

  if (utilization > 0.8 && repaymentRate < 0.7) {
    return {
      product: "Repayment Stabilization Plan",
      message: "High utilization and weaker repayment trend detected. Prioritize repayment to unlock better financing options.",
    };
  }

  return {
    product: "Credit Line",
    message: "Maintain current performance to unlock better pricing and larger funding options.",
  };
}

export function getLoanHealthCategory(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Watchlist";
  return "High Risk";
}

export async function recalculateFinancialInsights(
  supabase: SupabaseClient,
  businessId: string,
): Promise<InsightPayload | null> {
  const today = new Date();
  const dayMs = 1000 * 60 * 60 * 24;

  const [
    { data: creditLine },
    { data: payments },
    { data: bank },
    { data: schedules },
    { data: invoices },
    recommendation,
  ] = await Promise.all([
    supabase.from("credit_lines").select("credit_limit,used_credit").eq("business_id", businessId).maybeSingle(),
    supabase.from("payments").select("status").eq("business_id", businessId),
    supabase
      .from("bank_accounts")
      .select("monthly_revenue,monthly_expenses,monthly_cash_flow")
      .eq("business_id", businessId)
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("repayment_schedules").select("due_date,amount,status,loan_id").in("loan_id", (
      await supabase.from("loans").select("id").eq("business_id", businessId)
    ).data?.map((row) => row.id) ?? ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("invoices")
      .select("invoice_amount,due_date,status")
      .eq("business_id", businessId)
      .in("status", ["pending", "approved", "pending_approval"]),
    getFundingRecommendation(supabase, businessId),
  ]);

  const paidCount = (payments ?? []).filter((row) => row.status === "paid").length;
  const repaymentScore = ((payments ?? []).length ? paidCount / (payments ?? []).length : 1) * 100;

  const creditLimit = Number(creditLine?.credit_limit ?? 0);
  const usedCredit = Number(creditLine?.used_credit ?? 0);
  const utilization = creditLimit > 0 ? usedCredit / creditLimit : 0;
  const utilizationScore = clamp((1 - utilization) * 100, 0, 100);

  const monthlyCashFlow = Number(bank?.monthly_cash_flow ?? 0);
  const cashFlowScore = monthlyCashFlow <= 0 ? 30 : clamp((monthlyCashFlow / 10000) * 100, 0, 100);

  const loanHealthScore = Math.round(repaymentScore * 0.4 + utilizationScore * 0.3 + cashFlowScore * 0.3);

  const monthlyRevenue = Number(bank?.monthly_revenue ?? 0);
  const monthlyExpenses = Number(bank?.monthly_expenses ?? 0);

  const repaymentsWithinDays = (days: number) =>
    (schedules ?? [])
      .filter((row) => {
        if (row.status === "paid") return false;
        const due = new Date(`${row.due_date}T00:00:00`);
        const diff = Math.ceil((due.getTime() - today.getTime()) / dayMs);
        return diff >= 0 && diff <= days;
      })
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  const invoiceInflowsWithinDays = (days: number) =>
    (invoices ?? [])
      .filter((row) => {
        const due = new Date(`${row.due_date}T00:00:00`);
        const diff = Math.ceil((due.getTime() - today.getTime()) / dayMs);
        return diff >= 0 && diff <= days;
      })
      .reduce((sum, row) => sum + Number(row.invoice_amount ?? 0), 0);

  const periodNet = (days: number) => {
    const operatingNet = (monthlyRevenue - monthlyExpenses) * (days / 30);
    const repayments = repaymentsWithinDays(days);
    const invoiceInflows = invoiceInflowsWithinDays(days);
    return Number((operatingNet - repayments + invoiceInflows).toFixed(2));
  };

  const insightPayload: InsightPayload = {
    loanHealthScore,
    recommendation: `${recommendation.product}: ${recommendation.message}`,
    cashFlow30: periodNet(30),
    cashFlow60: periodNet(60),
    cashFlow90: periodNet(90),
  };

  const { error } = await supabase.from("financial_insights").upsert({
    business_id: businessId,
    loan_health_score: insightPayload.loanHealthScore,
    recommendation: insightPayload.recommendation,
    cash_flow_30: insightPayload.cashFlow30,
    cash_flow_60: insightPayload.cashFlow60,
    cash_flow_90: insightPayload.cashFlow90,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return null;
  }

  return insightPayload;
}
