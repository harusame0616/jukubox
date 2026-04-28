import { Provider } from "jotai";
import { expect, test as base, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { GenerateApiKeyResult as GenerateApiKeyResultType } from "./generate-api-key.action";
import {
  GenerateApiKeyResult,
  GenerateApiKeyTrigger,
} from "./generate-api-key.presenter.client";

const generateApiKeyMock = vi.fn<() => Promise<GenerateApiKeyResultType>>();

vi.mock("./generate-api-key.action", () => ({
  generateApiKey: () => generateApiKeyMock(),
}));

const test = base.extend<{ setup: void }>({
  setup: async ({}, provide) => {
    generateApiKeyMock.mockReset();
    vi.unstubAllGlobals();
    await provide(undefined as never);
  },
});

function Subject(): React.JSX.Element {
  return (
    <Provider>
      <GenerateApiKeyTrigger />
      <GenerateApiKeyResult />
    </Provider>
  );
}

test("初期表示で生成ボタンが表示される", async ({ setup: _setup }) => {
  const screen = await render(<Subject />);
  await expect
    .element(screen.getByRole("button", { name: "API キー生成" }))
    .toBeVisible();
});

test("生成成功時は平文 API キーとコピー・閉じるボタンが表示される", async ({
  setup: _setup,
}) => {
  generateApiKeyMock.mockResolvedValue({
    success: true,
    apiKey: "jukubox_plain_secret_value",
  });

  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "API キー生成" }).click();

  await expect
    .element(screen.getByText("jukubox_plain_secret_value"))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "コピー" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "閉じる" }))
    .toBeVisible();
});

test("閉じるボタンを押すと平文 API キーが非表示になる", async ({
  setup: _setup,
}) => {
  generateApiKeyMock.mockResolvedValue({
    success: true,
    apiKey: "jukubox_temp_key",
  });

  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "API キー生成" }).click();
  await expect.element(screen.getByText("jukubox_temp_key")).toBeVisible();

  await screen.getByRole("button", { name: "閉じる" }).click();

  await expect
    .element(screen.getByText("jukubox_temp_key"))
    .not.toBeInTheDocument();
});

test("コピーボタンを押すとクリップボードに書き込み、コピー完了メッセージを表示する", async ({
  setup: _setup,
}) => {
  generateApiKeyMock.mockResolvedValue({
    success: true,
    apiKey: "jukubox_copy_target",
  });

  const writeTextMock = vi.fn<(value: string) => Promise<void>>(
    async () => {},
  );
  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    clipboard: { writeText: writeTextMock },
  });

  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "API キー生成" }).click();
  await screen.getByRole("button", { name: "コピー" }).click();

  await expect.element(screen.getByText("コピーしました")).toBeVisible();
  expect(writeTextMock).toHaveBeenCalledWith("jukubox_copy_target");
});

test("クォータ超過エラー時にメッセージを表示する", async ({
  setup: _setup,
}) => {
  generateApiKeyMock.mockResolvedValue({
    success: false,
    code: "APIKEY_QUOTA_EXCEEDS_LIMIT",
  });

  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "API キー生成" }).click();

  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("API キーの登録上限に達しています");
});

test("認証エラー時にメッセージを表示する", async ({ setup: _setup }) => {
  generateApiKeyMock.mockResolvedValue({
    success: false,
    code: "UNAUTHORIZED",
  });

  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "API キー生成" }).click();

  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("認証が切れています");
});
