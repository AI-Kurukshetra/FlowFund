-- FlowFund demo seed data
-- Run after schema.sql in Supabase SQL Editor.
-- This script is idempotent (safe to re-run).

create extension if not exists pgcrypto;

do $$
declare
  demo_user_id uuid;
  demo_business_id uuid := '11111111-1111-1111-1111-111111111111';
  demo_application_id uuid := '22222222-2222-2222-2222-222222222222';
  demo_loan_id uuid := '33333333-3333-3333-3333-333333333333';
  demo_payment_1 uuid := '44444444-4444-4444-4444-444444444441';
  demo_payment_2 uuid := '44444444-4444-4444-4444-444444444442';
  demo_payment_3 uuid := '44444444-4444-4444-4444-444444444443';
  demo_notification_1 uuid := '55555555-5555-5555-5555-555555555551';
  demo_notification_2 uuid := '55555555-5555-5555-5555-555555555552';
  demo_credit_line_id uuid := '66666666-6666-6666-6666-666666666666';
  demo_bank_account_id uuid := '77777777-7777-7777-7777-777777777777';
  demo_schedule_1 uuid := '88888888-8888-8888-8888-888888888881';
  demo_schedule_2 uuid := '88888888-8888-8888-8888-888888888882';
  demo_schedule_3 uuid := '88888888-8888-8888-8888-888888888883';
  demo_invoice_1 uuid := '99999999-9999-9999-9999-999999999991';
  demo_invoice_2 uuid := '99999999-9999-9999-9999-999999999992';
  demo_risk_alert_1 uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  demo_underwriting_explanation_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
