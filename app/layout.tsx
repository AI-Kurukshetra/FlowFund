import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowFund | Fintech Lending Platform",
  description: "SaaS platform for SMB lending operations and payment tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-100 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
