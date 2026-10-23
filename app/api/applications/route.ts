import { NextResponse } from "next/server";
// This endpoint deliberately does not persist application data. Use an authenticated,
// database-backed service before enabling server-side submissions.
export async function GET() {
  return NextResponse.json({ fictional: true, storage: "browser-local", message: "Application records are stored in the submitting browser. No server-side records are available.", applications: [] });
}
export async function POST() {
  return NextResponse.json({ fictional: true, error: "Server-side submission is disabled for this demo. Use the browser-local roleplay form." }, { status: 501 });
}
