import { createBrowserClient } from '@supabase/ssr'

// Fallback values prevent the Supabase client from throwing during
// Next.js static prerendering when env vars aren't injected server-side.
// Real values are always present in the browser at runtime.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// Singleton for convenience
let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient()
  }
  return _client
}
