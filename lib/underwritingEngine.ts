export type UnderwritingStatus = "approved" | "partial_approved" | "review";

export type UnderwritingDecision = {
  status: UnderwritingStatus;
  riskScore: number;
  approvedAmount: number;
  interestRate: number;
  loanTerm: number;
  requestedAmount: number;
};

export function getRiskMeta(score: number) {
  if (score >= 720) {
    return { score, level: "Low Risk", category: "Prime", tone: "green" as const };
  }

  if (score >= 650) {
    return { score, level: "Medium Risk", category: "Standard", tone: "yellow" as const };
  }

  return { score, level: "High Risk", category: "Watchlist", tone: "red" as const };
}

export function evaluateUnderwriting({
  annualRevenue,
  yearsInBusiness,
  requestedLoanAmount,
}: {
  annualRevenue: number;
  yearsInBusiness: number;
  requestedLoanAmount: number;
}): UnderwritingDecision {
  if (annualRevenue > 150000) {
    return {
      status: "approved",
      riskScore: 720,
      approvedAmount: requestedLoanAmount,
      interestRate: 8,
      loanTerm: yearsInBusiness >= 3 ? 24 : 18,
      requestedAmount: requestedLoanAmount,
    };
  }

  if (annualRevenue > 50000) {
    return {
      status: "partial_approved",
      riskScore: 650,
      approvedAmount: Math.round(requestedLoanAmount * 0.7),
      interestRate: 10,
      loanTerm: yearsInBusiness >= 2 ? 18 : 12,
      requestedAmount: requestedLoanAmount,
    };
  }

  return {
    status: "review",
    riskScore: 600,
    approvedAmount: 0,
    interestRate: 0,
    loanTerm: 12,
    requestedAmount: requestedLoanAmount,
  };
}
