import type { Metadata } from "next";
import LoginTester from "./LoginTester";

export const metadata: Metadata = {
  title: "API docs — Webpaint",
};

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  auth: "Public" | "Bearer" | "Bearer + admin/manager";
  description: string;
  request?: { contentType: string; body: string };
  responses: { status: number; body: string }[];
};

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/auth/login",
    auth: "Public",
    description:
      "Exchange email + password for a JWT. The token is the same HS256 JWT the web cookie session uses, so a single login works for both surfaces.",
    request: {
      contentType: "application/json",
      body: `{
  "email": "you@example.com",
  "password": "your-password"
}`,
    },
    responses: [
      {
        status: 200,
        body: `{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "you@example.com",
    "name": "Paskal Leen",
    "role": "admin",
    "clientId": null
  }
}`,
      },
      {
        status: 400,
        body: `{
  "error": {
    "code": "validation",
    "message": "Validation failed.",
    "fieldErrors": { "email": "Email is required." }
  }
}`,
      },
      {
        status: 401,
        body: `{
  "error": { "code": "invalid_credentials", "message": "Invalid email or password." }
}`,
      },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/auth/me",
    auth: "Bearer",
    description:
      "Echo the user owning the supplied token. Use on app startup to validate a stored token.",
    responses: [
      {
        status: 200,
        body: `{ "user": { "id": 1, "email": "...", "name": "...", "role": "admin", "clientId": null } }`,
      },
      {
        status: 401,
        body: `{ "error": { "code": "unauthenticated", "message": "Authentication required." } }`,
      },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/clients",
    auth: "Bearer + admin/manager",
    description:
      "List clients. Optional ?q=<term> searches name, company and email (case-insensitive).",
    responses: [
      {
        status: 200,
        body: `{ "clients": [ { "id": 1, "name": "...", "companyName": "...", ... }, ... ] }`,
      },
      {
        status: 403,
        body: `{ "error": { "code": "forbidden", "message": "..." } }`,
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/clients",
    auth: "Bearer + admin/manager",
    description: "Create a client. Only `name` is required.",
    request: {
      contentType: "application/json",
      body: `{
  "name": "Acme Ltd.",
  "companyName": "Acme",
  "email": "contact@acme.com",
  "phone": "+359 ...",
  "address": "Sofia, Bulgaria",
  "vatNumber": "BG12345"
}`,
    },
    responses: [
      {
        status: 201,
        body: `{ "client": { "id": 42, "name": "Acme Ltd.", ... } }`,
      },
      {
        status: 400,
        body: `{ "error": { "code": "validation", "fieldErrors": { "name": "..." } } }`,
      },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/clients/:id",
    auth: "Bearer + admin/manager",
    description: "Fetch a single client by id.",
    responses: [
      { status: 200, body: `{ "client": { ... } }` },
      {
        status: 404,
        body: `{ "error": { "code": "not_found", "message": "Client not found." } }`,
      },
    ],
  },
  {
    method: "DELETE",
    path: "/api/v1/clients/:id",
    auth: "Bearer + admin/manager",
    description:
      "Remove a client. Returns 409 if invoices or payments still reference this client — remove or reassign those first.",
    responses: [
      { status: 204, body: "(empty)" },
      {
        status: 404,
        body: `{ "error": { "code": "not_found", "message": "Client not found." } }`,
      },
      {
        status: 409,
        body: `{ "error": { "code": "has_dependencies", "message": "Cannot delete client — they still have invoices and payments. ..." } }`,
      },
    ],
  },
];

const METHOD_STYLES: Record<Endpoint["method"], string> = {
  GET: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  POST: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  PATCH:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
};

export default function ApiDocsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">v1</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Webpaint REST API
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          A minimal JSON API for the mobile app. All endpoints under{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            /api/v1/
          </code>{" "}
          accept and return JSON.
        </p>
      </header>

      <section className="mt-8 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Authentication
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Every non-public endpoint expects a bearer token in the{" "}
          <code>Authorization</code> header:
        </p>
        <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <code>Authorization: Bearer {`<jwt>`}</code>
        </pre>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tokens are issued by <code>POST /api/v1/auth/login</code> and live
          for 7 days. The signing secret is the server-side{" "}
          <code>JWT_SECRET</code>. Errors follow this envelope:
        </p>
        <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <code>{`{
  "error": {
    "code": "validation" | "unauthenticated" | "invalid_credentials"
          | "forbidden"  | "not_found"        | "has_dependencies"
          | "internal",
    "message": "...",
    "fieldErrors": { /* present for code: "validation" */ }
  }
}`}</code>
        </pre>
      </section>

      <section className="mt-8">
        <LoginTester />
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Endpoints
        </h2>
        <ul className="flex flex-col gap-4">
          {ENDPOINTS.map((endpoint) => (
            <li
              key={`${endpoint.method} ${endpoint.path}`}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${METHOD_STYLES[endpoint.method]}`}
                >
                  {endpoint.method}
                </span>
                <code className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {endpoint.path}
                </code>
                <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {endpoint.auth}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {endpoint.description}
              </p>

              {endpoint.request ? (
                <div className="mt-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Request body —{" "}
                    <code className="font-normal">
                      {endpoint.request.contentType}
                    </code>
                  </p>
                  <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    <code>{endpoint.request.body}</code>
                  </pre>
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-3">
                {endpoint.responses.map((r) => (
                  <div key={r.status}>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {r.status}
                    </p>
                    <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      <code>{r.body}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Quick curl recipes
        </h2>
        <pre className="mt-3 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <code>{`# Login
curl -X POST http://localhost:3000/api/v1/auth/login \\
  -H 'content-type: application/json' \\
  -d '{"email":"you@example.com","password":"..."}'

# Use the token
TOKEN=...

curl http://localhost:3000/api/v1/auth/me \\
  -H "authorization: Bearer $TOKEN"

curl http://localhost:3000/api/v1/clients \\
  -H "authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/api/v1/clients \\
  -H "authorization: Bearer $TOKEN" \\
  -H 'content-type: application/json' \\
  -d '{"name":"Acme","email":"contact@acme.com"}'

curl -X DELETE http://localhost:3000/api/v1/clients/42 \\
  -H "authorization: Bearer $TOKEN" -i`}</code>
        </pre>
      </section>
    </div>
  );
}
