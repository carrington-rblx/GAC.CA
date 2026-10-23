import { NextResponse } from "next/server";
import { publications } from "@/lib/data";
export const dynamic = "force-static";
export async function GET() {
  return NextResponse.json({ fictional: true, publications });
}
