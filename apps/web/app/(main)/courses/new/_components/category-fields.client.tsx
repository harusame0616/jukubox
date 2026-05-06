"use client";

import type { JSX } from "react";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { RequiredOptionalBadge } from "@/components/ui/required-optional-badge";
import { Select } from "@/components/ui/select";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import {
  type CategoryNode,
  findCategory,
} from "@/app/(main)/courses/new/_lib/categories";
import { useCourseBasicForm } from "@/app/(main)/courses/new/_components/course-basic-form-context";

export function CategoryFields({
  categories,
}: {
  categories: CategoryNode[];
}): JSX.Element {
  const form = useCourseBasicForm();
  const disabled = !useIsHydrated();

  return (
    <form.Field name="categorySlug">
      {(field) => {
        const showError =
          field.state.meta.isBlurred && !field.state.meta.isValid;
        return (
          <Field data-invalid={showError}>
            <FieldLabel htmlFor={field.name}>
              カテゴリ
              <RequiredOptionalBadge required />
            </FieldLabel>
            <Select
              id={field.name}
              name={field.name}
              aria-invalid={showError}
              value={field.state.value}
              onChange={(event) => {
                const next = event.target.value;
                field.handleChange(next);
                form.setFieldValue(
                  "categoryName",
                  findCategory(categories, next)?.name ?? "",
                );
              }}
              onBlur={field.handleBlur}
              disabled={disabled}
              className="md:max-w-md"
            >
              <option value="">選択してください</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
            <FieldError errors={showError ? field.state.meta.errors : []} />
          </Field>
        );
      }}
    </form.Field>
  );
}
