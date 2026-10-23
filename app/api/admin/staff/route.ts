import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !serviceKey) return NextResponse.json({ error: "Server configuration is incomplete. The service-role key must be configured server-side." }, { status: 503 });

  const cookieStore = cookies();
  const sessionClient = createServerClient(url, publishableKey, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value; },
      set(name, value, options) { cookieStore.set({ name, value, ...options }); },
      remove(name, options) { cookieStore.set({ name, value: "", ...options }); }
    }
  });
  const { data: auth } = await sessionClient.auth.getUser();
  if (!auth.user || auth.user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile } = await admin.from("staff_profiles").select("active,role").eq("id", auth.user.id).maybeSingle();
  if (!profile?.active || profile.role !== "admin") return NextResponse.json({ error: "This account is not an active administrator." }, { status: 403 });

  let body: { email?: string; display_name?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const email = body.email?.trim().toLowerCase();
  const displayName = body.display_name?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName) return NextResponse.json({ error: "Provide a valid email address and display name." }, { status: 400 });

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { data: { display_name: displayName } });
  if (inviteError || !invited.user) return NextResponse.json({ error: inviteError?.message || "Could not invite editor." }, { status: 400 });
  const { error: roleError } = await admin.auth.admin.updateUserById(invited.user.id, { app_metadata: { role: "editor" } });
  if (roleError) return NextResponse.json({ error: "Invitation was created but role assignment failed. Contact the administrator before the user signs in." }, { status: 500 });
  const { error: profileError } = await admin.from("staff_profiles").upsert({ id: invited.user.id, display_name: displayName, role: "editor", active: true });
  if (profileError) return NextResponse.json({ error: "Invitation was created but staff profile setup failed." }, { status: 500 });
  return NextResponse.json({ ok: true, email, message: "Editor invitation sent." });
}