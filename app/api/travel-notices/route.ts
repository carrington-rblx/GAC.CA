import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { levelMeta, TravelLevel, travelNotices as fallbackNotices } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ fictional: true, notices: fallbackNotices.map(notice => ({ ...notice, guidance: levelMeta[notice.level] })), source: "fallback" });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("travel_notices").select("country,level,notice_text,updated_at").eq("published", true).order("country");
  if (error) return NextResponse.json({ fictional: true, notices: [], error: "Published notices are temporarily unavailable." }, { status: 503 });
  const notices = (data || []).map(row => ({ country: row.country, level: row.level as TravelLevel, updated: row.updated_at, text: row.notice_text, guidance: levelMeta[row.level as TravelLevel] }));
  return NextResponse.json({ fictional: true, notices, source: "supabase" }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
}