/**
 * Edge middleware — gates every non-public route behind a valid session.
 *
 * Public routes: `/`, `/login`, `/register` (see PUBLIC_PATHS).
 * Logged-in users that hit `/login` or `/register` are bounced to the
 * default authenticated destination.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOGIN_REDIRECT,
  PUBLIC_PATHS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/jwt";

const AUTH_PAGES = new Set(["/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session && AUTH_PAGES.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = DEFAULT_LOGIN_REDIRECT;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);
  if (isPublic) return NextResponse.next();

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

/**
 * Skip Next.js internals, static assets, the favicon, and any /api/ route.
 * REST endpoints handle their own auth and must return JSON 401, not an
 * HTML redirect to /login (mobile clients can't follow that).
 */
export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
