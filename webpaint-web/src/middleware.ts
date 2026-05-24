/**
 * Edge middleware — gates every non-public route behind a valid session,
 * and applies permissive CORS to /api/* so the Expo mobile app (native +
 * web) can call the REST endpoints from a different origin.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOGIN_REDIRECT,
  PUBLIC_PATHS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/jwt";

const AUTH_PAGES = new Set(["/login"]);

const API_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(API_CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      return withCors(new NextResponse(null, { status: 204 }));
    }
    return withCors(NextResponse.next());
  }

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
 * Run on /api/* (CORS) and every non-static page route (session gating).
 * REST endpoints return JSON 401 themselves — middleware never redirects
 * an /api/* request.
 */
export const config = {
  matcher: [
    "/api/:path*",
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
