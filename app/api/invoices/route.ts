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
  const invoiceNumber = String(body.invoice_number ?? "").trim();
  const clientName = String(body.client_name ?? "").trim();
  const invoiceAmount = Number(body.invoice_amount);
  const dueDate = String(body.due_date ?? "").trim();
  const invoiceDocumentUrl = body.invoice_document_url ? String(body.invoice_document_url) : null;

  if (!invoiceNumber || !clientName || !Number.isFinite(invoiceAmount) || invoiceAmount <= 0 || !dueDate) {
    return NextResponse.json({ error: "Invalid invoice input." }, { status: 400 });
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (businessError || !business) {
    return NextResponse.json({ error: businessError?.message ?? "Business profile not found." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      business_id: business.id,
      invoice_number: invoiceNumber,
      client_name: clientName,
      invoice_amount: invoiceAmount,
      due_date: dueDate,
      status: "pending",
      advance_amount: 0,
      invoice_document_url: invoiceDocumentUrl,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to create invoice." }, { status: 400 });
  }

  return NextResponse.json({ success: true, invoiceId: data.id });
}
