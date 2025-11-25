// lib/supabase.ts
// Deprecated global client — prefer using `createClient()` from
// `utils/supabase/client.ts` (which uses the auth-helpers). Re-export
// the helper to keep compatibility.
export { createClient } from "@/utils/supabase/client"
