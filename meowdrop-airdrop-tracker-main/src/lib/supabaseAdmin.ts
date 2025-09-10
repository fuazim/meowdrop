import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily create service-role client to avoid build-time env requirement
let cached: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or URL missing");
  }
  cached = createClient(supabaseUrl, serviceKey);
  return cached;
}
