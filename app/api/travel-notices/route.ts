import { NextResponse } from "next/server";
import { travelNotices, levelMeta } from "@/lib/data";
export const dynamic = "force-static";
export async function GET() {
  return NextResponse.json({ fictional: true, notices: travelNotices.map(notice => ({ ...notice, guidance: levelMeta[notice.level] })) }, { headers: { "Cache-Control": "public, max-age=60" } });
}
