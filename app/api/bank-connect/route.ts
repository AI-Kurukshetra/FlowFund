import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const { bank_name } = await request.json();
  if (!bank_name) {
    return NextResponse.json({ error: "Bank name is required." }, { status: 400 });
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,annual_revenue")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (businessError || !business) {
    return NextResponse.json({ error: businessError?.message ?? "Business profile not found." }, { status: 400 });
  }

  const monthlyRevenue = Number((Number(business.annual_revenue ?? 0) / 12).toFixed(2));
  const monthlyExpenses = Number((monthlyRevenue * 0.6).toFixed(2));
  const monthlyCashFlow = Number((monthlyRevenue - monthlyExpenses).toFixed(2));

  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("bank_accounts").insert({
    business_id: business.id,
    bank_name,
    account_type: "business_checking",
    monthly_revenue: monthlyRevenue,
    monthly_expenses: monthlyExpenses,
    monthly_cash_flow: monthlyCashFlow,
    connected_at: nowIso,
    created_at: nowIso,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await generateRiskAlerts({
    supabase,
    businessId: business.id,
    userId: user.id,
  });

  await recalculateFinancialInsights(supabase, business.id);
  await recalculateUnderwritingExplanation(supabase, business.id);

  return NextResponse.json({ success: true });
}
