import type { SupabaseClient } from "@supabase/supabase-js";

type UnderwritingFactor = {
  label: string;
  impact: string;
  impactValue: number;
  description: string;
};

type UnderwritingRiskFlag = {
  label: string;
  description: string;
};

export type UnderwritingExplanation = {
  decision: "Approved" | "Conditional Approval" | "Review";
  confidence: number;
  factors: UnderwritingFactor[];
  risk_flags: UnderwritingRiskFlag[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatImpact(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

export async function generateUnderwritingExplanation(
  supabase: SupabaseClient,
  businessId: string,
): Promise<UnderwritingExplanation> {
  const [
    { data: business },
    { data: bankAccount },
    { data: creditLine },
    { data: payments },
    { data: invoices },
    { data: applications },
  ] = await Promise.all([
    supabase.from("businesses").select("annual_revenue").eq("id", businessId).maybeSingle(),
    supabase
      .from("bank_accounts")
      .select("monthly_cash_flow")
      .eq("business_id", businessId)
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("credit_lines").select("credit_limit,used_credit").eq("business_id", businessId).maybeSingle(),
    supabase.from("payments").select("status").eq("business_id", businessId),
    supabase.from("invoices").select("client_name,invoice_amount,status").eq("business_id", businessId),
    supabase
      .from("loan_applications")
      .select("risk_score,loan_status,created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const annualRevenue = Number(business?.annual_revenue ?? 0);
  const monthlyCashFlow = Number(bankAccount?.monthly_cash_flow ?? 0);
  const creditLimit = Number(creditLine?.credit_limit ?? 0);
  const usedCredit = Number(creditLine?.used_credit ?? 0);
  const utilization = creditLimit > 0 ? usedCredit / creditLimit : 0;

  const paidPayments = (payments ?? []).filter((row) => row.status === "paid").length;
  const totalPayments = (payments ?? []).length;
  const repaymentRate = totalPayments > 0 ? paidPayments / totalPayments : 1;

  const invoicePortfolioValue = (invoices ?? []).reduce((sum, row) => sum + Number(row.invoice_amount ?? 0), 0);
  const latestApp = applications?.[0] ?? null;
  const riskScore = Number(latestApp?.risk_score ?? 600);

  const factors: UnderwritingFactor[] = [];
  const riskFlags: UnderwritingRiskFlag[] = [];

  const revenueImpact = annualRevenue >= 100000 ? 20 : annualRevenue >= 50000 ? 10 : -12;
  factors.push({
    label: annualRevenue >= 100000 ? "Strong Revenue" : annualRevenue >= 50000 ? "Moderate Revenue" : "Weak Revenue",
    impact: formatImpact(revenueImpact),
    impactValue: revenueImpact,
    description:
      annualRevenue >= 100000
        ? "Annual revenue above $100k."
        : annualRevenue >= 50000
          ? "Annual revenue between $50k and $100k."
          : "Annual revenue below $50k.",
  });

  const cashFlowImpact = monthlyCashFlow > 5000 ? 18 : monthlyCashFlow > 0 ? 8 : -15;
  factors.push({
    label:
      monthlyCashFlow > 5000
        ? "Healthy Cash Flow"
        : monthlyCashFlow > 0
          ? "Positive Cash Flow"
          : "Negative Cash Flow",
    impact: formatImpact(cashFlowImpact),
    impactValue: cashFlowImpact,
    description:
      monthlyCashFlow > 5000
        ? "Monthly net cash flow above $5,000."
        : monthlyCashFlow > 0
          ? "Monthly net cash flow is positive."
          : "Monthly net cash flow is negative.",
  });

  const utilizationImpact = utilization < 0.4 ? 15 : utilization < 0.8 ? 6 : -18;
  factors.push({
    label:
      utilization < 0.4 ? "Low Credit Utilization" : utilization < 0.8 ? "Moderate Credit Utilization" : "High Credit Utilization",
    impact: formatImpact(utilizationImpact),
    impactValue: utilizationImpact,
    description:
      utilization < 0.4
        ? "Used credit is below 40%."
        : utilization < 0.8
          ? "Used credit is between 40% and 80%."
          : "Used credit is above 80%.",
  });

  const repaymentImpact = repaymentRate >= 0.9 ? 22 : repaymentRate >= 0.7 ? 10 : -20;
  factors.push({
    label:
      repaymentRate >= 0.9
        ? "Strong Repayment History"
        : repaymentRate >= 0.7
          ? "Moderate Repayment History"
          : "Weak Repayment History",
    impact: formatImpact(repaymentImpact),
    impactValue: repaymentImpact,
    description:
      repaymentRate >= 0.9
        ? "Most payments are on time."
        : repaymentRate >= 0.7
          ? "Some repayment volatility detected."
          : "Frequent missed or delayed payments.",
  });

  const invoiceImpact = invoicePortfolioValue > 3000 ? 12 : 0;
  factors.push({
    label: "Invoice Portfolio",
    impact: formatImpact(invoiceImpact),
    impactValue: invoiceImpact,
    description:
      invoicePortfolioValue > 3000
        ? `Receivables portfolio at $${Math.round(invoicePortfolioValue).toLocaleString("en-US")}.`
        : "Limited receivables history.",
  });

  const riskScoreImpact = riskScore >= 700 ? 15 : riskScore >= 620 ? 8 : -18;
  factors.push({
    label: "Model Risk Score",
    impact: formatImpact(riskScoreImpact),
    impactValue: riskScoreImpact,
    description: `Current risk score is ${riskScore}.`,
  });

  if (utilization > 0.8) {
    riskFlags.push({
      label: "Credit utilization risk",
      description: "Credit utilization is above 80% of limit.",
    });
  }
  if (monthlyCashFlow < 0) {
    riskFlags.push({
      label: "Cash flow pressure",
      description: "Monthly net cash flow is negative.",
    });
  }
  if (repaymentRate < 0.7) {
    riskFlags.push({
      label: "Repayment volatility",
      description: "Recent repayment behavior indicates elevated default risk.",
    });
  }
  if (riskScore < 620) {
    riskFlags.push({
      label: "Low risk score",
      description: "Risk score below 620 requires manual review.",
    });
  }

  const clientExposure = new Map<string, number>();
  for (const invoice of invoices ?? []) {
    const clientName = String(invoice.client_name ?? "Unknown");
    const amount = Number(invoice.invoice_amount ?? 0);
    clientExposure.set(clientName, (clientExposure.get(clientName) ?? 0) + amount);
  }
  const topClientValue = Math.max(...Array.from(clientExposure.values()), 0);
  const topClientShare = invoicePortfolioValue > 0 ? topClientValue / invoicePortfolioValue : 0;
  if (topClientShare >= 0.6 && invoicePortfolioValue > 0) {
    riskFlags.push({
      label: "Client concentration",
      description: "Large portion of receivables comes from a single client.",
    });
  }

  const confidenceRaw = 50 + factors.reduce((sum, factor) => sum + factor.impactValue, 0);
  const confidence = clamp(Math.round(confidenceRaw), 5, 99);

  const decision: UnderwritingExplanation["decision"] =
    confidence >= 75 && riskScore >= 650
      ? "Approved"
      : confidence >= 60 && riskScore >= 620
        ? "Conditional Approval"
        : "Review";

  return {
    decision,
    confidence,
    factors,
    risk_flags: riskFlags,
  };
}

export async function recalculateUnderwritingExplanation(
  supabase: SupabaseClient,
  businessId: string,
): Promise<UnderwritingExplanation | null> {
  const explanation = await generateUnderwritingExplanation(supabase, businessId);

  const { error } = await supabase.from("underwriting_explanations").insert({
    business_id: businessId,
    decision: explanation.decision,
    confidence_score: explanation.confidence,
    analysis_json: explanation,
  });

  if (error) {
    return null;
  }

  return explanation;
}
