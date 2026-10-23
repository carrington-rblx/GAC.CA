import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const githubToken = process.env.GAC_GITHUB_TOKEN;
  if (!url || !publishableKey || !serviceKey || !githubToken) {
    return NextResponse.json({ error: "Publishing needs server environment variables: Supabase URL, publishable key, SUPABASE_SERVICE_ROLE_KEY, and GAC_GITHUB_TOKEN." }, { status: 503 });
  }

  const cookieStore = cookies();
  const sessionClient = createServerClient(url, publishableKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      }
    }
  });
  const { data: auth } = await sessionClient.auth.getUser();
  if (!auth.user || auth.user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile } = await db.from("staff_profiles").select("active,role").eq("id", auth.user.id).maybeSingle();
  if (!profile?.active || profile.role !== "admin") return NextResponse.json({ error: "This account is not an active administrator." }, { status: 403 });

  const [notices, officials, publications] = await Promise.all([
    db.from("travel_notices").select("id,country,level,notice_text,published,updated_at").eq("published", true).order("country"),
    db.from("ministry_officials").select("id,ministry,full_name,title,portfolio,published,updated_at").eq("published", true).order("ministry"),
    db.from("publications").select("id,title,department,summary,document_url,published_on,published,updated_at").eq("published", true).order("published_on", { ascending: false })
  ]);
  const dbError = notices.error || officials.error || publications.error;
  if (dbError) return NextResponse.json({ error: "Could not read approved published content." }, { status: 500 });

  const snapshot = {
    generated_at: new Date().toISOString(),
    fictional: true,
    source: "GAC.CA Administrator Room",
    travel_notices: notices.data || [],
    ministry_officials: officials.data || [],
    publications: publications.data || []
  };
  const owner = "carrington-rblx";
  const repo = "GAC.CA";
  const path = "data/published-content.json";
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" };
  const existingResponse = await fetch(apiUrl, { headers: { Authorization: headers.Authorization, Accept: headers.Accept, "X-GitHub-Api-Version": headers["X-GitHub-Api-Version"] }, cache: "no-store" });
  let sha: string | undefined;
  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    sha = existing.sha;
  } else if (existingResponse.status !== 404) {
    const details = await existingResponse.text();
    return NextResponse.json({ error: "GitHub could not read the snapshot file.", details: details.slice(0, 300) }, { status: 502 });
  }
  const payload: Record<string, string> = {
    message: "Publish approved GAC.CA roleplay content snapshot",
    content: Buffer.from(JSON.stringify(snapshot, null, 2), "utf8").toString("base64"),
    branch: "main"
  };
  if (sha) payload.sha = sha;
  const writeResponse = await fetch(apiUrl, { method: "PUT", headers, body: JSON.stringify(payload), cache: "no-store" });
  const writeData = await writeResponse.json().catch(() => ({}));
  if (!writeResponse.ok) return NextResponse.json({ error: "GitHub rejected the publish request. Check the token's repository Contents write permission.", details: writeData.message || "Unknown GitHub API error." }, { status: 502 });
  return NextResponse.json({ ok: true, commit_url: writeData.commit?.html_url || null, message: "Published content snapshot committed to the main branch." });
}