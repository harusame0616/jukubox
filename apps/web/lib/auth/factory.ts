import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthConfig } from "./config";
import { MockAuth } from "./mock-auth";
import { SupabaseAuth } from "./supabase-auth";
import type { Auth } from "./types";

export type { Auth, SignInWithOAuthInput } from "./types";

export function createAuth(supabase: SupabaseClient): Auth {
  const config = getAuthConfig();
  if (config.isMocked) {
    return new MockAuth(supabase, {
      email: config.email,
      password: config.password,
    });
  }
  return new SupabaseAuth(supabase);
}
