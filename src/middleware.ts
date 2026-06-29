import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protect /repos and /analysis routes
  if (
    (pathname.startsWith("/repos") || pathname.startsWith("/analysis")) &&
    !isLoggedIn
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/repos/:path*", "/analysis/:path*"],
};
