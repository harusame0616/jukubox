import { expect, test as base, vi } from "vitest";
import { generateApiKey } from "./generate-api-key.action";

const getSessionMock = vi.fn<() => Promise<{ data: { session: unknown } }>>();
const revalidatePathMock = vi.fn<(path: string) => void>();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getSession: getSessionMock },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

const test = base.extend<{ generateApiKey: typeof generateApiKey }>({
  generateApiKey: async ({}, provide) => {
    getSessionMock.mockReset();
    revalidatePathMock.mockReset();
    vi.unstubAllGlobals();
    await provide(generateApiKey);
  },
});

test("session が無い場合は UNAUTHORIZED コードを返す", async ({
  generateApiKey,
}) => {
  getSessionMock.mockResolvedValue({ data: { session: null } });

  const result = await generateApiKey();

  expect(result).toEqual({ success: false, code: "UNAUTHORIZED" });
});

test("API が 401 を返した場合は UNAUTHORIZED コードを返す", async ({
  generateApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-1" }, access_token: "token-1" },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 401 })),
  );

  const result = await generateApiKey();

  expect(result).toEqual({ success: false, code: "UNAUTHORIZED" });
});

test("API が 409 を返した場合は APIKEY_QUOTA_EXCEEDS_LIMIT コードを返す", async ({
  generateApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-1" }, access_token: "token-1" },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 409 })),
  );

  const result = await generateApiKey();

  expect(result).toEqual({
    success: false,
    code: "APIKEY_QUOTA_EXCEEDS_LIMIT",
  });
});

test("API が 503 を返した場合は APIKEY_LOCK_TIMEOUT コードを返す", async ({
  generateApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-1" }, access_token: "token-1" },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 503 })),
  );

  const result = await generateApiKey();

  expect(result).toEqual({ success: false, code: "APIKEY_LOCK_TIMEOUT" });
});

test("API がその他のエラーを返した場合は INTERNAL_ERROR コードを返す", async ({
  generateApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-1" }, access_token: "token-1" },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 500 })),
  );

  const result = await generateApiKey();

  expect(result).toEqual({ success: false, code: "INTERNAL_ERROR" });
});

test("API が 200 を返した場合は apiKey を返し revalidatePath を呼ぶ", async ({
  generateApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-1" }, access_token: "token-1" },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        { apikey: "jukubox_plain_text_value" },
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ),
  );

  const result = await generateApiKey();

  expect(result).toEqual({ success: true, apiKey: "jukubox_plain_text_value" });
  expect(revalidatePathMock).toHaveBeenCalledWith("/settings/api-keys");
});

test("API URL とユーザー ID と Authorization ヘッダーが正しく組み立てられる", async ({
  generateApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-xyz" }, access_token: "token-xyz" },
    },
  });
  const fetchMock = vi.fn(async () =>
    Response.json({ apikey: "k" }, { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await generateApiKey();

  expect(fetchMock).toHaveBeenCalledWith(
    `${process.env.API_URL}/v1/users/user-xyz/apikeys`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer token-xyz",
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
});
