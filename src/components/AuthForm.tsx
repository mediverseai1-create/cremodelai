"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Logo } from "./Logo";

export default function AuthForm({ mode }: { mode: "login" | "signup" | "reset" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const configured = supabaseConfigured();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null);
    if (!configured) { setErr("Authentication is not configured yet. Add the Supabase environment variables."); return; }
    if (mode !== "reset" && password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    const sb = createClient();
    const origin = window.location.origin;
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(sp.get("next")?.startsWith("/app") ? sp.get("next")! : "/app"); router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${origin}/auth/callback?next=/app` } });
        if (error) throw error;
        if (data.session) { router.push("/app"); router.refresh(); } else setInfo("Check your email to verify your account, then sign in.");
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/app/settings` });
        if (error) throw error;
        setInfo("If an account exists for that email, a reset link is on its way.");
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); }
  }

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center"><Logo /></Link>
        <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
          <h1 className="font-display text-2xl font-extrabold">{title}</h1>
          {sp.get("setup") && <p className="rounded-lg bg-amber-50 p-3 text-sm text-warn">Supabase is not configured on this deployment yet.</p>}
          {mode === "signup" && <label className="block"><span className="label">Full name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
          <label className="block"><span className="label">Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          {mode !== "reset" && <label className="block"><span className="label">Password</span><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>}
          {err && <p role="alert" className="text-sm text-bad">{err}</p>}
          {info && <p role="status" className="text-sm text-good">{info}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}</button>
          <div className="flex justify-between text-sm text-muted">
            {mode === "login" ? <><Link href="/signup" className="underline">Create account</Link><Link href="/reset" className="underline">Forgot password?</Link></> : <Link href="/login" className="underline">Back to sign in</Link>}
          </div>
        </form>
      </div>
    </main>
  );
}
