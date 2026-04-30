import type { SupabaseClient } from "@supabase/supabase-js";
import type { Auth } from "./types";

export interface MockAuthCredentials {
  email: string;
  password: string;
}

export class MockAuth implements Auth {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly credentials: MockAuthCredentials,
  ) {}

  async signInWithOAuth(): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email: this.credentials.email,
      password: this.credentials.password,
    });
    if (error) {
      throw new Error(`Mock auth failed: ${error.message}`);
    }
    globalThis.location.href = "/";
  }
}
