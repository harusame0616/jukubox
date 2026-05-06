import { expect, test } from "vitest";
import * as v from "valibot";
import {
  buildTopicBody,
  courseBasicFormSchema,
  courseSectionsFormSchema,
  toCourseBasicSubmissionPayload,
  toCourseSectionsSubmissionPayload,
} from "@/app/(main)/courses/new/_lib/course-form.schema";

function buildValidBasic() {
  return {
    title: "Next.js 入門",
    description: "Next.js を学ぶコースです。",
    slug: "nextjs-basics",
    tags: ["nextjs", "react"],
    visibility: "public" as const,
    categorySlug: "frontend",
    categoryName: "Frontend",
  };
}

function buildValidSections() {
  return {
    sections: [
      {
        title: "はじめに",
        description: "セットアップ",
        topics: [
          {
            title: "インストール",
            description: "",
            goal: "Next.js を起動できる",
            knowledge: "Node.js が必要",
            steps: "### 1. インストール\nnpm install",
            completionCriteria: "npm run dev が成功する",
            supplement: "",
            comprehensionCheck: "",
          },
        ],
      },
    ],
  };
}

test("ステップ 1: 有効な値はそのままパースされる", () => {
  const result = v.safeParse(courseBasicFormSchema, buildValidBasic());
  expect(result.success).toBe(true);
});

test("ステップ 1: slug に大文字が含まれるとエラー", () => {
  const result = v.safeParse(courseBasicFormSchema, {
    ...buildValidBasic(),
    slug: "Nextjs-Basics",
  });
  expect(result.success).toBe(false);
});

test("ステップ 1: カテゴリが未選択だとエラー", () => {
  const result = v.safeParse(courseBasicFormSchema, {
    ...buildValidBasic(),
    categorySlug: "",
  });
  expect(result.success).toBe(false);
});

test("ステップ 2: 有効な値はそのままパースされる", () => {
  const result = v.safeParse(courseSectionsFormSchema, buildValidSections());
  expect(result.success).toBe(true);
});

test("ステップ 2: セクションが 0 件だとエラー", () => {
  const result = v.safeParse(courseSectionsFormSchema, { sections: [] });
  expect(result.success).toBe(false);
});

test("toCourseBasicSubmissionPayload は categoryPath に slug をそのまま流す", () => {
  const payload = toCourseBasicSubmissionPayload(buildValidBasic());
  expect(payload.categoryPath).toBe("frontend");
  expect(payload.categoryName).toBe("Frontend");
});

test("buildTopicBody は必須セクションのみのとき任意セクションを含めない", () => {
  const body = buildTopicBody({
    title: "インストール",
    description: "",
    goal: "Next.js を起動できる",
    knowledge: "Node.js が必要",
    steps: "### 1. インストール\nnpm install",
    completionCriteria: "npm run dev が成功する",
    supplement: "",
    comprehensionCheck: "",
  });

  expect(body).toBe(
    [
      "# インストール",
      "## 目標\nNext.js を起動できる",
      "## 知識\nNode.js が必要",
      "## ステップ\n### 1. インストール\nnpm install",
      "## 完了判定\nnpm run dev が成功する",
    ].join("\n\n"),
  );
});

test("buildTopicBody は任意セクションが入力されているとき末尾に追加する", () => {
  const body = buildTopicBody({
    title: "インストール",
    description: "",
    goal: "Next.js を起動できる",
    knowledge: "Node.js が必要",
    steps: "### 1. インストール\nnpm install",
    completionCriteria: "npm run dev が成功する",
    supplement: "Windows ではパスに注意",
    comprehensionCheck: "Q. Next.js とは？",
  });

  expect(body).toBe(
    [
      "# インストール",
      "## 目標\nNext.js を起動できる",
      "## 知識\nNode.js が必要",
      "## ステップ\n### 1. インストール\nnpm install",
      "## 完了判定\nnpm run dev が成功する",
      "## 補足\nWindows ではパスに注意",
      "## 理解度チェック\nQ. Next.js とは？",
    ].join("\n\n"),
  );
});

test("toCourseSectionsSubmissionPayload は topics[].body を Markdown に組み立てる", () => {
  const payload = toCourseSectionsSubmissionPayload(buildValidSections());
  expect(payload.sections[0]!.topics[0]!.body).toContain("# インストール");
  expect(payload.sections[0]!.topics[0]!.body).toContain(
    "## 目標\nNext.js を起動できる",
  );
});
