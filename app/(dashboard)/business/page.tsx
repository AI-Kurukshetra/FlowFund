import { BusinessProfileForm } from "@/components/dashboard/business-profile-form";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function BusinessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("businesses")
    .select("id,legal_name,industry,annual_revenue,years_in_business")
    .eq("owner_user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <Card
      title="Business Profile"
      subtitle="Create and maintain your underwriting profile for faster decisions."
    >
      <BusinessProfileForm profile={profile} />
    </Card>
  );
}
