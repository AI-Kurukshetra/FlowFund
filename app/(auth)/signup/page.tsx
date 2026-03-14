import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">FlowFund</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Launch your lending operations in minutes.</p>
        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>
      </section>
    </main>
  );
}
