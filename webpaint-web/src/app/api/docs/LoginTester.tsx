"use client";

import { useState } from "react";

type Result =
  | {
      kind: "ok";
      status: number;
      token: string;
      user: {
        id: number;
        email: string;
        name: string;
        role: string;
        clientId: number | null;
      };
    }
  | {
      kind: "error";
      status: number;
      body: unknown;
    };

export default function LoginTester() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (res.ok && body?.token && body?.user) {
        setResult({
          kind: "ok",
          status: res.status,
          token: body.token,
          user: body.user,
        });
      } else {
        setResult({ kind: "error", status: res.status, body });
      }
    } catch (err) {
      setResult({
        kind: "error",
        status: 0,
        body: { error: { code: "network", message: String(err) } },
      });
    } finally {
      setPending(false);
    }
  };

  const copyToken = async () => {
    if (result?.kind !== "ok") return;
    try {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Try it — get a token
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Submit credentials below to call <code>POST /api/v1/auth/login</code>{" "}
        and copy the returned JWT.
      </p>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Requesting..." : "Send request"}
          </button>
        </div>
      </form>

      {result?.kind === "ok" ? (
        <div className="mt-5 flex flex-col gap-3">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {result.status} OK — signed in as{" "}
            <strong>{result.user.email}</strong> (role:{" "}
            <code>{result.user.role}</code>)
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                JWT token
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {revealed ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={copyToken}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              <code className="break-all whitespace-pre-wrap">
                {revealed
                  ? result.token
                  : `${result.token.slice(0, 24)}…${result.token.slice(-12)}`}
              </code>
            </pre>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Send as <code>Authorization: Bearer &lt;token&gt;</code> on
              subsequent requests. Token expires in 7 days.
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              User
            </p>
            <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              <code>{JSON.stringify(result.user, null, 2)}</code>
            </pre>
          </div>
        </div>
      ) : null}

      {result?.kind === "error" ? (
        <div className="mt-5 flex flex-col gap-2">
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {result.status || "Network error"} — request failed
          </div>
          <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <code>{JSON.stringify(result.body, null, 2)}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
