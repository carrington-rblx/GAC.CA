import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    // Next.js prerenders client components during builds, where runtime environment values may be absent.
    if (typeof window === "undefined") return createBrowserClient("https://placeholder.supabase.co", "build-placeholder-key");
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the deployment environment.");
  }

  return createBrowserClient(url, key);
}