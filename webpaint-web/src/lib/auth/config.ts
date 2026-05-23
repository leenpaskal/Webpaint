/**
 * Auth constants shared between the Node and Edge runtimes.
 * Safe to import from middleware, server actions and React server components.
 */

export const SESSION_COOKIE_NAME = "wp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const JWT_ALG = "HS256";
export const JWT_ISSUER = "webpaint-portal";
export const JWT_AUDIENCE = "webpaint-portal-users";

/**
 * Routes that are reachable without a session.
 * Anything not listed (and not a static asset) is gated by middleware.
 */
export const PUBLIC_PATHS: readonly string[] = ["/", "/login", "/register"];

/** Default destination after a successful login / register. */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
