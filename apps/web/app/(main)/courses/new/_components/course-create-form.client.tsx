"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import type { JSX, ReactNode } from "react";
import { useState } from "react";
import { CourseTagList } from "@/components/course-tag-list.universal";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RequiredOptionalBadge } from "@/components/ui/required-optional-badge";
import { Textarea } from "@/components/ui/textarea";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import {
  type CourseBasicForm,
  CourseBasicFormProvider,
} from "@/app/(main)/courses/new/_components/course-basic-form-context";
import {
  courseBasicFormSchema,
  type CourseBasicFormValues,
  toCourseBasicSubmissionPayload,
} from "@/app/(main)/courses/new/_lib/course-form.schema";
import {
  createCourse,
  type CreateCourseErrorCode,
} from "@/app/(main)/courses/new/course-create.action";

const errorMessages: Record<CreateCourseErrorCode, string> = {
  SUBMIT_FAILED: "コースの作成に失敗しました。時間をおいて再度お試しください。",
  CONFLICT:
    "同じ Slug のコースが既に存在します。別の Slug を指定してください。",
  UNAUTHORIZED: "ログインが必要です。再度ログインしてください。",
};

const defaultValues: CourseBasicFormValues = {
  title: "",
  description: "",
  slug: "",
  tags: [],
  visibility: "public",
  categorySlug: "",
  categoryName: "",
};

export function CourseCreateForm({
  categorySelector,
}: {
  categorySelector: ReactNode;
}): JSX.Element {
  const router = useRouter();
  const isHydrated = useIsHydrated();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues,
    validators: {
      onBlur: courseBasicFormSchema,
      onSubmit: courseBasicFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const response = await createCourse(
          toCourseBasicSubmissionPayload(value),
        );
        if (response.success) {
          router.push(`/courses/${response.courseId}/sections`);
        } else {
          setSubmitError(errorMessages[response.code]);
        }
      } catch {
        setSubmitError(errorMessages.SUBMIT_FAILED);
      }
    },
  });

  return (
    <CourseBasicFormProvider value={form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="grid gap-10"
        noValidate
      >
        <section className="grid gap-6">
          <header className="grid gap-1">
            <h2 className="text-lg font-bold">基本情報</h2>
            <p className="text-muted-foreground text-sm">
              コース全体のメタ情報を入力します。下書きとして作成され、次の画面でセクション・トピックを入力します。
            </p>
          </header>

          <form.Field name="title">
            {(field) => {
              // フォーム全体スキーマで onBlur 検証するため、未 blur フィールドにもエラーが伝播する。
              // 触っていないフィールドを赤くしないよう isBlurred で表示判定をゲートする。
              const showError =
                field.state.meta.isBlurred && !field.state.meta.isValid;
              return (
                <Field data-invalid={showError}>
                  <FieldLabel htmlFor={field.name}>
                    コースタイトル
                    <RequiredOptionalBadge required />
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    aria-invalid={showError}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    disabled={!isHydrated}
                  />
                  <FieldDescription>120 文字以内</FieldDescription>
                  <FieldError
                    errors={showError ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="description">
            {(field) => {
              const showError =
                field.state.meta.isBlurred && !field.state.meta.isValid;
              return (
                <Field data-invalid={showError}>
                  <FieldLabel htmlFor={field.name}>
                    コース概要
                    <RequiredOptionalBadge required />
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    aria-invalid={showError}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className="h-32"
                    disabled={!isHydrated}
                  />
                  <FieldDescription>
                    対象者・学べる内容など。2000 文字以内
                  </FieldDescription>
                  <FieldError
                    errors={showError ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="slug">
            {(field) => {
              const showError =
                field.state.meta.isBlurred && !field.state.meta.isValid;
              return (
                <Field data-invalid={showError}>
                  <FieldLabel htmlFor={field.name}>
                    コース Slug
                    <RequiredOptionalBadge required />
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    aria-invalid={showError}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    disabled={!isHydrated}
                    className="md:max-w-md"
                  />
                  <FieldDescription>
                    URL に使われる識別子。半角英数字とハイフンのみ
                  </FieldDescription>
                  <FieldError
                    errors={showError ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          {categorySelector}

          <form.Field name="visibility">
            {(field) => {
              const showError =
                field.state.meta.isBlurred && !field.state.meta.isValid;
              return (
                <Field data-invalid={showError}>
                  <FieldLabel>
                    公開範囲
                    <RequiredOptionalBadge required />
                  </FieldLabel>
                  <RadioGroup
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(
                        value as CourseBasicFormValues["visibility"],
                      )
                    }
                    onBlur={field.handleBlur}
                    disabled={!isHydrated}
                    aria-invalid={showError}
                  >
                    {(
                      [
                        {
                          value: "public",
                          label: "公開",
                          description: "誰でも閲覧可",
                        },
                        {
                          value: "private",
                          label: "非公開",
                          description: "自分のみ",
                        },
                      ] as const
                    ).map((option) => {
                      const id = `${field.name}-${option.value}`;
                      return (
                        <Field key={option.value} orientation="horizontal">
                          <RadioGroupItem id={id} value={option.value} />
                          <FieldLabel htmlFor={id} className="font-normal">
                            {option.label}
                            <span className="text-muted-foreground text-xs">
                              （{option.description}）
                            </span>
                          </FieldLabel>
                        </Field>
                      );
                    })}
                  </RadioGroup>
                  <FieldError
                    errors={showError ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          <TagsField form={form} disabled={!isHydrated} />
        </section>

        {submitError && (
          <p role="alert" className="text-destructive text-sm">
            {submitError}
          </p>
        )}

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.isValid]}
        >
          {([isSubmitting, isValid]) => (
            <Button
              type="submit"
              disabled={!isHydrated || isSubmitting || !isValid}
              className="justify-self-end"
            >
              {isSubmitting ? "作成中..." : "コースを作成（下書きとして保存）"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </CourseBasicFormProvider>
  );
}

function TagsField({
  form,
  disabled,
}: {
  form: CourseBasicForm;
  disabled: boolean;
}): JSX.Element {
  const [draft, setDraft] = useState("");

  return (
    <form.Field name="tags" mode="array">
      {(tagsField) => {
        const tags = tagsField.state.value;
        const addTag = (): void => {
          const value = draft.trim();
          if (!value || tags.includes(value)) {
            setDraft("");
            return;
          }
          tagsField.pushValue(value);
          setDraft("");
        };
        // 配列フィールドは blur イベントを受けないため isTouched で判定する
        const showError =
          tagsField.state.meta.isTouched && !tagsField.state.meta.isValid;
        return (
          <Field data-invalid={showError}>
            <FieldLabel htmlFor="tags-input">
              タグ
              <RequiredOptionalBadge required={false} />
            </FieldLabel>
            <CourseTagList
              tags={tags}
              onRemove={(index) => tagsField.removeValue(index)}
              disabled={disabled}
            />
            <div className="flex gap-2">
              <Input
                id="tags-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={disabled}
              >
                追加
              </Button>
            </div>
            <FieldDescription>
              入力後 Enter または「追加」で追加。各 30 文字以内・最大 20 件
            </FieldDescription>
            <FieldError errors={showError ? tagsField.state.meta.errors : []} />
          </Field>
        );
      }}
    </form.Field>
  );
}
