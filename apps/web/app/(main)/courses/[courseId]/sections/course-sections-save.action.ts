"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { CourseSectionsSubmissionPayload } from "@/app/(main)/courses/new/_lib/course-form.schema";

export type SaveCourseSectionsErrorCode =
  | "SUBMIT_FAILED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "UNAUTHORIZED";

export type SaveCourseSectionsResult =
  | { success: true }
  | { success: false; code: SaveCourseSectionsErrorCode };

export async function saveCourseSections(
  courseId: string,
  input: CourseSectionsSubmissionPayload,
): Promise<SaveCourseSectionsResult> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent") ?? "";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, code: "UNAUTHORIZED" };
  }

  const response = await fetch(
    `${process.env.API_URL}/v1/courses/${courseId}/sections`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
        "User-Agent": userAgent,
      },
      body: JSON.stringify(input),
    },
  );

  if (response.status === 403) {
    return { success: false, code: "FORBIDDEN" };
  }
  if (response.status === 404) {
    return { success: false, code: "NOT_FOUND" };
  }
  if (!response.ok) {
    return { success: false, code: "SUBMIT_FAILED" };
  }
  return { success: true };
}
