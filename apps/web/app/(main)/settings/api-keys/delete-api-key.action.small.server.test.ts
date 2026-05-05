import { expect, test as base, vi } from "vitest";
import { deleteApiKey } from "./delete-api-key.action";

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

const test = base.extend<{ deleteApiKey: typeof deleteApiKey }>({
  deleteApiKey: async ({}, provide) => {
    getSessionMock.mockReset();
    revalidatePathMock.mockReset();
    vi.unstubAllGlobals();
    await provide(deleteApiKey);
  },
});

test("session が無い場合は UNAUTHORIZED コードを返す", async ({
  deleteApiKey,
}) => {
  getSessionMock.mockResolvedValue({ data: { session: null } });

  const result = await deleteApiKey("apikey-1");

  expect(result).toEqual({ success: false, code: "UNAUTHORIZED" });
});

test("API が 401 を返した場合は UNAUTHORIZED コードを返す", async ({
  deleteApiKey,
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

  const result = await deleteApiKey("apikey-1");

  expect(result).toEqual({ success: false, code: "UNAUTHORIZED" });
});

test("API が 404 を返した場合は APIKEY_NOT_FOUND コードを返す", async ({
  deleteApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-1" }, access_token: "token-1" },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 404 })),
  );

  const result = await deleteApiKey("apikey-1");

  expect(result).toEqual({ success: false, code: "APIKEY_NOT_FOUND" });
});

test("API がその他のエラーを返した場合は INTERNAL_ERROR コードを返す", async ({
  deleteApiKey,
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

  const result = await deleteApiKey("apikey-1");

  expect(result).toEqual({ success: false, code: "INTERNAL_ERROR" });
});

test("API が 204 を返した場合は success を返し revalidatePath を呼ぶ", async ({
  deleteApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-1" }, access_token: "token-1" },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 204 })),
  );

  const result = await deleteApiKey("apikey-1");

  expect(result).toEqual({ success: true });
  expect(revalidatePathMock).toHaveBeenCalledWith("/settings/api-keys");
});

test("API URL に apiKeyId が組み立てられ、Authorization ヘッダーが設定される", async ({
  deleteApiKey,
}) => {
  getSessionMock.mockResolvedValue({
    data: {
      session: { user: { id: "user-xyz" }, access_token: "token-xyz" },
    },
  });
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await deleteApiKey("11111111-1111-1111-1111-111111111111");

  expect(fetchMock).toHaveBeenCalledWith(
    `${process.env.API_URL}/v1/me/apikeys/11111111-1111-1111-1111-111111111111`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer token-xyz",
      },
    },
  );
});
