"use client";

import type { ReactFormExtendedApi } from "@tanstack/react-form";
import { createContext, useContext } from "react";
import type { CourseBasicFormValues } from "@/app/(main)/courses/new/_lib/course-form.schema";

// 12 個の generic を持つ TanStack Form の戻り値型。子コンポーネントへ渡すための alias
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CourseBasicForm = ReactFormExtendedApi<CourseBasicFormValues, any, any, any, any, any, any, any, any, any, any, any>;

const CourseBasicFormContext = createContext<CourseBasicForm | null>(null);

export const CourseBasicFormProvider = CourseBasicFormContext.Provider;

export function useCourseBasicForm(): CourseBasicForm {
  const form = useContext(CourseBasicFormContext);
  if (!form) {
    throw new Error("CourseBasicFormProvider が未設定です");
  }
  return form;
}
