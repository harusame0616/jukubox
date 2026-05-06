"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactFormExtendedApi } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RequiredOptionalBadge } from "@/components/ui/required-optional-badge";
import { Textarea } from "@/components/ui/textarea";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import {
  courseSectionsFormSchema,
  type CourseSectionsFormValues,
  toCourseSectionsSubmissionPayload,
} from "@/app/(main)/courses/new/_lib/course-form.schema";
import {
  saveCourseSections,
  type SaveCourseSectionsErrorCode,
} from "@/app/(main)/courses/[courseId]/sections/course-sections-save.action";

const errorMessages: Record<SaveCourseSectionsErrorCode, string> = {
  SUBMIT_FAILED: "保存に失敗しました。時間をおいて再度お試しください。",
  FORBIDDEN: "このコースを編集する権限がありません。",
  NOT_FOUND: "コースが見つかりませんでした。",
  UNAUTHORIZED: "ログインが必要です。",
};

const defaultTopic = {
  title: "",
  description: "",
  goal: "",
  knowledge: "",
  steps: "",
  completionCriteria: "",
  supplement: "",
  comprehensionCheck: "",
};

const defaultSection = {
  title: "",
  description: "",
  topics: [defaultTopic],
};

const defaultValues: CourseSectionsFormValues = {
  sections: [defaultSection],
};

