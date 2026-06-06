import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for privileged server-side writes. This bypasses RLS,
// so it must ONLY ever be imported from server code (route handlers / server
// actions). The "server-only" import above enforces that at build time.
export const createAdminClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
