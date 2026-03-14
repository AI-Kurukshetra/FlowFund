import { LoanApplicationForm } from "@/components/dashboard/loan-application-form";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewApplicationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: kycRecord } = await supabase
    .from("kyc_records")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!kycRecord) {
    redirect("/kyc?required=1&next=/applications/new");
  }

  return (
    <Card
      title="Loan Application"
      subtitle="KYC verified. Submit your business profile to run automated underwriting and view your decision."
    >
      <LoanApplicationForm />
    </Card>
  );
}
