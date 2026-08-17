import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, isValidSession } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const ok = await isValidSession(req.cookies.get(COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Static files must be excluded too: the sign-in screen needs its images
  // before a session exists, and the middleware would otherwise redirect them.
  matcher: [
    "/((?!login|api/login|api/health|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)",
  ],
};
