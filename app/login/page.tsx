"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockClosed24Regular } from "@fluentui/react-icons";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace("/");
      router.refresh();
    } else if (res.status === 503) {
      setError("This deployment is not configured yet. Its administrator must set APP_PASSWORD and AUTH_SECRET.");
      setBusy(false);
    } else if (res.status === 401) {
      setError("Incorrect password.");
      setBusy(false);
    } else {
      setError("The server could not process the request. Try again in a moment.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy p-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 text-center text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Bayer
          </div>
          <h1 className="mt-1 text-[22px] font-bold leading-tight">
            Public Affairs
            <span className="block text-[15px] font-semibold text-white/80">
              Value Capture System
            </span>
          </h1>
        </div>

        <form onSubmit={submit} className="card p-6">
          <label className="label mb-1.5 block" htmlFor="password">
            Access password
          </label>
          <div className="relative">
            <LockClosed24Regular className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field pl-8"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="mt-2 text-[12px] font-semibold text-red">{error}</p>}

          <button type="submit" disabled={busy || !password} className="btn-primary mt-4 w-full justify-center">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-white/50">
          Internal demo environment. Contains sample data only.
        </p>
      </div>
    </main>
  );
}
