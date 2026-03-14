import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const requiredFields = [
    "owner_full_name",
    "business_registration_number",
    "business_address",
    "tax_id",
    "identity_document_url",
  ];

  for (const key of requiredFields) {
    if (!body[key]) {
      return NextResponse.json({ error: `${key} is required.` }, { status: 400 });
    }
  }

  const { error } = await supabase.from("kyc_records").upsert({
    user_id: user.id,
    owner_full_name: body.owner_full_name,
    business_registration_number: body.business_registration_number,
    business_address: body.business_address,
    tax_id: body.tax_id,
    identity_document_url: body.identity_document_url,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
