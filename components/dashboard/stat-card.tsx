import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
};

export function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {delta && <p className="mt-2 text-sm text-emerald-600">{delta}</p>}
    </Card>
  );
}
