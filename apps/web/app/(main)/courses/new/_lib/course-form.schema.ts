import * as v from "valibot";

const slugPattern = /^[a-z0-9][a-z0-9-]*$/;

const slugSchema = v.pipe(
  v.string(),
  v.minLength(1, "Slug は必須です"),
  v.maxLength(80, "Slug は 80 文字以内で入力してください"),
  v.regex(
    slugPattern,
    "Slug は半角英数字とハイフンのみ使用できます（先頭は英数字）",
  ),
);

export const topicSchema = v.object({
  title: v.pipe(
    v.string(),
    v.minLength(1, "トピックタイトルは必須です"),
    v.maxLength(120, "トピックタイトルは 120 文字以内で入力してください"),
  ),
  description: v.pipe(
    v.string(),
    v.maxLength(500, "トピック概要は 500 文字以内で入力してください"),
  ),
  goal: v.pipe(
    v.string(),
    v.minLength(1, "目標は必須です"),
    v.maxLength(20_000, "目標は 20000 文字以内で入力してください"),
  ),
  knowledge: v.pipe(
    v.string(),
    v.minLength(1, "知識は必須です"),
    v.maxLength(20_000, "知識は 20000 文字以内で入力してください"),
  ),
  steps: v.pipe(
    v.string(),
    v.minLength(1, "ステップは必須です"),
    v.maxLength(20_000, "ステップは 20000 文字以内で入力してください"),
  ),
  completionCriteria: v.pipe(
    v.string(),
    v.minLength(1, "完了判定は必須です"),
    v.maxLength(20_000, "完了判定は 20000 文字以内で入力してください"),
  ),
  supplement: v.pipe(
    v.string(),
    v.maxLength(20_000, "補足は 20000 文字以内で入力してください"),
  ),
  comprehensionCheck: v.pipe(
    v.string(),
    v.maxLength(20_000, "理解度チェックは 20000 文字以内で入力してください"),
  ),
});

export const sectionSchema = v.object({
  title: v.pipe(
    v.string(),
    v.minLength(1, "セクションタイトルは必須です"),
    v.maxLength(120, "セクションタイトルは 120 文字以内で入力してください"),
  ),
  description: v.pipe(
    v.string(),
    v.maxLength(500, "セクション概要は 500 文字以内で入力してください"),
  ),
  topics: v.pipe(
    v.array(topicSchema),
    v.minLength(1, "トピックを 1 件以上追加してください"),
  ),
});

const tagsSchema = v.pipe(
  v.array(
    v.pipe(
      v.string(),
      v.minLength(1, "タグは 1 文字以上で入力してください"),
      v.maxLength(30, "タグは 30 文字以内で入力してください"),
    ),
  ),
  v.maxLength(20, "タグは 20 件まで設定できます"),
);

// ステップ 1: コース基本情報のみ
export const courseBasicFormSchema = v.object({
  title: v.pipe(
    v.string(),
    v.minLength(1, "コースタイトルは必須です"),
    v.maxLength(120, "コースタイトルは 120 文字以内で入力してください"),
  ),
  description: v.pipe(
    v.string(),
    v.minLength(1, "コース概要は必須です"),
    v.maxLength(2000, "コース概要は 2000 文字以内で入力してください"),
  ),
  slug: slugSchema,
  tags: tagsSchema,
  visibility: v.picklist(["public", "private"], "公開範囲を選択してください"),
  categorySlug: v.pipe(
    v.string(),
    v.minLength(1, "カテゴリを選択してください"),
  ),
  // CategoryFields が選択値から導出してフォームに書き込む
  categoryName: v.pipe(v.string(), v.minLength(1)),
});

export type CourseBasicFormValues = v.InferOutput<typeof courseBasicFormSchema>;

// ステップ 2: セクション・トピック
export const courseSectionsFormSchema = v.object({
  sections: v.pipe(
    v.array(sectionSchema),
    v.minLength(1, "セクションを 1 件以上追加してください"),
  ),
});

export type CourseSectionsFormValues = v.InferOutput<
  typeof courseSectionsFormSchema
>;

type TopicFormValue = CourseSectionsFormValues["sections"][number]["topics"][number];

export interface SubmissionTopic {
  title: string;
  description: string;
  body: string;
}

export interface SubmissionSection {
  title: string;
  description: string;
  topics: SubmissionTopic[];
}

// ステップ 1 送信ペイロード
export interface CourseBasicSubmissionPayload {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  visibility: "public" | "private";
  categoryName: string;
  categoryPath: string;
}

// API は ltree 互換の categoryPath を要求する。1 階層運用では slug がそのまま path になる。
function buildCategoryPath(categorySlug: string): string {
  return categorySlug;
}

// ステップ 2 送信ペイロード
export interface CourseSectionsSubmissionPayload {
  sections: SubmissionSection[];
}

export function buildTopicBody(topic: TopicFormValue): string {
  const sections: string[] = [
    `# ${topic.title}`,
    `## 目標\n${topic.goal}`,
    `## 知識\n${topic.knowledge}`,
    `## ステップ\n${topic.steps}`,
    `## 完了判定\n${topic.completionCriteria}`,
  ];
  if (topic.supplement !== "") {
    sections.push(`## 補足\n${topic.supplement}`);
  }
  if (topic.comprehensionCheck !== "") {
    sections.push(`## 理解度チェック\n${topic.comprehensionCheck}`);
  }
  return sections.join("\n\n");
}

export function toCourseBasicSubmissionPayload(
  values: CourseBasicFormValues,
): CourseBasicSubmissionPayload {
  return {
    title: values.title,
    description: values.description,
    slug: values.slug,
    tags: values.tags,
    visibility: values.visibility,
    categoryName: values.categoryName,
    categoryPath: buildCategoryPath(values.categorySlug),
  };
}

export function toCourseSectionsSubmissionPayload(
  values: CourseSectionsFormValues,
): CourseSectionsSubmissionPayload {
  return {
    sections: values.sections.map((section) => ({
      title: section.title,
      description: section.description,
      topics: section.topics.map((topic) => ({
        title: topic.title,
        description: topic.description,
        body: buildTopicBody(topic),
      })),
    })),
  };
}
