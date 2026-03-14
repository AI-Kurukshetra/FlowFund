import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DocumentForm } from "@/components/documents/document-form";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id,file_name,file_url,document_type,created_at")
    .order("created_at", { ascending: false });

  const parsePath = (value: string) => {
    if (!value.startsWith("http")) {
      return value;
    }

    const marker = "/documents/";
    const index = value.indexOf(marker);
    if (index === -1) {
      return value;
    }

    return decodeURIComponent(value.slice(index + marker.length));
  };

  const documentsWithViewUrl = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const objectPath = parsePath(doc.file_url);
      const { data } = await supabase.storage.from("documents").createSignedUrl(objectPath, 60 * 60);

      return {
        ...doc,
        view_url: data?.signedUrl ?? doc.file_url,
      };
    }),
  );

  return (
    <div className="w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-500">Document Vault</p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Upload financial documents</h1>
        <p className="text-sm text-slate-600">
          Securely store and track your bank statements, invoices, and tax filings for compliance and
          underwriting readiness.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <DocumentForm />
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Uploaded Documents</h2>
            <Link href="/dashboard" className="text-sm font-medium text-teal-600">
              Back to dashboard
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {documentsWithViewUrl.length ? (
              documentsWithViewUrl.map((doc) => (
                <article key={doc.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-slate-900">{doc.file_name}</p>
                      <p className="text-xs text-slate-500">{doc.document_type.replace("_", " ")}</p>
                    </div>
                    <Link
                      href={doc.view_url}
                      className="text-xs font-semibold text-teal-600"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Uploaded {new Date(doc.created_at).toLocaleString()}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">Upload a document to see it listed here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
