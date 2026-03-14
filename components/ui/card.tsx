import { ReactNode } from "react";

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, subtitle, children, className = "" }: CardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-white to-slate-50/70 p-5 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] ${className}`}
    >
      <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-teal-100/40 blur-2xl" />
      {(title || subtitle) && (
        <header className="relative mb-4">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </header>
      )}
      <div className="relative">{children}</div>
    </section>
  );
}
