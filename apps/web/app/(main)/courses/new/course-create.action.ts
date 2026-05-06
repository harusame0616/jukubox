"use server";

import type { CourseBasicSubmissionPayload } from "@/app/(main)/courses/new/_lib/course-form.schema";
import { createClient } from "@/lib/supabase/server";

export type CreateCourseErrorCode =
  | "SUBMIT_FAILED"
  | "CONFLICT"
  | "UNAUTHORIZED";

export type CreateCourseResult =
  | { success: true; courseId: string; authorSlug: string; courseSlug: string }
  | { success: false; code: CreateCourseErrorCode };

export async function createCourse(
  input: CourseBasicSubmissionPayload,
): Promise<CreateCourseResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, code: "UNAUTHORIZED" };
  }

  const response = await fetch(`${process.env.API_URL}/v1/courses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 409) {
    return { success: false, code: "CONFLICT" };
  }

  if (!response.ok) {
    return { success: false, code: "SUBMIT_FAILED" };
  }

  const data = (await response.json()) as {
    courseId: string;
    authorSlug: string;
    courseSlug: string;
  };
  return {
    success: true,
    courseId: data.courseId,
    authorSlug: data.authorSlug,
    courseSlug: data.courseSlug,
  };
}
