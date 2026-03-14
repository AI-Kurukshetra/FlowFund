export type CreditInput = {
  monthlyRevenue: number;
  monthlyExpenses: number;
  requestedAmount: number;
  yearsInBusiness: number;
  existingDebt: number;
};

export type CreditDecision = {
  score: number;
  status: "approved" | "manual_review" | "declined";
  apr: number;
  reason: string;
  maxEligibleAmount: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function evaluateCredit(input: CreditInput): CreditDecision {
  const netMonthly = input.monthlyRevenue - input.monthlyExpenses;
  const debtLoadRatio = input.existingDebt / Math.max(input.monthlyRevenue * 12, 1);
  const businessMaturity = clamp(input.yearsInBusiness / 10, 0, 1);
  const affordability = clamp(netMonthly / Math.max(input.requestedAmount / 12, 1), 0, 2);

  const score = Math.round(
    clamp(
      300 +
        businessMaturity * 180 +
        affordability * 180 +
        (1 - clamp(debtLoadRatio, 0, 1)) * 140,
      300,
      850,
    ),
  );

  const maxEligibleAmount = Math.max(Math.round(netMonthly * 8), 5000);

  if (score >= 700 && input.requestedAmount <= maxEligibleAmount) {
    return {
      score,
      status: "approved",
      apr: 9.5,
      reason: "Strong cash flow and low leverage profile.",
      maxEligibleAmount,
    };
  }

  if (score >= 620 && input.requestedAmount <= maxEligibleAmount * 1.25) {
    return {
      score,
      status: "manual_review",
      apr: 14.2,
      reason: "Borderline risk profile. Requires underwriting review.",
      maxEligibleAmount,
    };
  }

  return {
    score,
    status: "declined",
    apr: 0,
    reason: "Insufficient affordability or elevated debt load.",
    maxEligibleAmount,
  };
}
