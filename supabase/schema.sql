-- FlowFund schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  legal_name text not null,
  dba_name text,
  industry text not null,
  annual_revenue numeric(14,2) not null default 0 check (annual_revenue >= 0),
  years_in_business int not null default 0 check (years_in_business >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  applicant_user_id uuid not null references auth.users(id) on delete cascade,
  requested_amount numeric(14,2) not null check (requested_amount > 0),
  approved_amount numeric(14,2) not null default 0 check (approved_amount >= 0),
  interest_rate numeric(5,2) not null default 0 check (interest_rate >= 0),
  term_months int not null check (term_months > 0),
  risk_score int check (risk_score between 300 and 850),
  loan_status text not null default 'review' check (
    loan_status in ('approved', 'partial_approved', 'review')
  ),
  purpose text,
  monthly_revenue numeric(14,2) not null default 0 check (monthly_revenue >= 0),
  monthly_expenses numeric(14,2) not null default 0 check (monthly_expenses >= 0),
  existing_debt numeric(14,2) not null default 0 check (existing_debt >= 0),
  credit_score int check (credit_score between 300 and 850),
  decision_status text not null default 'pending' check (
    decision_status in ('pending', 'approved', 'manual_review', 'declined')
  ),
  decision_reason text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.loan_applications(id) on delete set null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  borrower_user_id uuid not null references auth.users(id) on delete cascade,
  principal_amount numeric(14,2) not null check (principal_amount > 0),
  outstanding_balance numeric(14,2) not null check (outstanding_balance >= 0),
  apr numeric(5,2) not null check (apr >= 0),
  term_months int not null check (term_months > 0),
  start_date date not null default current_date,
  maturity_date date,
  status text not null default 'active' check (
    status in ('active', 'paid_off', 'defaulted', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  payer_user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  principal_component numeric(14,2) not null default 0 check (principal_component >= 0),
  interest_component numeric(14,2) not null default 0 check (interest_component >= 0),
  due_date date not null,
  paid_at timestamptz,
  status text not null default 'scheduled' check (
    status in ('scheduled', 'paid', 'late', 'failed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('loan_approved', 'loan_review', 'payment_received', 'payment_due')),
  title text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  related_loan_id uuid references public.loans(id) on delete set null,
  related_payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  document_type text not null check (document_type in ('financial_statement', 'invoice', 'tax_return')),
  created_at timestamptz not null default now()
);

create table if not exists public.kyc_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_full_name text not null,
  business_registration_number text not null,
  business_address text not null,
  tax_id text not null,
  identity_document_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_lines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid unique not null references public.businesses(id) on delete cascade,
  credit_limit numeric(14,2) not null default 0 check (credit_limit >= 0),
  used_credit numeric(14,2) not null default 0 check (used_credit >= 0),
  available_credit numeric(14,2) not null default 0 check (available_credit >= 0),
  last_adjustment_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  bank_name text not null,
  account_type text not null default 'business_checking',
  monthly_revenue numeric(14,2) not null default 0,
  monthly_expenses numeric(14,2) not null default 0,
  monthly_cash_flow numeric(14,2) not null default 0,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.repayment_schedules (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  due_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'paid', 'overdue')),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_number text not null,
  client_name text not null,
  invoice_amount numeric(14,2) not null check (invoice_amount > 0),
  due_date date not null,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'financed', 'pending_approval')
  ),
  advance_amount numeric(14,2) not null default 0 check (advance_amount >= 0),
  invoice_document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.risk_alerts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  alert_type text not null,
  message text not null,
  severity text not null check (severity in ('low', 'warning', 'high')),
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'resolved'))
);

