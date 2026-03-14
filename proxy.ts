import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/business/:path*",
    "/applications/:path*",
    "/loans/:path*",
    "/payments/:path*",
    "/documents/:path*",
    "/invoices/:path*",
    "/reports/:path*",
    "/kyc/:path*",
    "/bank-connect/:path*",
    "/credit-line/:path*",
    "/repayment-schedule/:path*",
    "/login",
    "/signup",
  ],
};
