import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ fictional: true, officials: [] });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("ministry_officials").select("id,ministry,full_name,title,portfolio,updated_at").eq("published", true).order("ministry").order("title");
  if (error) return NextResponse.json({ fictional: true, officials: [], error: "Published personnel records are temporarily unavailable." }, { status: 503 });
  return NextResponse.json({ fictional: true, officials: data || [] }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
}