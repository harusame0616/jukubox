import { expect, test as base, vi } from "vitest";
import { render } from "vitest-browser-react";
import type {
  CreateCourseResult,
} from "@/app/(main)/courses/new/course-create.action";
import type { CourseBasicSubmissionPayload } from "@/app/(main)/courses/new/_lib/course-form.schema";
import type { CategoryNode } from "@/app/(main)/courses/new/_lib/categories";
import { CategoryFields } from "@/app/(main)/courses/new/_components/category-fields.client";
import { CourseCreateForm } from "@/app/(main)/courses/new/_components/course-create-form.client";

const createCourseMock =
  vi.fn<(input: CourseBasicSubmissionPayload) => Promise<CreateCourseResult>>();

const pushMock = vi.fn<(path: string) => void>();

vi.mock("@/app/(main)/courses/new/course-create.action", () => ({
  createCourse: (input: CourseBasicSubmissionPayload) =>
    createCourseMock(input),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const test = base.extend({
  createCourse: [
    async ({}, provide: (v: typeof createCourseMock) => Promise<void>) => {
      createCourseMock.mockReset();
      pushMock.mockReset();
      await provide(createCourseMock);
    },
    { auto: true },
  ],
});

const sampleCategories: CategoryNode[] = [
  { slug: "frontend", name: "Frontend" },
  { slug: "backend", name: "Backend" },
  { slug: "ai", name: "AI" },
];

async function fillBasicFields(
  screen: Awaited<ReturnType<typeof render>>,
): Promise<void> {
  await screen.getByLabelText(/コースタイトル/).fill("Next.js 入門");
  await screen
    .getByLabelText(/コース概要/)
    .fill("Next.js を学ぶコースです。");
  await screen.getByLabelText(/コース Slug/).fill("nextjs-basics");
  await screen.getByLabelText(/カテゴリ/).selectOptions("frontend");
  await screen.getByLabelText(/コースタイトル/).click();
}

test("送信成功時にセクション編集画面へ遷移し、入力値で action が呼ばれる", async () => {
  createCourseMock.mockResolvedValue({
    success: true,
    courseId: "course-uuid-1",
    authorSlug: "author-1",
    courseSlug: "nextjs-basics",
  });
  const screen = await render(
    <CourseCreateForm
      categorySelector={<CategoryFields categories={sampleCategories} />}
    />,
  );

  await fillBasicFields(screen);
  await screen
    .getByRole("button", { name: /コースを作成/ })
    .click();

  await expect.poll(() => createCourseMock).toHaveBeenCalledTimes(1);
  const payload = createCourseMock.mock.calls[0]![0]!;
  expect(payload.title).toBe("Next.js 入門");
  expect(payload.slug).toBe("nextjs-basics");
  expect(payload.categoryPath).toBe("frontend");
  expect(payload.categoryName).toBe("Frontend");

  await expect
    .poll(() => pushMock.mock.calls[0]?.[0])
    .toBe("/courses/course-uuid-1/sections");
});

test("不正な slug を入力して blur すると形式エラーが表示される", async () => {
  const screen = await render(
    <CourseCreateForm
      categorySelector={<CategoryFields categories={sampleCategories} />}
    />,
  );

  await screen.getByLabelText(/コース Slug/).fill("Invalid Slug");
  await screen.getByLabelText(/コースタイトル/).click();

  await expect
    .element(
      screen.getByText(
        "Slug は半角英数字とハイフンのみ使用できます（先頭は英数字）",
        { exact: true },
      ),
    )
    .toBeInTheDocument();
});

test("タグを入力して追加できる", async () => {
  createCourseMock.mockResolvedValue({
    success: true,
    courseId: "course-uuid-2",
    authorSlug: "author-1",
    courseSlug: "nextjs-basics",
  });
  const screen = await render(
    <CourseCreateForm
      categorySelector={<CategoryFields categories={sampleCategories} />}
    />,
  );

  await screen.getByLabelText(/^タグ/).fill("nextjs");
  await screen.getByRole("button", { name: "追加", exact: true }).click();

  await expect
    .element(screen.getByRole("button", { name: "nextjs を削除" }))
    .toBeInTheDocument();

  await fillBasicFields(screen);
  await screen
    .getByRole("button", { name: /コースを作成/ })
    .click();

  await expect.poll(() => createCourseMock).toHaveBeenCalledTimes(1);
  const payload = createCourseMock.mock.calls[0]![0]!;
  expect(payload.tags).toEqual(["nextjs"]);
});

test("CONFLICT が返った場合は専用の失敗メッセージが表示される", async () => {
  createCourseMock.mockResolvedValue({ success: false, code: "CONFLICT" });
  const screen = await render(
    <CourseCreateForm
      categorySelector={<CategoryFields categories={sampleCategories} />}
    />,
  );

  await fillBasicFields(screen);
  await screen
    .getByRole("button", { name: /コースを作成/ })
    .click();

  await expect
    .element(
      screen.getByText(
        "同じ Slug のコースが既に存在します。別の Slug を指定してください。",
      ),
    )
    .toBeInTheDocument();
});

test("title を入力後 blur しても他フィールドはエラー表示されない", async () => {
  const screen = await render(
    <CourseCreateForm
      categorySelector={<CategoryFields categories={sampleCategories} />}
    />,
  );

  await screen.getByLabelText(/コースタイトル/).fill("Next.js 入門");
  await screen.getByLabelText(/コース概要/).click();

  await expect
    .element(screen.getByText("コース概要は必須です"))
    .not.toBeInTheDocument();
  await expect
    .element(screen.getByText("Slug は必須です"))
    .not.toBeInTheDocument();
});

test("バリデーションエラーがある状態で送信ボタンを押しても action は呼ばれない", async () => {
  const screen = await render(
    <CourseCreateForm
      categorySelector={<CategoryFields categories={sampleCategories} />}
    />,
  );

  await screen
    .getByRole("button", { name: /コースを作成/ })
    .click({ force: true });

  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(createCourseMock).not.toHaveBeenCalled();
});
