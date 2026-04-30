import { createClient } from "@supabase/supabase-js";
import * as v from "valibot";
import { test as base } from "vitest";

if (globalThis.window !== undefined) {
  throw new TypeError(
    "@/lib/test/auth-fixture はサーバー（テスト）でのみ利用可能です。",
  );
}

export interface LoggedInUser {
  userId: string;
  email: string;
  password: string;
  accessToken: string;
}

interface AuthFixtures {
  loggedInUser: LoggedInUser;
}

export const test = base.extend<AuthFixtures>({
  loggedInUser: async ({}, provide) => {
    const { supabaseUrl, supabaseAnonKey, serviceRoleKey } = v.parse(
      v.object({
        supabaseUrl: v.pipe(v.string(), v.url()),
        supabaseAnonKey: v.pipe(v.string(), v.nonEmpty()),
        serviceRoleKey: v.pipe(v.string(), v.nonEmpty()),
      }),
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    );

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const email = `fixture-${crypto.randomUUID()}@test.local`;
    const password = "password123";

    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (createError) throw createError;
    const userId = created.user.id;

    const { data: signedIn, error: signInError } =
      await anonClient.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    await provide({
      userId,
      email,
      password,
      accessToken: signedIn.session.access_token,
    });

    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;
  },
});
