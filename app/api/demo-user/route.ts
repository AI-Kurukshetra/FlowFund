import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@flowfund.app";
const DEMO_PASSWORD = "Demo@1234";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add both to .env.local to create demo auth user.",
      },
      { status: 500 },
    );
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_USER_SETUP !== "true") {
    return NextResponse.json(
      { error: "Demo user setup is disabled in production." },
      { status: 403 },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userList, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 400 });
  }

  const existing = userList.users.find((user) => user.email?.toLowerCase() === DEMO_EMAIL);
  if (existing) {
    return NextResponse.json({ success: true, created: false, message: "Demo user already exists." });
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      is_demo_user: true,
      display_name: "FlowFund Demo",
    },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    created: true,
    message: "Demo user created. You can now sign in with demo credentials.",
  });
}
