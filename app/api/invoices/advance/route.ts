import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRiskAlerts } from "@/lib/risk-alerts";
import { recalculateFinancialInsights } from "@/lib/financial-intelligence";
import { recalculateUnderwritingExplanation } from "@/lib/underwriting-explanation";

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await request.json();
  const id = String(invoiceId ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Missing invoice id." }, { status: 400 });
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (businessError || !business) {
    return NextResponse.json({ error: businessError?.message ?? "Business profile not found." }, { status: 400 });
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id,business_id,invoice_amount,status")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: invoiceError?.message ?? "Invoice not found." }, { status: 404 });
  }

  if (invoice.status === "financed") {
    return NextResponse.json({ error: "Invoice already financed." }, { status: 400 });
  }

  const invoiceAmount = Number(invoice.invoice_amount ?? 0);
  if (invoiceAmount > 20000) {
    const { error: pendingError } = await supabase
      .from("invoices")
      .update({ status: "pending_approval", updated_at: new Date().toISOString() })
      .eq("id", invoice.id);

    if (pendingError) {
      return NextResponse.json({ error: pendingError.message }, { status: 400 });
    }

    await supabase.from("notifications").insert({
      user_id: user.id,
      category: "loan_review",
      title: "Invoice pending approval",
      message: `Invoice ${invoice.id.slice(0, 8)} requires manual review before funding.`,
      status: "unread",
    });

    await generateRiskAlerts({
      supabase,
      businessId: business.id,
      userId: user.id,
    });

    await recalculateFinancialInsights(supabase, business.id);
    await recalculateUnderwritingExplanation(supabase, business.id);

    return NextResponse.json({ success: true, status: "pending_approval", message: "Invoice requires manual approval." });
  }

  const advanceAmount = Number((invoiceAmount * 0.8).toFixed(2));

  const { data: creditLine, error: creditLineError } = await supabase
    .from("credit_lines")
    .select("id,credit_limit,used_credit,available_credit")
    .eq("business_id", business.id)
    .maybeSingle();

  if (creditLineError || !creditLine) {
    return NextResponse.json({ error: creditLineError?.message ?? "Credit line not available." }, { status: 400 });
  }

  const availableCredit = Number(creditLine.available_credit ?? 0);
  if (advanceAmount > availableCredit) {
    return NextResponse.json({ error: "Not enough available credit to fund this invoice." }, { status: 400 });
  }

  const termMonths = 4;
  const apr = 12;
  const nowIso = new Date().toISOString();
  const startDate = new Date();
  const maturityDate = addMonths(startDate, termMonths).toISOString().slice(0, 10);

  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .insert({
      business_id: business.id,
      borrower_user_id: user.id,
      credit_line_id: creditLine.id,
      principal_amount: advanceAmount,
      outstanding_balance: advanceAmount,
      apr,
      term_months: termMonths,
      start_date: startDate.toISOString().slice(0, 10),
      maturity_date: maturityDate,
      status: "active",
      updated_at: nowIso,
    })
    .select("id")
    .single();

  if (loanError || !loan) {
    return NextResponse.json({ error: loanError?.message ?? "Unable to create advance loan." }, { status: 400 });
  }

  const nextUsed = Number(creditLine.used_credit ?? 0) + advanceAmount;
  const creditLimit = Number(creditLine.credit_limit ?? 0);
  const baseAvailable = Math.max(creditLimit - nextUsed, 0);
  const utilization = creditLimit > 0 ? nextUsed / creditLimit : 0;
  const nextAvailable = utilization > 0.8 ? Math.min(baseAvailable, Number((creditLimit * 0.1).toFixed(2))) : baseAvailable;

  const { error: creditLineUpdateError } = await supabase
    .from("credit_lines")
    .update({
      used_credit: nextUsed,
      available_credit: nextAvailable,
      updated_at: nowIso,
    })
    .eq("id", creditLine.id);

  if (creditLineUpdateError) {
    return NextResponse.json({ error: creditLineUpdateError.message }, { status: 400 });
  }

  const monthlyAmount = Number((advanceAmount / termMonths).toFixed(2));
  const scheduleRows = Array.from({ length: termMonths }, (_, idx) => {
    const dueDate = addMonths(new Date(), idx + 1).toISOString().slice(0, 10);
    return {
      loan_id: loan.id,
      due_date: dueDate,
      amount: idx === termMonths - 1 ? Number((advanceAmount - monthlyAmount * (termMonths - 1)).toFixed(2)) : monthlyAmount,
      status: "scheduled",
    };
  });

  const { error: scheduleError } = await supabase.from("repayment_schedules").insert(scheduleRows);
  if (scheduleError) {
    return NextResponse.json({ error: scheduleError.message }, { status: 400 });
  }

  const paymentRows = scheduleRows.map((row) => ({
    loan_id: loan.id,
    business_id: business.id,
    payer_user_id: user.id,
    amount: row.amount,
    principal_component: row.amount,
    interest_component: 0,
    due_date: row.due_date,
    status: "scheduled",
    created_at: nowIso,
    updated_at: nowIso,
  }));

  const { error: paymentError } = await supabase.from("payments").insert(paymentRows);
  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 400 });
  }

  const { error: invoiceUpdateError } = await supabase
    .from("invoices")
    .update({
      status: "financed",
      advance_amount: advanceAmount,
      updated_at: nowIso,
    })
    .eq("id", invoice.id);

  if (invoiceUpdateError) {
    return NextResponse.json({ error: invoiceUpdateError.message }, { status: 400 });
  }

  await supabase.from("notifications").insert({
    user_id: user.id,
    category: "loan_approved",
    title: "Invoice advance funded",
    message: `Advance of $${advanceAmount.toLocaleString("en-US")} was paid on invoice ${invoice.id.slice(0, 8)}.`,
    related_loan_id: loan.id,
    status: "unread",
  });

  await generateRiskAlerts({
    supabase,
    businessId: business.id,
    userId: user.id,
  });

  await recalculateFinancialInsights(supabase, business.id);
  await recalculateUnderwritingExplanation(supabase, business.id);

  return NextResponse.json({ success: true, status: "financed", advanceAmount, loanId: loan.id });
}
