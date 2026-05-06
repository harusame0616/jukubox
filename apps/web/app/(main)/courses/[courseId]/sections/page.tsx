import type { Metadata } from "next";
import type { JSX } from "react";
import { Suspense } from "react";
import { CourseSectionsEditContainer } from "@/app/(main)/courses/[courseId]/sections/course-sections-edit.container.server";
import PageLayout from "@/components/page-layout";

export const metadata: Metadata = {
  title: "セクション・トピックを編集 | JukuBox",
};

export default function CourseSectionsPage({
  params,
}: PageProps<"/courses/[courseId]/sections">): JSX.Element {
  return (
    <PageLayout title="セクション・トピックを編集">
      <p className="mb-6 text-sm text-muted-foreground">
        コースを構成するセクションとトピックを入力します。
      </p>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">読み込み中…</p>}
      >
        <CourseSectionsEditContainer courseId={params.then((p) => p.courseId)} />
      </Suspense>
    </PageLayout>
  );
}
