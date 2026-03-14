"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isStrongPassword, isValidEmail } from "@/lib/validation";

const DEMO_EMAIL = "demo@flowfund.app";
const DEMO_PASSWORD = "Demo@1234";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [demoMessage, setDemoMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setDemoMessage("");
    setFieldErrors({});
    const nextFieldErrors: { email?: string; password?: string } = {};

    if (!isValidEmail(email)) {
      nextFieldErrors.email = "Enter a valid email address.";
    }

    if (mode === "signup" && !isStrongPassword(password)) {
      nextFieldErrors.password = "Password must include uppercase, lowercase, and a number.";
    }

    if (nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signupError) {
          setError(signupError.message);
          setLoading(false);
          return;
        }

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={loading}>
      {mode === "login" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
              setError("");
              setDemoMessage("");
              setFieldErrors({});
            }}
            disabled={loading}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-70"
          >
            Use Demo Credentials
          </button>
          <button
            type="button"
            onClick={async () => {
              setDemoLoading(true);
              setError("");
              setDemoMessage("");
              try {
                const response = await fetch("/api/demo-user", { method: "POST" });
                const data = await response.json();

                if (!response.ok) {
                  setError(data.error ?? "Unable to create demo user.");
                  return;
                }

                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
                setFieldErrors({});
                setDemoMessage(data.message ?? "Demo user ready.");
              } finally {
                setDemoLoading(false);
              }
            }}
            disabled={demoLoading || loading}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-70"
          >
            {demoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {demoLoading ? "Creating Demo User..." : "Create Demo User"}
          </button>
        </div>
      )}
      <label className="block text-sm text-slate-600">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((curr) => ({ ...curr, email: undefined }));
          }}
          className={`mt-1 w-full rounded-xl border px-3 py-2 ${
            fieldErrors.email ? "border-rose-500" : "border-slate-200"
          }`}
          required
          maxLength={120}
          disabled={loading}
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
      </label>
      <label className="block text-sm text-slate-600">
        Password
        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((curr) => ({ ...curr, password: undefined }));
            }}
            className={`w-full rounded-xl border px-3 py-2 pr-10 ${
              fieldErrors.password ? "border-rose-500" : "border-slate-200"
            }`}
            required
            minLength={8}
            maxLength={72}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((curr) => !curr)}
            disabled={loading}
            className="absolute inset-y-0 right-2 inline-flex items-center justify-center text-slate-500 hover:text-slate-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password && <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>}
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {demoMessage && <p className="text-sm text-emerald-700">{demoMessage}</p>}

      <p className="text-sm text-slate-600">
        {mode === "login" ? "New to FlowFund?" : "Already have an account?"}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="font-medium text-teal-700 hover:text-teal-600"
        >
          {mode === "login" ? "Create one" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
