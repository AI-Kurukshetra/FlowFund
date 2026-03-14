import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">FlowFund</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue managing your lending pipeline.</p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
      </section>
    </main>
  );
}
