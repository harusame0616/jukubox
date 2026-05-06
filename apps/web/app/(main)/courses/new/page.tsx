import type { Metadata } from "next";
import { Suspense, type JSX } from "react";
import { CategoryFieldsContainer } from "@/app/(main)/courses/new/_components/category-fields.container.server";
import { CategoryFieldsSkeleton } from "@/app/(main)/courses/new/_components/category-fields.skeleton.universal";
import { CourseCreateForm } from "@/app/(main)/courses/new/_components/course-create-form.client";
import PageLayout from "@/components/page-layout";

export const metadata: Metadata = {
  title: "コースを作る | JukuBox",
};

export default function NewCoursePage(): JSX.Element {
  return (
    <PageLayout title="コースを作る">
      <p className="mb-6 text-sm text-muted-foreground">
        コース基本情報を入力します。下書きとして保存され、続けてセクションとトピックを編集できます。
      </p>
      <CourseCreateForm
        categorySelector={
          <Suspense fallback={<CategoryFieldsSkeleton />}>
            <CategoryFieldsContainer />
          </Suspense>
        }
      />
    </PageLayout>
  );
}
