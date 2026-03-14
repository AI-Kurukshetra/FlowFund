import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRiskAlerts } from "@/lib/risk-alerts";
import { recalculateFinancialInsights } from "@/lib/financial-intelligence";
import { recalculateUnderwritingExplanation } from "@/lib/underwriting-explanation";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function cents(value: number) {
  return Number(value.toFixed(2));
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userCode = Array.from(user.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const revenueBase = 180000 + (userCode % 8) * 12000;
  const annualRevenue = cents(revenueBase);
  const monthlyRevenue = cents(annualRevenue / 12);
  const monthlyExpenses = cents(monthlyRevenue * 0.62);
  const monthlyCashFlow = cents(monthlyRevenue - monthlyExpenses);
  const creditLimit = cents(Math.max(40000, annualRevenue * 0.24));
  const usedCredit = cents(creditLimit * 0.36);
  const availableCredit = cents(creditLimit - usedCredit);
  const loanPrincipal = cents(Math.min(50000, creditLimit * 0.7));
  const outstandingBalance = cents(loanPrincipal * 0.68);
  const nowIso = new Date().toISOString();

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

  const { data: business, error: businessError } = existingBusiness
    ? await supabase
        .from("businesses")
        .update({
          legal_name: "FlowFund Demo Trading LLC",
          dba_name: "Demo Trading Co",
          industry: "Retail",
          annual_revenue: annualRevenue,
          years_in_business: 4,
          updated_at: nowIso,
        })
        .eq("id", existingBusiness.id)
        .select("id")
        .single()
    : await supabase
        .from("businesses")
        .insert({
          owner_user_id: user.id,
          legal_name: "FlowFund Demo Trading LLC",
          dba_name: "Demo Trading Co",
          industry: "Retail",
          annual_revenue: annualRevenue,
          years_in_business: 4,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select("id")
        .single();

  if (businessError || !business) {
    return NextResponse.json({ error: businessError?.message ?? "Unable to create demo business." }, { status: 400 });
  }

  const { data: existingKyc } = await supabase
    .from("kyc_records")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!existingKyc) {
    const { error: kycError } = await supabase.from("kyc_records").insert({
      user_id: user.id,
      owner_full_name: "Demo Owner",
      business_registration_number: `REG-${String(userCode).slice(-6)}`,
      business_address: "221 Market Street, San Francisco, CA",
      tax_id: `TAX-${String(userCode).slice(-6)}`,
      identity_document_url: "https://example.com/demo-identity.pdf",
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (kycError) {
      return NextResponse.json({ error: kycError.message }, { status: 400 });
    }
  }

  const { error: creditLineError } = await supabase.from("credit_lines").upsert(
    {
      business_id: business.id,
      credit_limit: creditLimit,
      used_credit: usedCredit,
      available_credit: availableCredit,
      last_adjustment_date: daysAgo(10).toISOString(),
      created_at: daysAgo(59).toISOString(),
      updated_at: nowIso,
    },
    { onConflict: "business_id" },
  );

  if (creditLineError) {
    return NextResponse.json({ error: creditLineError.message }, { status: 400 });
  }

  const { data: bankCountRows } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("business_id", business.id)
    .limit(1);

  if (!bankCountRows?.length) {
    const { error: bankError } = await supabase.from("bank_accounts").insert({
      business_id: business.id,
      bank_name: "Chase",
      account_type: "business_checking",
      monthly_revenue: monthlyRevenue,
      monthly_expenses: monthlyExpenses,
      monthly_cash_flow: monthlyCashFlow,
      connected_at: daysAgo(45).toISOString(),
      created_at: daysAgo(45).toISOString(),
    });

    if (bankError) {
      return NextResponse.json({ error: bankError.message }, { status: 400 });
    }
  }

  const { data: latestApp } = await supabase
    .from("loan_applications")
    .select("id")
    .eq("business_id", business.id)
    .eq("loan_status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let approvedApplicationId = latestApp?.id ?? null;

  if (!approvedApplicationId) {
    const { data: application, error: appError } = await supabase
      .from("loan_applications")
      .insert({
        business_id: business.id,
        applicant_user_id: user.id,
        requested_amount: loanPrincipal,
        approved_amount: loanPrincipal,
        interest_rate: 10.5,
        term_months: 12,
        risk_score: 720,
        loan_status: "approved",
        purpose: "Inventory expansion and payment cycle smoothing",
        monthly_revenue: monthlyRevenue,
        monthly_expenses: monthlyExpenses,
        existing_debt: 15000,
        credit_score: 721,
        decision_status: "approved",
        decision_reason: "Demo approval generated from strong revenue and healthy cash flow.",
        submitted_at: daysAgo(60).toISOString(),
        decided_at: daysAgo(59).toISOString(),
        created_at: daysAgo(60).toISOString(),
        updated_at: nowIso,
      })
      .select("id")
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: appError?.message ?? "Unable to create approved demo application." }, { status: 400 });
    }

    approvedApplicationId = application.id;
  }

  const { data: reviewApp } = await supabase
    .from("loan_applications")
    .select("id")
    .eq("business_id", business.id)
    .eq("loan_status", "review")
    .limit(1)
    .maybeSingle();

  if (!reviewApp) {
    await supabase.from("loan_applications").insert({
      business_id: business.id,
      applicant_user_id: user.id,
      requested_amount: 18000,
      approved_amount: 0,
      interest_rate: 0,
      term_months: 12,
      risk_score: 610,
      loan_status: "review",
      purpose: "Seasonal marketing campaign",
      monthly_revenue: monthlyRevenue * 0.35,
      monthly_expenses: monthlyExpenses * 0.5,
      existing_debt: 12000,
      credit_score: 615,
      decision_status: "manual_review",
      decision_reason: "Submitted for manual underwriting due to lower revenue pattern.",
      submitted_at: daysAgo(4).toISOString(),
      decided_at: daysAgo(3).toISOString(),
      created_at: daysAgo(4).toISOString(),
      updated_at: nowIso,
    });
  }

  const { data: creditLine } = await supabase
    .from("credit_lines")
    .select("id")
    .eq("business_id", business.id)
    .maybeSingle();

  const { data: existingLoan } = await supabase
    .from("loans")
    .select("id")
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let activeLoanId = existingLoan?.id ?? null;
  if (!activeLoanId) {
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .insert({
        application_id: approvedApplicationId,
        business_id: business.id,
        borrower_user_id: user.id,
        credit_line_id: creditLine?.id ?? null,
        principal_amount: loanPrincipal,
        outstanding_balance: outstandingBalance,
        apr: 10.5,
        term_months: 12,
        start_date: daysAgo(59).toISOString().slice(0, 10),
        maturity_date: addMonths(daysAgo(59), 12).toISOString().slice(0, 10),
        status: "active",
        created_at: daysAgo(59).toISOString(),
        updated_at: nowIso,
      })
      .select("id")
      .single();

    if (loanError || !loan) {
      return NextResponse.json({ error: loanError?.message ?? "Unable to create demo loan." }, { status: 400 });
    }

    activeLoanId = loan.id;
  }

  if (!activeLoanId) {
    return NextResponse.json({ error: "Unable to identify active demo loan." }, { status: 400 });
  }

  const { data: paymentRows } = await supabase
    .from("payments")
    .select("id")
    .eq("loan_id", activeLoanId)
    .limit(1);

  if (!paymentRows?.length) {
    const paid1 = cents(loanPrincipal * 0.11);
    const paid2 = cents(loanPrincipal * 0.12);
    const upcoming = cents(loanPrincipal * 0.1);
    const future1 = cents(loanPrincipal * 0.1);
    const future2 = cents(loanPrincipal * 0.1);
    const future3 = cents(loanPrincipal * 0.1);

    const paymentSchedule = [
      { due: daysAgo(45), amount: paid1, status: "paid", paidAt: daysAgo(45).toISOString() },
      { due: daysAgo(15), amount: paid2, status: "paid", paidAt: daysAgo(15).toISOString() },
      { due: daysFromNow(15), amount: upcoming, status: "scheduled", paidAt: null },
      { due: daysFromNow(45), amount: future1, status: "scheduled", paidAt: null },
      { due: daysFromNow(75), amount: future2, status: "scheduled", paidAt: null },
      { due: daysFromNow(105), amount: future3, status: "scheduled", paidAt: null },
    ];

    const { error: paymentInsertError } = await supabase.from("payments").insert(
      paymentSchedule.map((row) => ({
        loan_id: activeLoanId,
        business_id: business.id,
        payer_user_id: user.id,
        amount: row.amount,
        principal_component: cents(row.amount * 0.9),
        interest_component: cents(row.amount * 0.1),
        due_date: row.due.toISOString().slice(0, 10),
        paid_at: row.paidAt,
        status: row.status,
        created_at: row.due.toISOString(),
        updated_at: nowIso,
      })),
    );

    if (paymentInsertError) {
      return NextResponse.json({ error: paymentInsertError.message }, { status: 400 });
    }

    const { error: scheduleInsertError } = await supabase.from("repayment_schedules").insert(
      paymentSchedule.map((row) => ({
        loan_id: activeLoanId,
        due_date: row.due.toISOString().slice(0, 10),
        amount: row.amount,
        status: row.status === "paid" ? "paid" : "scheduled",
        created_at: row.due.toISOString(),
      })),
    );

    if (scheduleInsertError) {
      return NextResponse.json({ error: scheduleInsertError.message }, { status: 400 });
    }
  }

  const { data: invoiceRows } = await supabase
    .from("invoices")
    .select("id")
    .eq("business_id", business.id)
    .limit(1);

  if (!invoiceRows?.length) {
    const { error: invoiceError } = await supabase.from("invoices").insert([
      {
        business_id: business.id,
        invoice_number: `INV-${String(userCode).slice(-4)}-1001`,
        client_name: "Northstar Foods Inc.",
        invoice_amount: 10000,
        due_date: daysFromNow(20).toISOString().slice(0, 10),
        status: "financed",
        advance_amount: 8000,
        invoice_document_url: "https://example.com/invoices/inv-1001.pdf",
        created_at: daysAgo(20).toISOString(),
        updated_at: nowIso,
      },
      {
        business_id: business.id,
        invoice_number: `INV-${String(userCode).slice(-4)}-1002`,
        client_name: "Harbor Logistics LLC",
        invoice_amount: 24000,
        due_date: daysFromNow(28).toISOString().slice(0, 10),
        status: "pending_approval",
        advance_amount: 0,
        invoice_document_url: "https://example.com/invoices/inv-1002.pdf",
        created_at: daysAgo(3).toISOString(),
        updated_at: nowIso,
      },
      {
        business_id: business.id,
        invoice_number: `INV-${String(userCode).slice(-4)}-1003`,
        client_name: "Northstar Foods Inc.",
        invoice_amount: 7600,
        due_date: daysFromNow(12).toISOString().slice(0, 10),
        status: "approved",
        advance_amount: 0,
        invoice_document_url: "https://example.com/invoices/inv-1003.pdf",
        created_at: daysAgo(6).toISOString(),
        updated_at: nowIso,
      },
    ]);

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 400 });
    }
  }

  const { data: notificationRows } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!notificationRows?.length) {
    await supabase.from("notifications").insert([
      {
        user_id: user.id,
        category: "loan_approved",
        title: "Loan decision ready",
        message: `Loan approved for $${loanPrincipal.toLocaleString("en-US")}.`,
        related_loan_id: activeLoanId,
        created_at: daysAgo(59).toISOString(),
      },
      {
        user_id: user.id,
        category: "payment_received",
        title: "Payment received",
        message: "Payment of $5,000 was recorded on your active loan.",
        related_loan_id: activeLoanId,
        created_at: daysAgo(15).toISOString(),
      },
      {
        user_id: user.id,
        category: "payment_due",
        title: "Payment due soon",
        message: "Upcoming payment due in 15 days.",
        related_loan_id: activeLoanId,
        created_at: nowIso,
      },
    ]);
  }

  await generateRiskAlerts({
    supabase,
    businessId: business.id,
    userId: user.id,
  });
  await recalculateFinancialInsights(supabase, business.id);
  await recalculateUnderwritingExplanation(supabase, business.id);

  return NextResponse.json({
    success: true,
    seeded: true,
    message: "User-specific demo data loaded with realistic lending activity.",
  });
}
