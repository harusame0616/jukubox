import postgres from "postgres";
import { v5 as uuidv5 } from "uuid";
import { categoryTree, type CategoryNode } from "./categories.ts";

const NAMESPACE = "a0a0a0a0-1111-4111-8111-000000000002";

interface FlatCategory {
  id: string;
  name: string;
  path: string;
}

function flatten(
  nodes: CategoryNode[],
  parentPath: string,
  out: FlatCategory[],
): void {
  for (const node of nodes) {
    const path = parentPath === "" ? node.slug : `${parentPath}.${node.slug}`;
    out.push({
      id: uuidv5(path, NAMESPACE),
      name: node.name,
      path,
    });
    if (node.children) {
      flatten(node.children, path, out);
    }
  }
}

export async function seedCategories(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl, { onnotice: () => {} });
  try {
    const flat: FlatCategory[] = [];
    flatten(categoryTree, "", flat);

    await sql.begin(async (tx) => {
      for (const category of flat) {
        await tx`
          INSERT INTO categories (category_id, name, path)
          VALUES (${category.id}, ${category.name}, ${category.path}::ltree)
          ON CONFLICT (path) DO UPDATE SET
            name = EXCLUDED.name
        `;
      }
    });

    console.log(`Seeded ${flat.length} categories`);
  } finally {
    await sql.end();
  }
}
