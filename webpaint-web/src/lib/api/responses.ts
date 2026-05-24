/**
 * Small helpers for REST API responses so every route returns the same
 * shape. Standard error envelope:
 *
 *   { "error": { "code": "...", "message": "...", "fieldErrors"?: {...} } }
 */

import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
};

export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  );
}

export const apiUnauthenticated = (
  message = "Authentication required.",
) => jsonError(401, "unauthenticated", message);

export const apiForbidden = (
  message = "You don't have access to this resource.",
) => jsonError(403, "forbidden", message);

export const apiNotFound = (entity: string) =>
  jsonError(404, "not_found", `${entity} not found.`);

export const apiBadRequest = (
  message: string,
  fieldErrors?: Record<string, string>,
) => jsonError(400, "validation", message, fieldErrors);

export const apiInternal = () =>
  jsonError(500, "internal", "Something went wrong.");
