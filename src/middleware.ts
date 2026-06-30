import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (
    (pathname.startsWith("/analysis") ||
      pathname.startsWith("/dashboard")) &&
    !isLoggedIn
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/analysis/:path*", "/dashboard/:path*"],
};
