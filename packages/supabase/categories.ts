export interface CategoryNode {
  slug: string;
  name: string;
  children?: CategoryNode[];
}

export const categoryTree: CategoryNode[] = [
  { slug: "frontend", name: "Frontend" },
  { slug: "backend", name: "Backend" },
  { slug: "mobile", name: "Mobile" },
  { slug: "desktop", name: "Desktop" },
  { slug: "infrastructure", name: "Infrastructure" },
  { slug: "observability", name: "可観測性 / 監視" },
  { slug: "devops", name: "DevOps" },
  { slug: "data", name: "Data" },
  { slug: "ai", name: "AI" },
  { slug: "design", name: "Design" },
  { slug: "testing", name: "テスト" },
  { slug: "security", name: "セキュリティ" },
  { slug: "architecture", name: "アーキテクチャ" },
  { slug: "language", name: "プログラミング言語" },
  { slug: "tools", name: "開発ツール" },
  { slug: "game", name: "ゲーム開発" },
  { slug: "embedded", name: "組込み / IoT" },
  { slug: "career", name: "キャリア / 学習" },
];
