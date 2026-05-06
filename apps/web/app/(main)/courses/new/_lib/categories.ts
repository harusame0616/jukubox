export interface CategoryNode {
  slug: string;
  name: string;
}

export function findCategory(
  categories: CategoryNode[],
  slug: string,
): CategoryNode | undefined {
  return categories.find((category) => category.slug === slug);
}
