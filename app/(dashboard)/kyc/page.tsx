import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KycForm } from "@/components/kyc/kyc-form";

type KycPageProps = {
  searchParams: Promise<{ required?: string; next?: string }>;
};

export default async function KycPage({ searchParams }: KycPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="w-full py-4">
        <p className="text-sm text-slate-500">Sign in to access KYC.</p>
      </div>
    );
  }

  const { data: record } = await supabase
    .from("kyc_records")
    .select("owner_full_name,business_registration_number,business_address,tax_id,identity_document_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="w-full space-y-6 overflow-x-hidden">
      <div className="space-y-2">
        <p className="text-sm text-slate-500">Compliance & Verification</p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Submit KYC documents</h1>
        <p className="text-sm text-slate-600">
          Provide business ownership details so FlowFund can keep your profile verified and ready for
          funding.
        </p>
        {params.required === "1" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            KYC is required before loan application submission.
          </p>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <KycForm existingRecord={record ?? undefined} />
        {record && (
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/75 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Latest Record</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="break-words">Owner: {record.owner_full_name}</li>
              <li className="break-all">Registration: {record.business_registration_number}</li>
              <li className="break-all">Tax ID: {record.tax_id}</li>
              <li className="break-words">Address: {record.business_address}</li>
              <li>
                Document: <a className="break-all text-teal-600" href={record.identity_document_url}>View file</a>
              </li>
            </ul>
            <Link href="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-teal-600">
              Back to dashboard
            </Link>
            {params.next && (
              <Link href={params.next} className="mt-2 inline-flex text-sm font-semibold text-teal-600">
                Continue to application
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
