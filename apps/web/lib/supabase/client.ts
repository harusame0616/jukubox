import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './config'

export function createClient(): ReturnType<typeof createBrowserClient> {
  const supabasePublicConfig = getSupabaseConfig()

  return createBrowserClient(
    supabasePublicConfig.url,
    supabasePublicConfig.anonKey
  )
}