export function CourseSectionsForm({
  courseId,
}: {
  courseId: string;
}): JSX.Element {
  const router = useRouter();
  const isHydrated = useIsHydrated();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues,
    validators: {
      onBlur: courseSectionsFormSchema,
      onSubmit: courseSectionsFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const response = await saveCourseSections(
          courseId,
          toCourseSectionsSubmissionPayload(value),
        );
        if (response.success) {
          router.push("/courses");
        } else {
          setSubmitError(errorMessages[response.code]);
        }
      } catch {
        setSubmitError(errorMessages.SUBMIT_FAILED);
      }
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="grid gap-10"
      noValidate
    >
      <section className="grid gap-4">
        <header className="grid gap-1">
          <h2 className="text-lg font-bold">セクションとトピック</h2>
          <p className="text-sm text-muted-foreground">
            コースを構成するセクションを追加し、各セクションにトピックを並べます。
          </p>
        </header>

        <form.Field name="sections" mode="array">
          {(sectionsField) => (
            <div className="grid gap-4">
              {sectionsField.state.value.map((_, sectionIndex) => (
                <SectionCard
                  key={sectionIndex}
                  form={form}
                  sectionIndex={sectionIndex}
                  isFirst={sectionIndex === 0}
                  isLast={sectionIndex === sectionsField.state.value.length - 1}
                  isOnly={sectionsField.state.value.length === 1}
                  disabled={!isHydrated}
                  onMoveUp={() =>
                    sectionsField.swapValues(sectionIndex, sectionIndex - 1)
                  }
                  onMoveDown={() =>
                    sectionsField.swapValues(sectionIndex, sectionIndex + 1)
                  }
                  onRemove={() => sectionsField.removeValue(sectionIndex)}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                disabled={!isHydrated}
                onClick={() => sectionsField.pushValue(defaultSection)}
                className="justify-self-start"
              >
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                セクションを追加
              </Button>
              <FieldError
                errors={
                  sectionsField.state.meta.isTouched
                    ? sectionsField.state.meta.errors
                    : []
                }
              />
            </div>
          )}
        </form.Field>
      </section>

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <form.Subscribe selector={(state) => [state.isSubmitting, state.isValid]}>
        {([isSubmitting, isValid]) => (
          <Button
            type="submit"
            disabled={!isHydrated || isSubmitting || !isValid}
            className="justify-self-end"
          >
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

// 12 個の generic を持つ TanStack Form の戻り値型。子コンポーネントへ渡すための alias
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = ReactFormExtendedApi<CourseSectionsFormValues, any, any, any, any, any, any, any, any, any, any, any>;

function SectionCard({
  form,
  sectionIndex,
  isFirst,
  isLast,
  isOnly,
  disabled,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  form: Form;
  sectionIndex: number;
  isFirst: boolean;
  isLast: boolean;
  isOnly: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(true);

  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <HugeiconsIcon
            icon={open ? ArrowUp01Icon : ArrowDown01Icon}
            className="size-4 text-muted-foreground"
          />
          <form.Subscribe
            selector={(state) => state.values.sections[sectionIndex]}
          >
            {(section) => (
              <span className="flex items-baseline gap-3">
                <span className="font-bold">
                  セクション{sectionIndex + 1}
                  {section?.title ? `: ${section.title}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  トピック {section?.topics.length ?? 0} 件
                </span>
              </span>
            )}
          </form.Subscribe>
        </button>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isFirst}
            onClick={onMoveUp}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
            <span className="sr-only">セクションを上に移動</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isLast}
            onClick={onMoveDown}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
            <span className="sr-only">セクションを下に移動</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isOnly}
            onClick={onRemove}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            <span className="sr-only">セクションを削除</span>
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-6">
          <form.Field name={`sections[${sectionIndex}].title`}>
            {(field) => {
              const showError =
                field.state.meta.isBlurred && !field.state.meta.isValid;
              return (
                <Field data-invalid={showError}>
                  <FieldLabel htmlFor={field.name}>
                    セクションタイトル
                    <RequiredOptionalBadge required />
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    aria-invalid={showError}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    disabled={disabled}
                  />
                  <FieldError
                    errors={showError ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name={`sections[${sectionIndex}].description`}>
            {(field) => {
              const showError =
                field.state.meta.isBlurred && !field.state.meta.isValid;
              return (
                <Field data-invalid={showError}>
                  <FieldLabel htmlFor={field.name}>
                    セクション概要
                    <RequiredOptionalBadge required={false} />
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    aria-invalid={showError}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className="h-20"
                    disabled={disabled}
                  />
                  <FieldError
                    errors={showError ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          <form.Field
            name={`sections[${sectionIndex}].topics`}
            mode="array"
          >
            {(topicsField) => (
              <div className="grid gap-3">
                <h3 className="text-sm font-bold">トピック</h3>
                {topicsField.state.value.map((_, topicIndex) => (
                  <TopicCard
                    key={topicIndex}
                    form={form}
                    sectionIndex={sectionIndex}
                    topicIndex={topicIndex}
                    isFirst={topicIndex === 0}
                    isLast={
                      topicIndex === topicsField.state.value.length - 1
                    }
                    isOnly={topicsField.state.value.length === 1}
                    disabled={disabled}
                    onMoveUp={() =>
                      topicsField.swapValues(topicIndex, topicIndex - 1)
                    }
                    onMoveDown={() =>
                      topicsField.swapValues(topicIndex, topicIndex + 1)
                    }
                    onRemove={() => topicsField.removeValue(topicIndex)}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => topicsField.pushValue(defaultTopic)}
                  className="justify-self-start"
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-4" />
                  トピックを追加
                </Button>
                <FieldError
                  errors={
                    topicsField.state.meta.isTouched
                      ? topicsField.state.meta.errors
                      : []
                  }
                />
              </div>
            )}
          </form.Field>
        </div>
      )}
    </article>
  );
}

function TopicCard({
  form,
  sectionIndex,
  topicIndex,
  isFirst,
  isLast,
  isOnly,
  disabled,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  form: Form;
  sectionIndex: number;
  topicIndex: number;
  isFirst: boolean;
  isLast: boolean;
  isOnly: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(true);
  const basePath = `sections[${sectionIndex}].topics[${topicIndex}]` as const;

  return (
    <div className="rounded-md border border-dashed bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <HugeiconsIcon
            icon={open ? ArrowUp01Icon : ArrowDown01Icon}
            className="size-4 text-muted-foreground"
          />
          <form.Subscribe
            selector={(state) =>
              state.values.sections[sectionIndex]?.topics[topicIndex]
            }
          >
            {(topic) => (
              <span className="flex items-baseline gap-2 text-sm">
                <span className="font-medium">
                  トピック{topicIndex + 1}
                  {topic?.title ? `: ${topic.title}` : ""}
                </span>
              </span>
            )}
          </form.Subscribe>
        </button>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isFirst}
            onClick={onMoveUp}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
            <span className="sr-only">トピックを上に移動</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isLast}
            onClick={onMoveDown}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
            <span className="sr-only">トピックを下に移動</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isOnly}
            onClick={onRemove}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            <span className="sr-only">トピックを削除</span>
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-3 grid gap-4">
          <form.Field name={`${basePath}.title`}>
            {(field) => {
              const showError =
                field.state.meta.isBlurred && !field.state.meta.isValid;
              return (
                <Field data-invalid={showError}>
                  <FieldLabel htmlFor={field.name}>
                    タイトル
                    <RequiredOptionalBadge required />
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    aria-invalid={showError}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    disabled={disabled}
                  />
                  <FieldError
                    errors={showError ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name={`${basePath}.description`}>
            {(field) => {
              const showError =
                field.state.meta.isBlurred && !field.state.meta.isValid;
              return (
                <Field data-invalid={showError}>
                  <FieldLabel htmlFor={field.name}>
                    トピック概要
                    <RequiredOptionalBadge required={false} />
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    aria-invalid={showError}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className="h-20"
                    disabled={disabled}
                  />
                  <FieldError
                    errors={showError ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          <TopicMarkdownField
            form={form}
            name={`${basePath}.goal`}
            label="目標"
            description="このトピックを終えたとき学習者が到達している状態を記述します"
            required
            disabled={disabled}
          />

          <TopicMarkdownField
            form={form}
            name={`${basePath}.knowledge`}
            label="知識"
            description="ステップで実践する内容を理解するための前提知識を記述します"
            required
            disabled={disabled}
          />

          <TopicMarkdownField
            form={form}
            name={`${basePath}.steps`}
            label="ステップ"
            description="`###` 見出しで各ステップを区切って記述します"
            required
            disabled={disabled}
          />

          <TopicMarkdownField
            form={form}
            name={`${basePath}.completionCriteria`}
            label="完了判定"
            description="トピック完了の判定基準を記述します"
            required
            disabled={disabled}
          />

          <TopicMarkdownField
            form={form}
            name={`${basePath}.supplement`}
            label="補足"
            description="つまずきやすいポイントや発展的な情報を記述します"
            required={false}
            disabled={disabled}
          />

          <TopicMarkdownField
            form={form}
            name={`${basePath}.comprehensionCheck`}
            label="理解度チェック"
            description="知識の定着を確認する設問を記述します"
            required={false}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

function TopicMarkdownField({
  form,
  name,
  label,
  description,
  required,
  disabled,
}: {
  form: Form;
  name: `sections[${number}].topics[${number}].${
    | "goal"
    | "knowledge"
    | "steps"
    | "completionCriteria"
    | "supplement"
    | "comprehensionCheck"}`;
  label: string;
  description: string;
  required: boolean;
  disabled: boolean;
}): JSX.Element {
  return (
    <form.Field name={name}>
      {(field) => {
        const showError =
          field.state.meta.isBlurred && !field.state.meta.isValid;
        const value =
          typeof field.state.value === "string" ? field.state.value : "";
        return (
          <Field data-invalid={showError}>
            <FieldLabel htmlFor={field.name}>
              {label}
              <RequiredOptionalBadge required={required} />
            </FieldLabel>
            <Textarea
              id={field.name}
              name={field.name}
              aria-invalid={showError}
              value={value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="h-40 font-mono text-sm"
              disabled={disabled}
            />
            <FieldDescription>{description}</FieldDescription>
            <FieldError errors={showError ? field.state.meta.errors : []} />
          </Field>
        );
      }}
    </form.Field>
  );
}
