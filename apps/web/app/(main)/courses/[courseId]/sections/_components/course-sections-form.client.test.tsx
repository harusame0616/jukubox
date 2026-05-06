import { expect, test as base, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { CourseSectionsSubmissionPayload } from "@/app/(main)/courses/new/_lib/course-form.schema";
import type { SaveCourseSectionsResult } from "@/app/(main)/courses/[courseId]/sections/course-sections-save.action";
import { CourseSectionsForm } from "@/app/(main)/courses/[courseId]/sections/_components/course-sections-form.client";

const saveMock =
  vi.fn<
    (
      courseId: string,
      input: CourseSectionsSubmissionPayload,
    ) => Promise<SaveCourseSectionsResult>
  >();

const pushMock = vi.fn<(path: string) => void>();

vi.mock(
  "@/app/(main)/courses/[courseId]/sections/course-sections-save.action",
  () => ({
    saveCourseSections: (
      courseId: string,
      input: CourseSectionsSubmissionPayload,
    ) => saveMock(courseId, input),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const test = base.extend({
  save: [
    async ({}, provide: (v: typeof saveMock) => Promise<void>) => {
      saveMock.mockReset();
      pushMock.mockReset();
      await provide(saveMock);
    },
    { auto: true },
  ],
});

async function fillFirstTopic(
  screen: Awaited<ReturnType<typeof render>>,
): Promise<void> {
  await screen.getByLabelText(/セクションタイトル/).fill("はじめに");
  await screen.getByLabelText(/^タイトル/).fill("インストール");
  await screen.getByLabelText(/^目標/).fill("Next.js を起動できる");
  await screen.getByLabelText(/^知識/).fill("Node.js が必要");
  await screen
    .getByLabelText(/^ステップ/)
    .fill("### 1. インストール\nnpm install");
  await screen.getByLabelText(/^完了判定/).fill("npm run dev が成功する");
  await screen.getByLabelText(/セクションタイトル/).click();
}

test("送信成功時にコース一覧へ遷移し、入力値で action が呼ばれる", async () => {
  saveMock.mockResolvedValue({ success: true });
  const screen = await render(
    <CourseSectionsForm courseId="course-1" />,
  );

  await fillFirstTopic(screen);
  await screen.getByRole("button", { name: "保存", exact: true }).click();

  await expect.poll(() => saveMock).toHaveBeenCalledTimes(1);
  const [calledCourseId, payload] = saveMock.mock.calls[0]!;
  expect(calledCourseId).toBe("course-1");
  expect(payload.sections).toHaveLength(1);
  expect(payload.sections[0]!.title).toBe("はじめに");
  expect(payload.sections[0]!.topics).toHaveLength(1);
  expect(payload.sections[0]!.topics[0]!.title).toBe("インストール");
  expect(payload.sections[0]!.topics[0]!.body).toContain("# インストール");
  expect(payload.sections[0]!.topics[0]!.body).toContain(
    "## 目標\nNext.js を起動できる",
  );

  await expect.poll(() => pushMock.mock.calls[0]?.[0]).toBe("/courses");
});

test("セクションを追加するとセクション数が増える", async () => {
  const screen = await render(
    <CourseSectionsForm courseId="course-1" />,
  );

  await expect
    .element(screen.getByText(/セクション1/))
    .toBeInTheDocument();

  await screen.getByRole("button", { name: /セクションを追加/ }).click();

  await expect
    .element(screen.getByText(/セクション2/))
    .toBeInTheDocument();
});

test("必須項目未入力で送信ボタンを押しても action は呼ばれない", async () => {
  const screen = await render(
    <CourseSectionsForm courseId="course-1" />,
  );

  await screen
    .getByRole("button", { name: "保存", exact: true })
    .click({ force: true });

  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(saveMock).not.toHaveBeenCalled();
});

test("FORBIDDEN が返ると権限エラーメッセージが表示される", async () => {
  saveMock.mockResolvedValue({ success: false, code: "FORBIDDEN" });
  const screen = await render(
    <CourseSectionsForm courseId="course-1" />,
  );

  await fillFirstTopic(screen);
  await screen.getByRole("button", { name: "保存", exact: true }).click();

  await expect
    .element(screen.getByText("このコースを編集する権限がありません。"))
    .toBeInTheDocument();
});
