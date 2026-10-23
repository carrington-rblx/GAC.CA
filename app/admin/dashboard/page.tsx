"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Section = "travel_notices" | "ministry_officials" | "publications";
type Submission = { id: string; section: Section; action: "create" | "edit" | "delete"; target_id: string | null; proposed_data: Record<string, unknown>; status: "pending" | "approved" | "rejected"; submitted_at: string; review_note: string | null; submitted_by: string };
type ContentRow = Record<string, unknown> & { id: string };
const sectionLabels: Record<Section, string> = { travel_notices: "Travel notices", ministry_officials: "Ministry personnel", publications: "Publications" };
const templates: Record<Section, Record<string, unknown>> = {
  travel_notices: { country: "Example country", level: "YELLOW", notice_text: "Fictional roleplay notice text.", published: false },
  ministry_officials: { ministry: "Global Affairs Canada", full_name: "Example Name", title: "Minister", portfolio: "", published: false },
  publications: { title: "Example publication", department: "Global Affairs Canada", summary: "Fictional publication summary.", document_url: "", published_on: new Date().toISOString().slice(0, 10), published: false }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "editor" | null>(null);
  const [section, setSection] = useState<Section>("travel_notices");
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [draft, setDraft] = useState(JSON.stringify(templates.travel_notices, null, 2));
  const [targetId, setTargetId] = useState("");
  const [action, setAction] = useState<"create" | "edit" | "delete">("create");
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editorEmail, setEditorEmail] = useState("");
  const [editorName, setEditorName] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/admin"); return; }
    setUser(auth.user);
    const claimedRole = auth.user.app_metadata?.role;
    if (claimedRole !== "admin" && claimedRole !== "editor") {
      await supabase.auth.signOut();
      setMessage("This account has no approved staff role. Ask the administrator to provision it.");
      router.replace("/admin");
      return;
    }
    const { data: profile } = await supabase.from("staff_profiles").select("active,role").eq("id", auth.user.id).maybeSingle();
    if (!profile?.active || profile.role !== claimedRole) {
      await supabase.auth.signOut();
      setMessage("This staff account is inactive or not provisioned. Contact the administrator.");
      router.replace("/admin");
      return;
    }
    setRole(claimedRole);
    const { data: content, error: contentError } = await supabase.from(section).select("*").order("updated_at", { ascending: false });
    if (contentError) setMessage(contentError.message); else setRows((content || []) as ContentRow[]);
    const { data: proposals, error: proposalError } = await supabase.from("content_submissions").select("*").order("submitted_at", { ascending: false }).limit(100);
    if (proposalError) setMessage(proposalError.message); else setSubmissions((proposals || []) as Submission[]);
  }, [router, section, supabase]);

  useEffect(() => { load().catch(error => setMessage(error instanceof Error ? error.message : "Could not load dashboard.")); }, [load]);

  function changeSection(next: Section) {
    setSection(next); setTargetId(""); setAction("create"); setDraft(JSON.stringify(templates[next], null, 2)); setMessage("");
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/admin"); router.refresh(); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Enter one JSON object.");
      if (role === "editor") {
        const { error } = await supabase.from("content_submissions").insert({ section, action, target_id: action === "create" ? null : targetId || null, proposed_data: parsed, status: "pending", submitted_by: user?.id });
        if (error) throw error;
        setMessage("Proposal submitted for administrator review. Nothing has been published.");
      } else {
        if (action === "delete") {
          if (!targetId) throw new Error("Select a record to delete.");
          const { error } = await supabase.from(section).delete().eq("id", targetId);
          if (error) throw error;
        } else {
          const payload = { ...parsed, updated_by: user?.id, updated_at: new Date().toISOString() };
          if (action === "edit") {
            if (!targetId) throw new Error("Select a record to edit.");
            const { error } = await supabase.from(section).update(payload).eq("id", targetId);
            if (error) throw error;
          } else {
            const { error } = await supabase.from(section).insert(payload);
            if (error) throw error;
          }
        }
        setMessage("Record saved to the database. Public visibility follows its published setting." + await syncGitHubSnapshot());
      }
      setTargetId(""); setAction("create"); setDraft(JSON.stringify(templates[section], null, 2)); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save failed."); }
    finally { setBusy(false); }
  }

  async function review(item: Submission, status: "approved" | "rejected") {
    if (role !== "admin") return;
    setBusy(true); setMessage("");
    try {
      if (status === "approved") {
        if (item.action === "delete") {
          if (!item.target_id) throw new Error("This deletion proposal has no target record.");
          const { error } = await supabase.from(item.section).delete().eq("id", item.target_id);
          if (error) throw error;
        } else if (item.action === "edit") {
          if (!item.target_id) throw new Error("This edit proposal has no target record.");
          const { error } = await supabase.from(item.section).update({ ...item.proposed_data, updated_by: user?.id, updated_at: new Date().toISOString() }).eq("id", item.target_id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(item.section).insert({ ...item.proposed_data, updated_by: user?.id });
          if (error) throw error;
        }
      }
      const { error } = await supabase.from("content_submissions").update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString(), review_note: reviewNote[item.id] || null }).eq("id", item.id);
      if (error) throw error;
      setMessage(status === "approved" ? "Proposal approved and applied to the database." + await syncGitHubSnapshot() : "Proposal rejected.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Review failed."); }
    finally { setBusy(false); }
  }

  function loadRecord(row: ContentRow) {
    setTargetId(row.id); setAction("edit");
    const { id: _id, updated_at: _updatedAt, updated_by: _updatedBy, ...editable } = row;
    setDraft(JSON.stringify(editable, null, 2));
  }

  async function inviteEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: editorEmail, display_name: editorName }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not invite editor.");
      setMessage(result.message || "Editor invitation sent."); setEditorEmail(""); setEditorName("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not invite editor."); }
    finally { setBusy(false); }
  }

  async function syncGitHubSnapshot() {
    const response = await fetch("/api/admin/publish", { method: "POST" });
    const result = await response.json();
    if (!response.ok) return " GitHub sync did not complete: " + (result.error || "Unknown error.");
    return result.commit_url ? " GitHub commit: " + result.commit_url : " GitHub snapshot published.";
  }

  async function publishNow() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/publish", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Publish failed.");
      setMessage(result.commit_url ? "Published to GitHub: " + result.commit_url : result.message || "Published to GitHub.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Publish failed."); }
    finally { setBusy(false); }
  }

  if (!user || !role) return <div className="shell py-12"><p role="status">{message || "Checking staff access…"}</p><p className="mt-4"><Link href="/admin">Return to sign in</Link></p></div>;

  const ownSubmissions = submissions.filter(item => role === "admin" || item.submitted_by === user.id);
  const pending = submissions.filter(item => item.status === "pending");

  return <div className="shell py-8">
    <p className="mb-6 text-sm"><Link href="/">Home</Link> › <Link href="/admin">Administrator Room</Link> › Dashboard</p>
    <section className="mb-8 flex flex-wrap items-start justify-between gap-4 bg-[#961514] p-8 text-white">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-widest">Restricted staff workspace</p><h1 className="text-3xl font-bold sm:text-4xl">Content management</h1><p className="mt-3">{user.email} · {role === "admin" ? "Administrator" : "Editor"}</p></div>
      <button onClick={signOut} className="border border-white px-4 py-2 font-bold hover:bg-white hover:text-[#961514]">Sign out</button>
    </section>
    {role === "admin" && <section className="mb-8 grid gap-6 border border-[#B1B4B6] p-5 md:grid-cols-2">
      <div><h2 className="mb-2 text-xl font-bold">Invite an editor</h2><p className="mb-4 text-sm">Send an email invitation. New accounts receive the editor role and can propose changes only.</p>
        <form onSubmit={inviteEditor} className="space-y-3"><div><label className="field-label" htmlFor="editor-name">Display name</label><input id="editor-name" className="field" value={editorName} onChange={e=>setEditorName(e.target.value)} required /></div><div><label className="field-label" htmlFor="editor-email">Editor email</label><input id="editor-email" type="email" className="field" value={editorEmail} onChange={e=>setEditorEmail(e.target.value)} required /></div><button className="btn-primary" disabled={busy}>{busy ? "Working…" : "Invite editor"}</button></form>
      </div>
      <div><h2 className="mb-2 text-xl font-bold">Publish approved content</h2><p className="mb-4 text-sm">Commit a snapshot of all currently published notices, ministry personnel, and publications to the main GitHub branch. This triggers the normal site deployment workflow.</p><button className="btn-primary" disabled={busy} onClick={publishNow}>{busy ? "Working…" : "Publish snapshot to GitHub"}</button><p className="mt-3 text-xs text-[#505A5F]">Requires the server-only Supabase service key and a GitHub token with Contents read/write access.</p></div>
    </section>}
    {message && <p role="status" className="mb-6 border-l-4 border-[#F47738] bg-[#F3F2F1] p-4">{message}</p>}
    <section className="mb-8 border border-[#B1B4B6] p-5">
      <h2 className="mb-4 text-xl font-bold">Manage content</h2>
      <div className="mb-5 flex flex-wrap gap-2">{(Object.keys(sectionLabels) as Section[]).map(key => <button key={key} onClick={() => changeSection(key)} className={section === key ? "btn-primary" : "border border-[#505A5F] px-4 py-2 font-bold"}>{sectionLabels[key]}</button>)}</div>
      <p className="mb-4 text-sm text-[#505A5F]">{role === "admin" ? "Administrator changes are saved to the separate Supabase database. Check Published before making a record public." : "Editors submit JSON proposals for administrator review. Proposals do not change public content until approved."}</p>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="action">Action</label><select id="action" className="field" value={action} onChange={e => setAction(e.target.value as typeof action)}><option value="create">Create record</option><option value="edit">Edit existing record</option><option value="delete">Delete existing record</option></select></div>
          <div><label className="field-label" htmlFor="record">Existing record</label><select id="record" className="field" value={targetId} onChange={e => { const id=e.target.value; setTargetId(id); const row=rows.find(r=>r.id===id); if(row) loadRecord(row); }}><option value="">Select a record…</option>{rows.map(row=><option key={row.id} value={row.id}>{String(row.country || row.full_name || row.title || row.id)}</option>)}</select></div>
        </div>
        <div><label className="field-label" htmlFor="draft">Record data (JSON)</label><textarea id="draft" className="field min-h-64 font-mono text-sm" value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false} /></div>
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : role === "admin" ? "Save database changes" : "Submit for review"}</button>
        {role === "admin" && action === "delete" && <p className="text-sm">Deletion is permanent for this database record. Use the existing record selector to choose the target.</p>}
      </form>
      <h3 className="mb-3 mt-8 text-lg font-bold">Current records ({rows.length})</h3>
      {rows.length === 0 ? <p>No records found in this section.</p> : <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead className="bg-[#F3F2F1]"><tr><th className="border-b p-3">Record</th><th className="border-b p-3">Published</th><th className="border-b p-3">Updated</th><th className="border-b p-3">Load</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-b"><td className="p-3">{String(row.country || row.full_name || row.title || row.id)}</td><td className="p-3">{row.published ? "Yes" : "No"}</td><td className="p-3">{String(row.updated_at || "—")}</td><td className="p-3"><button className="font-bold underline" onClick={() => loadRecord(row)}>Edit JSON</button></td></tr>)}</tbody></table></div>}
    </section>
    <section className="border border-[#B1B4B6] p-5">
      <h2 className="mb-2 text-xl font-bold">{role === "admin" ? "Editor submissions" : "My submissions"}</h2>
      <p className="mb-4 text-sm text-[#505A5F]">{role === "admin" ? "Review pending editor proposals. Approving applies the proposed change to the database." : "Track the status of proposals you have sent for review."}</p>
      {ownSubmissions.length === 0 ? <p>No submissions yet.</p> : <div className="space-y-4">{ownSubmissions.map(item=><article key={item.id} className="border border-[#B1B4B6] p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{sectionLabels[item.section]} · {item.action}</h3><span className="text-sm font-bold uppercase">{item.status}</span></div><p className="my-2 text-sm">Submitted {new Date(item.submitted_at).toLocaleString()} · {item.submitted_by}</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap bg-[#F3F2F1] p-3 text-xs">{JSON.stringify(item.proposed_data, null, 2)}</pre>{role === "admin" && item.status === "pending" && <div className="mt-3 space-y-3"><label className="field-label" htmlFor={"note-"+item.id}>Review note (optional)</label><input id={"note-"+item.id} className="field" value={reviewNote[item.id] || ""} onChange={e=>setReviewNote(prev=>({...prev,[item.id]:e.target.value}))}/><div className="flex gap-3"><button disabled={busy} className="btn-primary" onClick={() => review(item,"approved")}>Approve</button><button disabled={busy} className="border border-[#961514] px-4 py-2 font-bold text-[#961514]" onClick={() => review(item,"rejected")}>Reject</button></div></div>}{item.review_note && <p className="mt-3 text-sm">Review note: {item.review_note}</p>}</article>)}</div>}
    </section>
    <p className="mt-6 text-sm"><Link href="/admin">Return to sign-in page</Link></p>
  </div>;
}