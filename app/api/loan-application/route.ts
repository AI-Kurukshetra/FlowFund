import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateUnderwriting } from "@/lib/underwritingEngine";
import { recalculateUnderwritingExplanation } from "@/lib/underwriting-explanation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: kycRecord, error: kycError } = await supabase
    .from("kyc_records")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (kycError) {
    return NextResponse.json({ error: kycError.message }, { status: 400 });
  }

  if (!kycRecord) {
    return NextResponse.json(
      { error: "Complete KYC verification before applying for a loan." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const businessName = String(body.businessName ?? "").trim();
  const industry = String(body.industry ?? "").trim();
  const annualRevenue = Number(body.annualRevenue);
  const yearsInBusiness = Number(body.yearsInBusiness);
  const requestedAmount = Number(body.requestedAmount);
  const loanPurpose = String(body.loanPurpose ?? "").trim();

  if (
    !businessName ||
    !industry ||
    !loanPurpose ||
    annualRevenue < 0 ||
    yearsInBusiness < 0 ||
    requestedAmount <= 0
  ) {
    return NextResponse.json({ error: "Invalid form input." }, { status: 400 });
  }

  const businessPayload = {
    owner_user_id: user.id,
    legal_name: businessName,
    industry,
    annual_revenue: annualRevenue,
    years_in_business: yearsInBusiness,
    updated_at: new Date().toISOString(),
  };

  const { data: existingBusiness, error: businessLookupError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (businessLookupError) {
    return NextResponse.json({ error: businessLookupError.message }, { status: 400 });
  }

  const { data: business, error: businessUpsertError } = existingBusiness
    ? await supabase
        .from("businesses")
        .update(businessPayload)
        .eq("id", existingBusiness.id)
        .select("id")
        .single()
    : await supabase
        .from("businesses")
        .insert({ ...businessPayload, created_at: new Date().toISOString() })
        .select("id")
        .single();

  if (businessUpsertError || !business) {
    return NextResponse.json(
      { error: businessUpsertError?.message ?? "Unable to save business details." },
      { status: 400 },
    );
  }

  const decision = evaluateUnderwriting({
    annualRevenue,
    yearsInBusiness,
    requestedLoanAmount: requestedAmount,
  });
  const decisionStatus =
    decision.status === "approved"
      ? "approved"
      : decision.status === "partial_approved"
        ? "manual_review"
        : "pending";

  const decisionReason =
    decision.status === "approved"
      ? "Application approved based on annual revenue."
      : decision.status === "partial_approved"
        ? "Partially approved. Reduced limit based on annual revenue band."
        : "Application moved to review due to lower annual revenue.";

  const nowIso = new Date().toISOString();

  const { data: application, error: applicationError } = await supabase
    .from("loan_applications")
    .insert({
      business_id: business.id,
      applicant_user_id: user.id,
      requested_amount: decision.requestedAmount,
      approved_amount: decision.approvedAmount,
      interest_rate: decision.interestRate,
      term_months: decision.loanTerm,
      risk_score: decision.riskScore,
      loan_status: decision.status,
      purpose: loanPurpose,
      monthly_revenue: annualRevenue / 12,
      monthly_expenses: 0,
      existing_debt: 0,
      credit_score: decision.riskScore,
      decision_status: decisionStatus,
      decision_reason: decisionReason,
      decided_at: nowIso,
      updated_at: nowIso,
    })
    .select("id")
    .single();

  if (applicationError || !application) {
    return NextResponse.json({ error: applicationError?.message ?? "Failed to save application." }, { status: 400 });
  }

  if (decision.approvedAmount > 0) {
    const { data: existingCreditLine, error: creditLineLookupError } = await supabase
      .from("credit_lines")
      .select("id,credit_limit,used_credit")
      .eq("business_id", business.id)
      .maybeSingle();

    if (creditLineLookupError) {
      return NextResponse.json({ error: creditLineLookupError.message }, { status: 400 });
    }

    if (existingCreditLine) {
      const nextLimit = Math.max(Number(existingCreditLine.credit_limit ?? 0), decision.approvedAmount);
      const usedCredit = Number(existingCreditLine.used_credit ?? 0);
      const { error: creditLineUpdateError } = await supabase
        .from("credit_lines")
        .update({
          credit_limit: nextLimit,
          available_credit: Math.max(nextLimit - usedCredit, 0),
          updated_at: nowIso,
        })
        .eq("id", existingCreditLine.id);

      if (creditLineUpdateError) {
        return NextResponse.json({ error: creditLineUpdateError.message }, { status: 400 });
      }
    } else {
      const { error: creditLineCreateError } = await supabase.from("credit_lines").insert({
        business_id: business.id,
        credit_limit: decision.approvedAmount,
        used_credit: 0,
        available_credit: decision.approvedAmount,
      });

      if (creditLineCreateError) {
        return NextResponse.json({ error: creditLineCreateError.message }, { status: 400 });
      }
    }
  }

  await supabase.from("notifications").insert({
    user_id: user.id,
    category: decision.status === "review" ? "loan_review" : "loan_approved",
    title: decision.status === "review" ? "Loan under review" : "Loan decision ready",
    message:
      decision.status === "approved"
        ? `Loan approved for $${decision.approvedAmount.toLocaleString("en-US")}.`
        : decision.status === "partial_approved"
          ? `Partially approved for $${decision.approvedAmount.toLocaleString("en-US")}.`
          : "Application requires manual review.",
    related_loan_id: null,
  });

  await recalculateUnderwritingExplanation(supabase, business.id);

  return NextResponse.json({
    success: true,
    applicationId: application.id,
    decision: {
      status: decision.status,
      requestedAmount: decision.requestedAmount,
      approvedCreditAmount: decision.approvedAmount,
      interestRate: decision.interestRate,
      loanTermMonths: decision.loanTerm,
      riskScore: decision.riskScore,
      reason: decisionReason,
    },
  });
}
