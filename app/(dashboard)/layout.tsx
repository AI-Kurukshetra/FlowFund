import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen w-full gap-4 px-3 py-4 md:grid-cols-[18rem_1fr] md:px-4 md:py-6 lg:px-6">
      <div className="pointer-events-none absolute left-10 top-10 h-56 w-56 rounded-full bg-cyan-200/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-56 w-56 rounded-full bg-teal-200/25 blur-3xl" />
      <Sidebar />
      <main className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.55)] backdrop-blur-sm md:p-6">
        {children}
      </main>
    </div>
  );
}
