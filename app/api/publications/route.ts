import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publications as fallbackPublications } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ fictional: true, publications: fallbackPublications, source: "fallback" });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("publications").select("id,title,department,summary,document_url,published_on").eq("published", true).order("published_on", { ascending: false });
  if (error) return NextResponse.json({ fictional: true, publications: [], error: "Published documents are temporarily unavailable." }, { status: 503 });
  const result = (data || []).map(row => ({ ...row, date: row.published_on, href: row.document_url || "/publications#" + row.title.toLowerCase().replaceAll(" ", "-") }));
  return NextResponse.json({ fictional: true, publications: result, source: "supabase" }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
}