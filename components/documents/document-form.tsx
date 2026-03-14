"use client";

import { useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isValidUpload } from "@/lib/validation";

const documentTypes = [
  { value: "financial_statement", label: "Financial Statement" },
  { value: "invoice", label: "Invoice" },
  { value: "tax_return", label: "Tax Document" },
];

export function DocumentForm() {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState(documentTypes[0].value);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ file?: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    if (!file) {
      setErrors({ file: "Select a file before uploading." });
      return;
    }

    if (!isValidUpload(file, 10, ["application/pdf", "image/"])) {
      setErrors({ file: "Only PDF/image files up to 10MB are allowed." });
      return;
    }

    setLoading(true);
    setMessage("");
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sign in to upload documents.");
      setLoading(false);
      return;
    }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        file_name: file.name,
        file_path: path,
        document_type: docType,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(`Metadata save failed: ${data.error ?? "Unable to save document metadata."}`);
      setLoading(false);
      return;
    }

    setMessage("Document uploaded successfully.");
    setFile(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-5">
      <label className="text-sm font-semibold text-slate-700">Upload Document</label>
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setErrors((curr) => ({ ...curr, file: undefined }));
        }}
        className={`w-full rounded-xl border px-3 py-2 ${errors.file ? "border-rose-500" : "border-slate-200"}`}
        required
      />
      {errors.file && <p className="text-xs text-rose-600">{errors.file}</p>}
      <label className="text-sm font-semibold text-slate-700">Document Type</label>
      <select
        value={docType}
        onChange={(event) => setDocType(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      >
        {documentTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-70 sm:w-auto"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Uploading..." : "Save Document"}
      </button>
      {message && <p className={`text-sm ${message.includes("successfully") ? "text-slate-600" : "text-rose-600"}`}>{message}</p>}
    </form>
  );
}
