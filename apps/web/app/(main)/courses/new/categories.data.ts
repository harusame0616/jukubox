import type { CategoryNode } from "@/app/(main)/courses/new/_lib/categories";

interface ListCategoriesResponse {
  categories: CategoryNode[];
}

export async function fetchCategories(): Promise<CategoryNode[]> {
  const response = await fetch(`${process.env.API_URL}/v1/categories`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`カテゴリ取得に失敗しました (status=${response.status})`);
  }
  const body: ListCategoriesResponse = await response.json();
  return body.categories ?? [];
}
