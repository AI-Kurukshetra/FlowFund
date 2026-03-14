# FlowFund

FlowFund is a modern fintech SaaS web application built with Next.js App Router, TailwindCSS, and Supabase.

## Features

- User signup and login (Supabase Auth)
- Protected dashboard after login
- Business profile creation and updates
- Loan application form with automated credit approval logic
- Loan management dashboard
- Payment tracking dashboard
- Responsive modern sidebar + card-based UI

## Tech Stack

- Next.js (App Router)
- TailwindCSS
- Supabase (Auth + Postgres)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Add your Supabase project values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Create database schema in Supabase SQL Editor:

- Run [`supabase/schema.sql`](supabase/schema.sql)

4. Start the dev server:

```bash
npm run dev
```

5. Open http://localhost:3000

## Routes

- `/` Landing page
- `/login` Login
- `/signup` Signup
- `/dashboard` Dashboard overview
- `/business` Business profile
- `/applications/new` Loan application form
- `/loans` Loan management
- `/payments` Payment tracking
