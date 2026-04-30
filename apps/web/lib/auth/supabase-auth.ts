import type { SupabaseClient } from "@supabase/supabase-js";
import type { Auth, SignInWithOAuthInput } from "./types";

export class SupabaseAuth implements Auth {
  constructor(private readonly supabase: SupabaseClient) {}

  async signInWithOAuth(input: SignInWithOAuthInput): Promise<void> {
    await this.supabase.auth.signInWithOAuth({
      provider: input.provider,
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback`,
      },
    });
  }
}