create table if not exists public.financial_insights (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  loan_health_score int not null default 0 check (loan_health_score between 0 and 100),
  recommendation text not null default '',
  cash_flow_30 numeric(14,2) not null default 0,
  cash_flow_60 numeric(14,2) not null default 0,
  cash_flow_90 numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.underwriting_explanations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  decision text not null,
  confidence_score int not null check (confidence_score between 0 and 100),
  analysis_json jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.loan_applications
  add column if not exists approved_amount numeric(14,2) not null default 0;
alter table public.loan_applications
  add column if not exists interest_rate numeric(5,2) not null default 0;
alter table public.loan_applications
  add column if not exists risk_score int;
alter table public.loan_applications
  add column if not exists loan_status text not null default 'review';
alter table public.notifications
  add column if not exists status text not null default 'unread';
alter table public.loans
  add column if not exists credit_line_id uuid references public.credit_lines(id) on delete set null;
alter table public.credit_lines
  add column if not exists last_adjustment_date timestamptz;
alter table public.invoices
  add column if not exists invoice_document_url text;
alter table public.invoices
  add column if not exists advance_amount numeric(14,2) not null default 0;
alter table public.invoices
  add column if not exists status text not null default 'pending';

create index if not exists idx_businesses_owner_user_id
  on public.businesses(owner_user_id);
create index if not exists idx_loan_applications_business_id
  on public.loan_applications(business_id);
create index if not exists idx_loan_applications_applicant_user_id
  on public.loan_applications(applicant_user_id);
create index if not exists idx_loan_applications_decision_status
  on public.loan_applications(decision_status);
create index if not exists idx_loans_business_id
  on public.loans(business_id);
create index if not exists idx_loans_borrower_user_id
  on public.loans(borrower_user_id);
create index if not exists idx_loans_status
  on public.loans(status);
create index if not exists idx_payments_loan_id
  on public.payments(loan_id);
create index if not exists idx_payments_payer_user_id
  on public.payments(payer_user_id);
create index if not exists idx_payments_status_due_date
  on public.payments(status, due_date);
create index if not exists idx_notifications_user_created_at
  on public.notifications(user_id, created_at desc);
create index if not exists idx_documents_user_created_at
  on public.documents(user_id, created_at desc);
create index if not exists idx_kyc_user_created_at
  on public.kyc_records(user_id, created_at desc);
create index if not exists idx_credit_lines_business_id
  on public.credit_lines(business_id);
create index if not exists idx_bank_accounts_business_id
  on public.bank_accounts(business_id);
create index if not exists idx_repayment_schedules_loan_due_date
  on public.repayment_schedules(loan_id, due_date);
create index if not exists idx_invoices_business_created_at
  on public.invoices(business_id, created_at desc);
create index if not exists idx_invoices_status
  on public.invoices(status);
create index if not exists idx_risk_alerts_business_created_at
  on public.risk_alerts(business_id, created_at desc);
create index if not exists idx_risk_alerts_status
  on public.risk_alerts(status);
create index if not exists idx_financial_insights_updated_at
  on public.financial_insights(updated_at desc);
create index if not exists idx_underwriting_explanations_business_created_at
  on public.underwriting_explanations(business_id, created_at desc);

alter table public.businesses enable row level security;
alter table public.loan_applications enable row level security;
alter table public.loans enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.documents enable row level security;
alter table public.kyc_records enable row level security;
alter table public.credit_lines enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.repayment_schedules enable row level security;
alter table public.invoices enable row level security;
alter table public.risk_alerts enable row level security;
alter table public.financial_insights enable row level security;
alter table public.underwriting_explanations enable row level security;

drop policy if exists "Users manage own businesses" on public.businesses;
create policy "Users manage own businesses"
on public.businesses
for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "Users manage own loan applications" on public.loan_applications;
create policy "Users manage own loan applications"
on public.loan_applications
for all
using (auth.uid() = applicant_user_id)
with check (auth.uid() = applicant_user_id);

drop policy if exists "Users manage own loans" on public.loans;
create policy "Users manage own loans"
on public.loans
for all
using (auth.uid() = borrower_user_id)
with check (auth.uid() = borrower_user_id);

drop policy if exists "Users manage own payments" on public.payments;
create policy "Users manage own payments"
on public.payments
for all
using (auth.uid() = payer_user_id)
with check (auth.uid() = payer_user_id);

drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications"
on public.notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own documents" on public.documents;
create policy "Users manage own documents"
on public.documents
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own kyc records" on public.kyc_records;
create policy "Users manage own kyc records"
on public.kyc_records
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own credit lines" on public.credit_lines;
create policy "Users manage own credit lines"
on public.credit_lines
for all
using (
  exists (
    select 1 from public.businesses b
    where b.id = credit_lines.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = credit_lines.business_id and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users manage own bank accounts" on public.bank_accounts;
create policy "Users manage own bank accounts"
on public.bank_accounts
for all
using (
  exists (
    select 1 from public.businesses b
    where b.id = bank_accounts.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = bank_accounts.business_id and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users manage own repayment schedules" on public.repayment_schedules;
create policy "Users manage own repayment schedules"
on public.repayment_schedules
for all
using (
  exists (
    select 1 from public.loans l
    where l.id = repayment_schedules.loan_id and l.borrower_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.loans l
    where l.id = repayment_schedules.loan_id and l.borrower_user_id = auth.uid()
  )
);

drop policy if exists "Users manage own invoices" on public.invoices;
create policy "Users manage own invoices"
on public.invoices
for all
using (
  exists (
    select 1 from public.businesses b
    where b.id = invoices.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = invoices.business_id and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users manage own risk alerts" on public.risk_alerts;
create policy "Users manage own risk alerts"
on public.risk_alerts
for all
using (
  exists (
    select 1 from public.businesses b
    where b.id = risk_alerts.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = risk_alerts.business_id and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users manage own financial insights" on public.financial_insights;
create policy "Users manage own financial insights"
on public.financial_insights
for all
using (
  exists (
    select 1 from public.businesses b
    where b.id = financial_insights.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = financial_insights.business_id and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users manage own underwriting explanations" on public.underwriting_explanations;
create policy "Users manage own underwriting explanations"
on public.underwriting_explanations
for all
using (
  exists (
    select 1 from public.businesses b
    where b.id = underwriting_explanations.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = underwriting_explanations.business_id and b.owner_user_id = auth.uid()
  )
);

-- Storage policies for the documents bucket.
drop policy if exists "Authenticated users can upload documents" on storage.objects;
create policy "Authenticated users can upload documents"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documents');

drop policy if exists "Authenticated users can view documents" on storage.objects;
create policy "Authenticated users can view documents"
on storage.objects
for select
to authenticated
using (bucket_id = 'documents');

drop policy if exists "Authenticated users can update documents" on storage.objects;
create policy "Authenticated users can update documents"
on storage.objects
for update
to authenticated
using (bucket_id = 'documents')
with check (bucket_id = 'documents');

drop policy if exists "Authenticated users can delete documents" on storage.objects;
create policy "Authenticated users can delete documents"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents');
