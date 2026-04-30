import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test as base, vi } from "vitest";
import { createAuth } from "./factory";
import { MockAuth } from "./mock-auth";
import { SupabaseAuth } from "./supabase-auth";

const fakeSupabase = {} as unknown as SupabaseClient;

const test = base.extend<{ createAuth: typeof createAuth }>({
  createAuth: async ({}, provide) => {
    vi.unstubAllEnvs();
    await provide(createAuth);
  },
});

test("NEXT_PUBLIC_IS_MOCKED=false の場合は SupabaseAuth を返す", ({
  createAuth,
}) => {
  vi.stubEnv("NEXT_PUBLIC_IS_MOCKED", "false");

  const auth = createAuth(fakeSupabase);

  expect(auth).toBeInstanceOf(SupabaseAuth);
});

test("NEXT_PUBLIC_IS_MOCKED=true の場合は MockAuth を返す", ({
  createAuth,
}) => {
  vi.stubEnv("NEXT_PUBLIC_IS_MOCKED", "true");
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_EMAIL", "user@example.com");
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_PASSWORD", "secret123");

  const auth = createAuth(fakeSupabase);

  expect(auth).toBeInstanceOf(MockAuth);
});
