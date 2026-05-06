import type { JSX } from "react";
import { CourseSectionsForm } from "@/app/(main)/courses/[courseId]/sections/_components/course-sections-form.client";

export async function CourseSectionsEditContainer({
  courseId,
}: {
  courseId: Promise<string>;
}): Promise<JSX.Element> {
  const id = await courseId;
  return <CourseSectionsForm courseId={id} />;
}
