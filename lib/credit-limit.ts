import type { SupabaseClient } from "@supabase/supabase-js";

type AdjustCreditLimitInput = {
  supabase: SupabaseClient;
  businessId: string;
  paymentAmount: number;
  outstandingBeforePayment: number;
};

type AdjustCreditLimitResult = {
  increased: boolean;
  previousLimit: number;
  newLimit: number;
  usedCredit: number;
  availableCredit: number;
};

export async function adjustCreditLimit({
  supabase,
  businessId,
  paymentAmount,
  outstandingBeforePayment,
}: AdjustCreditLimitInput): Promise<AdjustCreditLimitResult | null> {
  const { data: creditLine, error } = await supabase
    .from("credit_lines")
    .select("id,credit_limit,used_credit,last_adjustment_date")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !creditLine) {
    return null;
  }

  const previousLimit = Number(creditLine.credit_limit ?? 0);
  if (previousLimit <= 0) {
    return null;
  }

  const threshold = Number((outstandingBeforePayment * 0.3).toFixed(2));
  const increased = paymentAmount >= threshold && outstandingBeforePayment > 0;
  const newLimit = increased ? Number((previousLimit * 1.2).toFixed(2)) : previousLimit;

  const nextUsed = Math.max(Number(creditLine.used_credit ?? 0) - paymentAmount, 0);
  const baseAvailable = Math.max(newLimit - nextUsed, 0);
  const utilization = newLimit > 0 ? nextUsed / newLimit : 0;

  // Temporary utilization guard: keep only a small draw window when usage is too high.
  const availableCredit =
    utilization > 0.8 ? Math.min(baseAvailable, Number((newLimit * 0.1).toFixed(2))) : baseAvailable;

  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("credit_lines")
    .update({
      credit_limit: newLimit,
      used_credit: nextUsed,
      available_credit: availableCredit,
      last_adjustment_date: increased ? nowIso : creditLine.last_adjustment_date,
      updated_at: nowIso,
    })
    .eq("id", creditLine.id);

  if (updateError) {
    return null;
  }

  return {
    increased,
    previousLimit,
    newLimit,
    usedCredit: nextUsed,
    availableCredit,
  };
}
