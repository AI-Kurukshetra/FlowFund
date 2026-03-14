import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceAdvanceButton } from "@/components/invoices/invoice-advance-button";

const toneByStatus: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  financed: "success",
  pending_approval: "danger",
};

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id,invoice_number,client_name,invoice_amount,due_date,status,advance_amount,invoice_document_url,created_at")
    .order("created_at", { ascending: false });

  const parsePath = (value: string | null) => {
    if (!value) return null;
    if (!value.startsWith("http")) return value;

    const marker = "/documents/";
    const index = value.indexOf(marker);
    if (index === -1) return value;

    return decodeURIComponent(value.slice(index + marker.length));
  };

  const invoicesWithUrl = await Promise.all(
    (invoices ?? []).map(async (invoice) => {
      const path = parsePath(invoice.invoice_document_url);
      if (!path) {
        return { ...invoice, view_url: null };
      }

      const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 60);
      return { ...invoice, view_url: data?.signedUrl ?? null };
    }),
  );

  const totalInvoices = invoicesWithUrl.length;
  const totalInvoiceValue = invoicesWithUrl.reduce((acc, row) => acc + Number(row.invoice_amount ?? 0), 0);
  const totalAdvancePaid = invoicesWithUrl.reduce((acc, row) => acc + Number(row.advance_amount ?? 0), 0);
  const financedCount = invoicesWithUrl.filter((row) => row.status === "financed").length;
  const pendingCount = invoicesWithUrl.filter((row) => row.status === "pending" || row.status === "pending_approval").length;

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Invoice Financing</h2>
        <p className="text-sm text-slate-500">Upload client invoices and request early funding against receivables.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Invoice Portfolio</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalInvoiceValue)}</p>
          <p className="text-xs text-slate-500">{totalInvoices} invoices uploaded</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Invoices Financed</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{financedCount}</p>
          <p className="text-xs text-slate-500">Total advance paid: {formatCurrency(totalAdvancePaid)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pending Invoices</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs text-slate-500">Including manual approvals</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <InvoiceForm />

        <Card title="Invoice Financing Queue" subtitle="Request 80% advance against eligible invoices.">
          <div className="space-y-3 md:hidden">
            {invoicesWithUrl.map((invoice) => (
              <div key={invoice.id} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold text-slate-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-600">{invoice.client_name}</p>
                    <p className="text-xs text-slate-400">Due {invoice.due_date}</p>
                  </div>
                  <Badge label={invoice.status.replace("_", " ")} tone={toneByStatus[invoice.status] ?? "neutral"} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <p className="text-slate-600">Amount: <span className="font-semibold text-slate-900">{formatCurrency(Number(invoice.invoice_amount ?? 0))}</span></p>
                  <p className="text-slate-600">Advance: <span className="font-semibold text-slate-900">{formatCurrency(Number(invoice.advance_amount ?? 0))}</span></p>
                </div>
                {invoice.view_url && (
                  <Link href={invoice.view_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-teal-600">
                    View document
                  </Link>
                )}
                <div className="mt-3">
                  <InvoiceAdvanceButton
                    invoiceId={invoice.id}
                    disabled={invoice.status === "financed" || invoice.status === "pending_approval"}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-2 py-3 font-medium">Invoice ID</th>
                  <th className="px-2 py-3 font-medium">Client</th>
                  <th className="px-2 py-3 font-medium">Amount</th>
                  <th className="px-2 py-3 font-medium">Advance</th>
                  <th className="px-2 py-3 font-medium">Status</th>
                  <th className="px-2 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoicesWithUrl.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 align-top">
                    <td className="px-2 py-3 font-medium text-slate-900">{invoice.invoice_number}</td>
                    <td className="px-2 py-3 text-slate-600">
                      <p>{invoice.client_name}</p>
                      <p className="text-xs text-slate-400">Due {invoice.due_date}</p>
                      {invoice.view_url && (
                        <Link href={invoice.view_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-teal-600">
                          View document
                        </Link>
                      )}
                    </td>
                    <td className="px-2 py-3 text-slate-600">{formatCurrency(Number(invoice.invoice_amount ?? 0))}</td>
                    <td className="px-2 py-3 text-slate-600">{formatCurrency(Number(invoice.advance_amount ?? 0))}</td>
                    <td className="px-2 py-3">
                      <Badge label={invoice.status.replace("_", " ")} tone={toneByStatus[invoice.status] ?? "neutral"} />
                    </td>
                    <td className="px-2 py-3">
                      <InvoiceAdvanceButton
                        invoiceId={invoice.id}
                        disabled={invoice.status === "financed" || invoice.status === "pending_approval"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!invoicesWithUrl.length && <p className="text-sm text-slate-500">No invoices uploaded yet.</p>}
        </Card>
      </div>
    </div>
  );
}
