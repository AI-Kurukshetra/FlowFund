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
  if (!body.file_name || !body.file_path || !body.document_type) {
    return NextResponse.json({ error: "Missing document metadata." }, { status: 400 });
  }

  const { error } = await supabase.from("documents").insert({
    user_id: user.id,
    file_name: body.file_name,
    file_url: body.file_path,
    document_type: body.document_type,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
