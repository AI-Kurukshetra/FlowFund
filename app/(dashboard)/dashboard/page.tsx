import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  CircleCheckBig,
  DollarSign,
  Landmark,
  ReceiptText,
  Waves,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { LoadDemoButton } from "@/components/dashboard/load-demo-button";
import { riskScoreFromRevenue } from "@/lib/underwriting";
import { RiskScoreCard } from "@/components/dashboard/risk-score-card";
import { DrawFundsForm } from "@/components/credit-line/draw-funds-form";
import { getLoanHealthCategory } from "@/lib/financial-intelligence";
import { AIUnderwritingAnalysis } from "@/components/dashboard/ai-underwriting-analysis";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: loans } = await supabase
    .from("loans")
    .select("id,principal_amount,outstanding_balance,status,start_date,maturity_date,term_months,apr,created_at")
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("id,due_date,status,amount,paid_at")
    .order("due_date", { ascending: true });

  const { data: business } = await supabase
    .from("businesses")
    .select("id,annual_revenue")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: creditLine } = business
    ? await supabase
        .from("credit_lines")
        .select("id,credit_limit,used_credit,available_credit")
        .eq("business_id", business.id)
        .maybeSingle()
    : { data: null };

  const { data: bankAccount } = business
    ? await supabase
        .from("bank_accounts")
        .select("bank_name,monthly_revenue,monthly_expenses,monthly_cash_flow,connected_at")
        .eq("business_id", business.id)
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: invoices } = business
    ? await supabase
        .from("invoices")
        .select("id,invoice_number,client_name,invoice_amount,advance_amount,status")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] };

  const { data: kycRecord } = await supabase
    .from("kyc_records")
    .select("id,updated_at")
    .limit(1)
    .maybeSingle();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,message,category,created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: financialInsight } = business
    ? await supabase
        .from("financial_insights")
        .select("loan_health_score,recommendation,cash_flow_30,cash_flow_60,cash_flow_90,updated_at")
        .eq("business_id", business.id)
        .maybeSingle()
    : { data: null };
  const { data: riskAlerts } = business
    ? await supabase
        .from("risk_alerts")
        .select("id,alert_type,message,severity,created_at,status")
        .eq("business_id", business.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] };
  const { data: underwritingExplanation } = business
    ? await supabase
        .from("underwriting_explanations")
        .select("decision,confidence_score,analysis_json,created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";

  const totalCreditLimit = Number(creditLine?.credit_limit ?? 0);
  const usedCredit = Number(creditLine?.used_credit ?? 0);
  const availableCredit = Number(creditLine?.available_credit ?? 0);

  const activeLoan = (loans ?? []).find((loan) => loan.status === "active") ?? null;
  const remainingBalance = (loans ?? [])
    .filter((loan) => loan.status === "active")
    .reduce((acc, loan) => acc + Number(loan.outstanding_balance ?? 0), 0);
  const nextPayment = (payments ?? []).find((payment) => payment.status !== "paid") ?? null;

  const annualRevenue = Number(business?.annual_revenue ?? 0);
  const baseRisk = riskScoreFromRevenue(annualRevenue);
  const bankCashFlow = Number(bankAccount?.monthly_cash_flow ?? 0);
  const hasProfileData = !!business && annualRevenue > 0;
  const adjustedRiskScore = hasProfileData
    ? Math.max(600, Math.min(800, baseRisk.score + (bankCashFlow > 0 ? 10 : -20)))
    : null;

  const monthlyLoanPayment = activeLoan
    ? (Number(activeLoan.principal_amount) * (1 + Number(activeLoan.apr ?? 0) / 100)) /
      Math.max(Number(activeLoan.term_months), 1)
    : 0;
  const monthlyRevenueForForecast = Number(bankAccount?.monthly_revenue ?? annualRevenue / 12);
  const projectedCashFlow = monthlyRevenueForForecast - monthlyLoanPayment;
  const totalInvoicesUploaded = (invoices ?? []).length;
  const totalInvoiceValue = (invoices ?? []).reduce((acc, row) => acc + Number(row.invoice_amount ?? 0), 0);
  const totalAdvancePaid = (invoices ?? []).reduce((acc, row) => acc + Number(row.advance_amount ?? 0), 0);
  const loanHealthScore = Number(financialInsight?.loan_health_score ?? 0);
  const loanHealthCategory = getLoanHealthCategory(loanHealthScore);
  const recommendationRaw = financialInsight?.recommendation ?? "";
  const [recommendationProduct, ...recommendationTail] = recommendationRaw.split(": ");
  const recommendationDetail = recommendationTail.join(": ");
  const underwritingAnalysis = (underwritingExplanation?.analysis_json ?? null) as
    | {
        decision?: string;
        confidence?: number;
        factors?: Array<{ label: string; impact: string; description: string }>;
        risk_flags?: Array<{ label: string; description: string }>;
      }
    | null;
  const explanationDecision = underwritingAnalysis?.decision ?? underwritingExplanation?.decision ?? "Review";
  const explanationConfidence = Number(
    underwritingAnalysis?.confidence ?? underwritingExplanation?.confidence_score ?? 0,
  );
  const explanationFactors = underwritingAnalysis?.factors ?? [];
  const explanationRiskFlags = underwritingAnalysis?.risk_flags ?? [];

  const today = new Date();
  const dueSoon = (payments ?? [])
    .filter((payment) => {
      if (payment.status === "paid") return false;
      const due = new Date(payment.due_date);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .slice(0, 2)
    .map((payment) => ({
      id: `due-${payment.id}`,
      title: "Payment due soon",
      message: `Upcoming payment of ${formatCurrency(Number(payment.amount ?? 0))} due on ${formatDate(payment.due_date)}.`,
      category: "payment_due",
      created_at: payment.due_date,
    }));

  const mergedNotifications = [...(notifications ?? []), ...dueSoon]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const notificationIcon = (category: string) => {
    if (category === "loan_approved") return <CircleCheckBig className="h-4 w-4 text-emerald-600" />;
    if (category === "payment_received") return <ArrowDownCircle className="h-4 w-4 text-teal-600" />;
    if (category === "payment_due") return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    return <CalendarClock className="h-4 w-4 text-slate-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Fintech lending snapshot and portfolio history.</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${kycRecord ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className="text-slate-700">
            KYC Status: {kycRecord ? "Verified" : "Pending"}
          </span>
        </div>
        {!loans?.length && (
          <>
            <p className="mt-2 text-sm text-slate-500">
              No portfolio data for this account yet. Load demo data to view real dashboard metrics.
            </p>
            <LoadDemoButton />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <div className="inline-flex rounded-lg bg-slate-900 p-2 text-white">
            <Landmark className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Total Credit Limit</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalCreditLimit)}</p>
        </Card>
        <Card>
          <div className="inline-flex rounded-lg bg-amber-500 p-2 text-white">
            <DollarSign className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Active Loan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {activeLoan ? formatCurrency(Number(activeLoan.principal_amount)) : "$0"}
          </p>
        </Card>
        <Card>
          <div className="inline-flex rounded-lg bg-cyan-600 p-2 text-white">
            <ArrowDownCircle className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Remaining Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(remainingBalance)}</p>
        </Card>
        <Card>
          <div className="inline-flex rounded-lg bg-emerald-600 p-2 text-white">
            <CalendarClock className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Next Payment Date</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatDate(nextPayment?.due_date ?? null)}</p>
        </Card>
        <RiskScoreCard score={adjustedRiskScore} />
        <Card>
          <div className="inline-flex rounded-lg bg-teal-700 p-2 text-white">
            {projectedCashFlow >= 0 ? (
              <ArrowUpCircle className="h-4 w-4" />
            ) : (
              <ArrowDownCircle className="h-4 w-4" />
            )}
          </div>
          <p className="mt-3 text-sm text-slate-500">Projected Cash Flow</p>
          <p className={`mt-2 text-2xl font-bold ${projectedCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {projectedCashFlow >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(projectedCashFlow))}
          </p>
        </Card>
      </div>

      <AIUnderwritingAnalysis
        decision={explanationDecision}
        confidence={explanationConfidence}
        factors={explanationFactors}
        riskFlags={explanationRiskFlags}
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Credit Line Overview" subtitle="Revolving capital available for instant draws.">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <p className="text-xs text-slate-500">Credit Limit</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totalCreditLimit)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <p className="text-xs text-slate-500">Used Credit</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(usedCredit)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <p className="text-xs text-slate-500">Available Credit</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(availableCredit)}</p>
            </div>
          </div>
          <div className="mt-4">{creditLine ? <DrawFundsForm maxAmount={availableCredit} /> : <p className="text-sm text-slate-500">Submit and approve a loan application to activate your credit line.</p>}</div>
        </Card>

        <Card title="Bank Cash Flow" subtitle="Live signal from connected banking profile.">
          <div className="space-y-3">
            <div className="inline-flex rounded-lg bg-indigo-600 p-2 text-white">
              <Waves className="h-4 w-4" />
            </div>
            <p className="text-sm text-slate-500">Provider</p>
            <p className="font-semibold text-slate-900">{bankAccount?.bank_name ?? "Not connected"}</p>
            <div className="grid gap-2 text-sm">
              <p className="text-slate-600">Monthly Revenue: <span className="font-semibold text-slate-900">{formatCurrency(Number(bankAccount?.monthly_revenue ?? 0))}</span></p>
              <p className="text-slate-600">Monthly Expenses: <span className="font-semibold text-slate-900">{formatCurrency(Number(bankAccount?.monthly_expenses ?? 0))}</span></p>
              <p className="text-slate-600">Net Cash Flow: <span className={`font-semibold ${bankCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{bankCashFlow >= 0 ? "+" : "-"}{formatCurrency(Math.abs(bankCashFlow))}</span></p>
            </div>
            {!bankAccount && <Badge label="Connect bank on /bank-connect" tone="warning" />}
          </div>
        </Card>
      </div>

      <Card title="Notifications" subtitle="Loan and payment events from your portfolio.">
        <div className="space-y-3">
          {mergedNotifications.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/70 p-3">
              <div className="mt-0.5">{notificationIcon(item.category)}</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.message}</p>
              </div>
            </div>
          ))}
          {!mergedNotifications.length && <p className="text-sm text-slate-500">No notifications yet.</p>}
        </div>
      </Card>

      <Card title="Risk Alerts" subtitle="Behavioral and portfolio risks requiring attention.">
        <div className="space-y-3">
          {(riskAlerts ?? []).map((alert) => (
            <div key={alert.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{alert.message}</p>
                <p className="text-xs text-slate-500">{new Date(alert.created_at).toLocaleString()}</p>
              </div>
              <Badge
                label={alert.severity}
                tone={alert.severity === "high" ? "danger" : alert.severity === "warning" ? "warning" : "success"}
              />
            </div>
          ))}
          {!riskAlerts?.length && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CircleCheckBig className="h-4 w-4" />
              Healthy: no active risk alerts.
            </div>
          )}
        </div>
      </Card>

      <Card title="Financial Insights" subtitle="Funding recommendation, loan health, and cash flow forecast.">
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Funding Recommendation</p>
            {recommendationRaw ? (
              <>
                <p className="mt-2 text-lg font-semibold text-slate-900">{recommendationProduct}</p>
                <p className="mt-1 text-sm text-slate-600">{recommendationDetail}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Insights will appear after financial activity.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Loan Health Score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{loanHealthScore} / 100</p>
            <Badge
              label={`Status: ${loanHealthCategory}`}
              tone={
                loanHealthCategory === "Excellent"
                  ? "success"
                  : loanHealthCategory === "Good"
                    ? "success"
                    : loanHealthCategory === "Watchlist"
                      ? "warning"
                      : "danger"
              }
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cash Flow Forecast</p>
            <p className={`mt-2 text-sm ${Number(financialInsight?.cash_flow_30 ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              Next 30 days: {Number(financialInsight?.cash_flow_30 ?? 0) >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(Number(financialInsight?.cash_flow_30 ?? 0)))}
            </p>
            <p className={`mt-1 text-sm ${Number(financialInsight?.cash_flow_60 ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              Next 60 days: {Number(financialInsight?.cash_flow_60 ?? 0) >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(Number(financialInsight?.cash_flow_60 ?? 0)))}
            </p>
            <p className={`mt-1 text-sm ${Number(financialInsight?.cash_flow_90 ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              Next 90 days: {Number(financialInsight?.cash_flow_90 ?? 0) >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(Number(financialInsight?.cash_flow_90 ?? 0)))}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Invoice Financing" subtitle="Portfolio visibility for factored receivables.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
            <p className="text-xs text-slate-500">Total Invoices Uploaded</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{totalInvoicesUploaded}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
            <p className="text-xs text-slate-500">Total Invoice Value</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(totalInvoiceValue)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
            <p className="text-xs text-slate-500">Total Advance Paid</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">{formatCurrency(totalAdvancePaid)}</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-2 py-3 font-medium">Invoice ID</th>
                <th className="px-2 py-3 font-medium">Client</th>
                <th className="px-2 py-3 font-medium">Amount</th>
                <th className="px-2 py-3 font-medium">Advance</th>
                <th className="px-2 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100">
                  <td className="px-2 py-3 font-medium text-slate-900">{invoice.invoice_number}</td>
                  <td className="px-2 py-3 text-slate-600">{invoice.client_name}</td>
                  <td className="px-2 py-3 text-slate-600">{formatCurrency(Number(invoice.invoice_amount ?? 0))}</td>
                  <td className="px-2 py-3 text-slate-600">{formatCurrency(Number(invoice.advance_amount ?? 0))}</td>
                  <td className="px-2 py-3">
                    <Badge
                      label={invoice.status.replace("_", " ")}
                      tone={
                        invoice.status === "financed"
                          ? "success"
                          : invoice.status === "pending_approval"
                            ? "danger"
                            : "warning"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!invoices?.length && (
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
            <ReceiptText className="h-4 w-4" />
            No invoices yet. Upload one on the /invoices page.
          </div>
        )}
      </Card>

      <Card title="Loan History" subtitle="Full timeline of your loan portfolio.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-2 py-3 font-medium">Loan ID</th>
                <th className="px-2 py-3 font-medium">Drawn Amount</th>
                <th className="px-2 py-3 font-medium">Remaining</th>
                <th className="px-2 py-3 font-medium">Start</th>
                <th className="px-2 py-3 font-medium">Maturity</th>
                <th className="px-2 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans?.map((loan) => (
                <tr key={loan.id} className="border-b border-slate-100">
                  <td className="px-2 py-3 font-medium text-slate-900">{loan.id.slice(0, 8)}</td>
                  <td className="px-2 py-3 text-slate-600">{formatCurrency(Number(loan.principal_amount ?? 0))}</td>
                  <td className="px-2 py-3 text-slate-600">{formatCurrency(Number(loan.outstanding_balance ?? 0))}</td>
                  <td className="px-2 py-3 text-slate-600">{formatDate(loan.start_date)}</td>
                  <td className="px-2 py-3 text-slate-600">{formatDate(loan.maturity_date)}</td>
                  <td className="px-2 py-3">
                    <Badge label={loan.status.replace("_", " ")} tone={loan.status === "paid_off" ? "success" : loan.status === "active" ? "warning" : "danger"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loans?.length && <p className="mt-4 text-sm text-slate-500">No loans found yet.</p>}
      </Card>
    </div>
  );
}
