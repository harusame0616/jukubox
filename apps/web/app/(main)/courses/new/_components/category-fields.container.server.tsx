import type { JSX } from "react";
import { CategoryFields } from "@/app/(main)/courses/new/_components/category-fields.client";
import { fetchCategories } from "@/app/(main)/courses/new/categories.data";

export async function CategoryFieldsContainer(): Promise<JSX.Element> {
  const categories = await fetchCategories();
  return <CategoryFields categories={categories} />;
}