begin
  -- Pick the latest created user so seeded data is visible for the most recent signup.
  select id into demo_user_id
  from auth.users
  order by created_at desc
  limit 1;

  if demo_user_id is null then
    raise exception 'No users found in auth.users. Create a user first, then run seed.sql.';
  end if;

  insert into public.businesses (
    id,
    owner_user_id,
    legal_name,
    dba_name,
    industry,
    annual_revenue,
    years_in_business,
    created_at,
    updated_at
  )
  values (
    demo_business_id,
    demo_user_id,
    'FlowFund Demo Retail LLC',
    'Demo Retail Co',
    'Retail',
    240000.00,
    4,
    now() - interval '90 days',
    now()
  )
  on conflict (id) do update set
    owner_user_id = excluded.owner_user_id,
    legal_name = excluded.legal_name,
    dba_name = excluded.dba_name,
    industry = excluded.industry,
    annual_revenue = excluded.annual_revenue,
    years_in_business = excluded.years_in_business,
    updated_at = now();

  insert into public.loan_applications (
    id,
    business_id,
    applicant_user_id,
    requested_amount,
    approved_amount,
    interest_rate,
    term_months,
    risk_score,
    loan_status,
    purpose,
    monthly_revenue,
    monthly_expenses,
    existing_debt,
    credit_score,
    decision_status,
    decision_reason,
    submitted_at,
    decided_at,
    created_at,
    updated_at
  )
  values (
    demo_application_id,
    demo_business_id,
    demo_user_id,
    50000.00,
    50000.00,
    10.50,
    12,
    720,
    'approved',
    'Inventory expansion and POS upgrades',
    20000.00,
    12000.00,
    15000.00,
    721,
    'approved',
    'Demo seed approval based on strong annual revenue.',
    now() - interval '60 days',
    now() - interval '59 days',
    now() - interval '60 days',
    now()
  )
  on conflict (id) do update set
    business_id = excluded.business_id,
    applicant_user_id = excluded.applicant_user_id,
    requested_amount = excluded.requested_amount,
    approved_amount = excluded.approved_amount,
    interest_rate = excluded.interest_rate,
    term_months = excluded.term_months,
    risk_score = excluded.risk_score,
    loan_status = excluded.loan_status,
    purpose = excluded.purpose,
    monthly_revenue = excluded.monthly_revenue,
    monthly_expenses = excluded.monthly_expenses,
    existing_debt = excluded.existing_debt,
    credit_score = excluded.credit_score,
    decision_status = excluded.decision_status,
    decision_reason = excluded.decision_reason,
    decided_at = excluded.decided_at,
    updated_at = now();

  insert into public.credit_lines (
    id,
    business_id,
    credit_limit,
    used_credit,
    available_credit,
    last_adjustment_date,
    created_at,
    updated_at
  )
  values (
    demo_credit_line_id,
    demo_business_id,
    50000.00,
    13500.00,
    36500.00,
    now() - interval '10 days',
    now() - interval '59 days',
    now()
  )
  on conflict (id) do update set
    business_id = excluded.business_id,
    credit_limit = excluded.credit_limit,
    used_credit = excluded.used_credit,
    available_credit = excluded.available_credit,
    last_adjustment_date = excluded.last_adjustment_date,
    updated_at = now();

  insert into public.loans (
    id,
    application_id,
    business_id,
    borrower_user_id,
    credit_line_id,
    principal_amount,
    outstanding_balance,
    apr,
    term_months,
    start_date,
    maturity_date,
    status,
    created_at,
    updated_at
  )
  values (
    demo_loan_id,
    demo_application_id,
    demo_business_id,
    demo_user_id,
    demo_credit_line_id,
    50000.00,
    36500.00,
    10.50,
    12,
    current_date - 59,
    current_date + 306,
    'active',
    now() - interval '59 days',
    now()
  )
  on conflict (id) do update set
    application_id = excluded.application_id,
    business_id = excluded.business_id,
    borrower_user_id = excluded.borrower_user_id,
    credit_line_id = excluded.credit_line_id,
    principal_amount = excluded.principal_amount,
    outstanding_balance = excluded.outstanding_balance,
    apr = excluded.apr,
    term_months = excluded.term_months,
    start_date = excluded.start_date,
    maturity_date = excluded.maturity_date,
    status = excluded.status,
    updated_at = now();

  insert into public.payments (
    id,
    loan_id,
    business_id,
    payer_user_id,
    amount,
    principal_component,
    interest_component,
    due_date,
    paid_at,
    status,
    created_at,
    updated_at
  )
  values
    (
      demo_payment_1,
      demo_loan_id,
      demo_business_id,
      demo_user_id,
      5000.00,
      4500.00,
      500.00,
      current_date - 45,
      now() - interval '45 days',
      'paid',
      now() - interval '45 days',
      now()
    ),
    (
      demo_payment_2,
      demo_loan_id,
      demo_business_id,
      demo_user_id,
      5000.00,
      4600.00,
      400.00,
      current_date - 15,
      now() - interval '15 days',
      'paid',
      now() - interval '15 days',
      now()
    ),
    (
      demo_payment_3,
      demo_loan_id,
      demo_business_id,
      demo_user_id,
      5000.00,
      4700.00,
      300.00,
      current_date + 15,
      null,
      'scheduled',
      now(),
      now()
    )
  on conflict (id) do update set
    loan_id = excluded.loan_id,
    business_id = excluded.business_id,
    payer_user_id = excluded.payer_user_id,
    amount = excluded.amount,
    principal_component = excluded.principal_component,
    interest_component = excluded.interest_component,
    due_date = excluded.due_date,
    paid_at = excluded.paid_at,
    status = excluded.status,
    updated_at = now();

  insert into public.repayment_schedules (
    id,
    loan_id,
    due_date,
    amount,
    status,
    created_at
  )
  values
    (
      demo_schedule_1,
      demo_loan_id,
      current_date - 45,
      5000.00,
      'paid',
      now() - interval '45 days'
    ),
    (
      demo_schedule_2,
      demo_loan_id,
      current_date - 15,
      5000.00,
      'paid',
      now() - interval '15 days'
    ),
    (
      demo_schedule_3,
      demo_loan_id,
      current_date + 15,
      5000.00,
      'scheduled',
      now()
    )
  on conflict (id) do update set
    loan_id = excluded.loan_id,
    due_date = excluded.due_date,
    amount = excluded.amount,
    status = excluded.status;

  insert into public.bank_accounts (
    id,
    business_id,
    bank_name,
    account_type,
    monthly_revenue,
    monthly_expenses,
    monthly_cash_flow,
    connected_at,
    created_at
  )
  values (
    demo_bank_account_id,
    demo_business_id,
    'Chase',
    'business_checking',
    42000.00,
    25000.00,
    17000.00,
    now() - interval '50 days',
    now() - interval '50 days'
  )
  on conflict (id) do update set
    business_id = excluded.business_id,
    bank_name = excluded.bank_name,
    account_type = excluded.account_type,
    monthly_revenue = excluded.monthly_revenue,
    monthly_expenses = excluded.monthly_expenses,
    monthly_cash_flow = excluded.monthly_cash_flow,
    connected_at = excluded.connected_at;

  insert into public.invoices (
    id,
    business_id,
    invoice_number,
    client_name,
    invoice_amount,
    due_date,
    status,
    advance_amount,
    created_at,
    updated_at
  )
  values
    (
      demo_invoice_1,
      demo_business_id,
      'INV-FF-1001',
      'Northstar Foods Inc.',
      10000.00,
      current_date + 20,
      'financed',
      8000.00,
      now() - interval '20 days',
      now()
    ),
    (
      demo_invoice_2,
      demo_business_id,
      'INV-FF-1002',
      'Harbor Logistics LLC',
      26000.00,
      current_date + 25,
      'pending_approval',
      0,
      now() - interval '2 days',
      now()
    )
  on conflict (id) do update set
    business_id = excluded.business_id,
    invoice_number = excluded.invoice_number,
    client_name = excluded.client_name,
    invoice_amount = excluded.invoice_amount,
    due_date = excluded.due_date,
    status = excluded.status,
    advance_amount = excluded.advance_amount,
    updated_at = now();

  insert into public.risk_alerts (
    id,
    business_id,
    alert_type,
    message,
    severity,
    created_at,
    status
  )
  values (
    demo_risk_alert_1,
    demo_business_id,
    'high_utilization',
    'Credit utilization above 80%.',
    'warning',
    now() - interval '1 day',
    'open'
  )
  on conflict (id) do update set
    business_id = excluded.business_id,
    alert_type = excluded.alert_type,
    message = excluded.message,
    severity = excluded.severity,
    created_at = excluded.created_at,
    status = excluded.status;

  insert into public.financial_insights (
    business_id,
    loan_health_score,
    recommendation,
    cash_flow_30,
    cash_flow_60,
    cash_flow_90,
    updated_at
  )
  values (
    demo_business_id,
    82,
    'Invoice Financing: Advance up to $28,800 based on current receivables.',
    12000.00,
    18500.00,
    24000.00,
    now()
  )
  on conflict (business_id) do update set
    loan_health_score = excluded.loan_health_score,
    recommendation = excluded.recommendation,
    cash_flow_30 = excluded.cash_flow_30,
    cash_flow_60 = excluded.cash_flow_60,
    cash_flow_90 = excluded.cash_flow_90,
    updated_at = now();

  insert into public.underwriting_explanations (
    id,
    business_id,
    decision,
    confidence_score,
    analysis_json,
    created_at
  )
  values (
    demo_underwriting_explanation_id,
    demo_business_id,
    'Approved',
    87,
    jsonb_build_object(
      'decision', 'Approved',
      'confidence', 87,
      'factors', jsonb_build_array(
        jsonb_build_object('label', 'Strong Revenue', 'impact', '+20', 'impactValue', 20, 'description', 'Annual revenue above $100k.'),
        jsonb_build_object('label', 'Healthy Cash Flow', 'impact', '+18', 'impactValue', 18, 'description', 'Monthly net cash flow above $5,000.'),
        jsonb_build_object('label', 'Low Credit Utilization', 'impact', '+15', 'impactValue', 15, 'description', 'Used credit is below 40%.'),
        jsonb_build_object('label', 'Strong Repayment History', 'impact', '+22', 'impactValue', 22, 'description', 'Most payments are on time.')
      ),
      'risk_flags', jsonb_build_array(
        jsonb_build_object('label', 'Client concentration', 'description', 'Large portion of receivables comes from a single client.')
      )
    ),
    now() - interval '1 day'
  )
  on conflict (id) do update set
    business_id = excluded.business_id,
    decision = excluded.decision,
    confidence_score = excluded.confidence_score,
    analysis_json = excluded.analysis_json,
    created_at = excluded.created_at;

  insert into public.notifications (
    id,
    user_id,
    category,
    title,
    message,
    related_loan_id,
    created_at
  )
  values
    (
      demo_notification_1,
      demo_user_id,
      'loan_approved',
      'Loan approved',
      'Your demo loan was approved for $50,000.',
      demo_loan_id,
      now() - interval '59 days'
    ),
    (
      demo_notification_2,
      demo_user_id,
      'payment_received',
      'Payment received',
      'Payment of $5,000 was recorded on your active loan.',
      demo_loan_id,
      now() - interval '15 days'
    )
  on conflict (id) do update set
    user_id = excluded.user_id,
    category = excluded.category,
    title = excluded.title,
    message = excluded.message,
    related_loan_id = excluded.related_loan_id,
    created_at = excluded.created_at;
end $$;
