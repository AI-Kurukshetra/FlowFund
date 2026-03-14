import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adjustCreditLimit } from "@/lib/credit-limit";
import { generateRiskAlerts } from "@/lib/risk-alerts";
import { recalculateFinancialInsights } from "@/lib/financial-intelligence";
import { recalculateUnderwritingExplanation } from "@/lib/underwriting-explanation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const loanId = String(body.loanId ?? "");
  const requestedAmount = Number(body.amount);

  if (!loanId || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return NextResponse.json({ error: "Invalid payment input." }, { status: 400 });
  }

  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("id,business_id,borrower_user_id,credit_line_id,outstanding_balance,status")
    .eq("id", loanId)
    .eq("borrower_user_id", user.id)
    .maybeSingle();

  if (loanError) {
    return NextResponse.json({ error: loanError.message }, { status: 400 });
  }

  if (!loan) {
    return NextResponse.json({ error: "Loan not found." }, { status: 404 });
  }

  if (loan.status !== "active") {
    return NextResponse.json({ error: "Only active loans can receive payments." }, { status: 400 });
  }

  const outstandingBalance = Number(loan.outstanding_balance ?? 0);
  if (outstandingBalance <= 0) {
    return NextResponse.json({ error: "Loan is already fully paid." }, { status: 400 });
  }

  const appliedAmount = Math.min(requestedAmount, outstandingBalance);
  const newOutstandingBalance = Math.max(outstandingBalance - appliedAmount, 0);
  const nextStatus = newOutstandingBalance === 0 ? "paid_off" : "active";

  const nowIso = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
    loan_id: loan.id,
    business_id: loan.business_id,
    payer_user_id: user.id,
    amount: appliedAmount,
    principal_component: appliedAmount,
    interest_component: 0,
    due_date: today,
    paid_at: nowIso,
    status: "paid",
    updated_at: nowIso,
    })
    .select("id")
    .single();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("loans")
    .update({
      outstanding_balance: newOutstandingBalance,
      status: nextStatus,
      updated_at: nowIso,
    })
    .eq("id", loan.id)
    .eq("borrower_user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (loan.credit_line_id) {
    const adjustment = await adjustCreditLimit({
      supabase,
      businessId: loan.business_id,
      paymentAmount: appliedAmount,
      outstandingBeforePayment: outstandingBalance,
    });

    if (adjustment?.increased) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        category: "loan_approved",
        title: "Credit limit increased",
        message: `Your credit limit increased from $${adjustment.previousLimit.toLocaleString("en-US")} to $${adjustment.newLimit.toLocaleString("en-US")}.`,
        related_loan_id: loan.id,
        status: "unread",
      });
    }
  }

  const { data: nextSchedule, error: scheduleLookupError } = await supabase
    .from("repayment_schedules")
    .select("id")
    .eq("loan_id", loan.id)
    .eq("status", "scheduled")
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (scheduleLookupError) {
    return NextResponse.json({ error: scheduleLookupError.message }, { status: 400 });
  }

  if (nextSchedule) {
    const { error: scheduleUpdateError } = await supabase
      .from("repayment_schedules")
      .update({
        status: "paid",
      })
      .eq("id", nextSchedule.id);

    if (scheduleUpdateError) {
      return NextResponse.json({ error: scheduleUpdateError.message }, { status: 400 });
    }
  }

  await supabase.from("notifications").insert({
    user_id: user.id,
    category: "payment_received",
    title: "Payment received",
    message: `Payment of $${appliedAmount.toLocaleString("en-US")} was posted to your loan.`,
    related_loan_id: loan.id,
    related_payment_id: payment?.id ?? null,
  });

  await generateRiskAlerts({
    supabase,
    businessId: loan.business_id,
    userId: user.id,
  });

  await recalculateFinancialInsights(supabase, loan.business_id);
  await recalculateUnderwritingExplanation(supabase, loan.business_id);

  return NextResponse.json({
    success: true,
    appliedAmount,
    outstandingBalance: newOutstandingBalance,
    status: nextStatus,
  });
}
