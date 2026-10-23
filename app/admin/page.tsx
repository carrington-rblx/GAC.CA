"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) router.replace("/admin/dashboard");
      });
    } catch {
      setMessage("Administrator sign-in is not configured yet. Deployment environment variables are required.");
    }
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed. Check your credentials and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="shell py-8">
    <p className="mb-6 text-sm"><Link href="/">Home</Link> › Administrator Room</p>
    <section className="mb-8 bg-[#961514] p-8 text-white">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest">Restricted access · staff only</p>
      <h1 className="text-3xl font-bold sm:text-4xl">GAC.CA Administrator Room</h1>
      <p className="mt-3 max-w-3xl">Sign in with an account provisioned by the site administrator. Access is enforced by Supabase authentication and database row-level security.</p>
    </section>
    <div className="grid items-start gap-8 md:grid-cols-2">
      <form onSubmit={submit} className="space-y-4 border border-[#B1B4B6] p-6">
        <h2 className="text-2xl font-bold">Staff sign in</h2>
        <div><label className="field-label" htmlFor="email">Email address</label><input className="field" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></div>
        <div><label className="field-label" htmlFor="password">Password</label><input className="field" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></div>
        <button className="btn-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
        {message && <p role="alert" className="border-l-4 border-[#F47738] bg-[#F3F2F1] p-3">{message}</p>}
      </form>
      <aside className="border border-[#B1B4B6] border-t-4 border-t-[#1D70B8] bg-[#F3F2F1] p-6">
        <h2 className="mb-3 text-xl font-bold">Access policy</h2>
        <ul className="list-disc space-y-2 pl-5 leading-7">
          <li>The administrator controls staff access and publication decisions.</li>
          <li>Editors can submit proposed changes but cannot directly publish records.</li>
          <li>Unpublished records are hidden from public read policies.</li>
          <li>Do not share staff passwords or service-role keys.</li>
        </ul>
        <p className="mt-5 text-sm">This is a fictional roleplay service, not a Canadian government system.</p>
        <p className="mt-4"><Link href="/travel-advice">Public travel notices</Link> · <Link href="/publications">Publications</Link></p>
      </aside>
    </div>
  </div>;
}