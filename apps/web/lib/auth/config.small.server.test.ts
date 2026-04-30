import { expect, test as base, vi } from "vitest";
import { getAuthConfig } from "./config";

const test = base.extend<{ getAuthConfig: typeof getAuthConfig }>({
  getAuthConfig: async ({}, provide) => {
    vi.unstubAllEnvs();
    await provide(getAuthConfig);
  },
});

test("NEXT_PUBLIC_IS_MOCKED 未設定の場合は isMocked: false", ({
  getAuthConfig,
}) => {
  // eslint-disable-next-line unicorn/no-useless-undefined
  vi.stubEnv("NEXT_PUBLIC_IS_MOCKED", undefined);

  expect(getAuthConfig()).toEqual({ isMocked: false });
});

test("NEXT_PUBLIC_IS_MOCKED=false の場合は isMocked: false", ({
  getAuthConfig,
}) => {
  vi.stubEnv("NEXT_PUBLIC_IS_MOCKED", "false");

  expect(getAuthConfig()).toEqual({ isMocked: false });
});

test("NEXT_PUBLIC_IS_MOCKED=true かつ email/password が揃っていれば isMocked: true で返す", ({
  getAuthConfig,
}) => {
  vi.stubEnv("NEXT_PUBLIC_IS_MOCKED", "true");
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_EMAIL", "user@example.com");
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_PASSWORD", "secret123");

  expect(getAuthConfig()).toEqual({
    isMocked: true,
    email: "user@example.com",
    password: "secret123",
  });
});

test("NEXT_PUBLIC_IS_MOCKED=true かつ email が無効なら throw する", ({
  getAuthConfig,
}) => {
  vi.stubEnv("NEXT_PUBLIC_IS_MOCKED", "true");
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_EMAIL", "not-an-email");
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_PASSWORD", "secret123");

  expect(() => getAuthConfig()).toThrow();
});

test("NEXT_PUBLIC_IS_MOCKED=true かつ password が短すぎたら throw する", ({
  getAuthConfig,
}) => {
  vi.stubEnv("NEXT_PUBLIC_IS_MOCKED", "true");
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_EMAIL", "user@example.com");
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_PASSWORD", "x");

  expect(() => getAuthConfig()).toThrow();
});
