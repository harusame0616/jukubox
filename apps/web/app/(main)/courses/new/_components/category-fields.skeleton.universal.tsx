import type { JSX } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { RequiredOptionalBadge } from "@/components/ui/required-optional-badge";

export function CategoryFieldsSkeleton(): JSX.Element {
  return (
    <Field>
      <FieldLabel>
        カテゴリ
        <RequiredOptionalBadge required />
      </FieldLabel>
      <select
        disabled
        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs disabled:opacity-50 md:max-w-md"
      >
        <option>読み込み中…</option>
      </select>
    </Field>
  );
}
