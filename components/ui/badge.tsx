type BadgeProps = {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral";
};

const tones = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  neutral: "bg-slate-100 text-slate-700",
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}
