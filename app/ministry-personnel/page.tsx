"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Official = { id: string; ministry: string; full_name: string; title: string; portfolio: string | null; updated_at: string };

export default function MinistryPersonnel() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/ministry-officials")
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Could not load the personnel directory.")))
      .then(data => setOfficials(Array.isArray(data.officials) ? data.officials : []))
      .catch(reason => setError(reason instanceof Error ? reason.message : "Could not load the personnel directory."))
      .finally(() => setLoading(false));
  }, []);

  return <div className="shell py-8">
    <p className="mb-6 text-sm"><Link href="/">Home</Link> › Ministry personnel</p>
    <section className="mb-8 bg-[#961514] p-8 text-white">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest">Staff directory</p>
      <h1 className="text-3xl font-bold sm:text-4xl">Ministry personnel</h1>
      <p className="mt-3 max-w-3xl">A directory of government personnel, titles and departmental portfolios.</p>
    </section>
    {loading ? <p role="status">Loading personnel records…</p> : error ? <p role="alert" className="border-l-4 border-[#F47738] bg-[#F3F2F1] p-4">{error}</p> : officials.length === 0 ? <section className="border border-[#B1B4B6] p-6"><h2 className="mb-2 text-xl font-bold">No published personnel records</h2><p>Published appointments will appear here after an administrator approves and publishes them.</p></section> : <div className="space-y-4">{officials.map(person => <article key={person.id} className="border border-[#B1B4B6] border-l-4 border-l-[#1D70B8] p-6"><p className="mb-2 text-sm font-bold text-[#505A5F]">{person.ministry}</p><h2 className="text-2xl font-bold">{person.full_name}</h2><p className="mt-1 text-lg">{person.title}</p>{person.portfolio && <p className="mt-3 leading-7">{person.portfolio}</p>}</article>)}</div>}
  </div>;
}