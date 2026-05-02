---
title: "Layout と Page で記事一覧と記事詳細を作る"
description: "/posts と /posts/[slug] を実装し、共通ヘッダーをルートレイアウトに置く。"
---

# Layout と Page で記事一覧と記事詳細を作る

## 目標

- `/posts` で固定配列から記事一覧を表示する
- `/posts/[slug]` で動的セグメントから個別記事を表示する
- ルートレイアウトに共通ヘッダーを置く

## 知識

App Router では、フォルダがそのまま URL セグメントになり、`page.tsx` がそのセグメントの公開 UI を定義します。フォルダを入れ子にすれば URL も入れ子になり、`[slug]` のように角括弧で囲むと **動的セグメント** になります。動的セグメントの値は、ページコンポーネントに渡される `params` プロップから取り出せます。`params` は **Promise** で渡されるため、`await` してから利用する点に注意してください。

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ...
}
```

レイアウトはページに **共有 UI** を提供します。ルートレイアウト（`app/layout.tsx`）はアプリ全体を包み、`<html>` と `<body>` を持つことが必須です。レイアウトは `children` プロップを通じて配下のページや子レイアウトを差し込み、ナビゲーション中も再マウントされません。

サーバーコンポーネントなので、ページやレイアウトの中で直接 JavaScript の配列や同期的な計算を使うこともできます。ミニブログでは、まずデータベースを使わず、TypeScript の配列リテラルで記事データを管理してスタートします。

## タスク

### 1. ダミーデータを用意する

`app/posts/_data.ts` を作成し、記事データの配列を定義します。アンダースコアで始まるフォルダ・ファイルはルーティング対象外なので、データ置き場として安全です。

```ts
export type Post = {
  slug: string;
  title: string;
  body: string;
};

export const posts: Post[] = [
  { slug: "hello", title: "Hello, Mini Blog", body: "最初の記事です。" },
  { slug: "next", title: "Next.js を学ぶ", body: "App Router の入門中。" },
];
```

### 2. 一覧ページを作る

`app/posts/page.tsx` を作成し、上記 `posts` を一覧表示します。

```tsx
import { posts } from "./_data";

export default function PostsPage() {
  return (
    <main>
      <h1>記事一覧</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>{post.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

`http://localhost:3000/posts` にアクセスし、2 件の記事タイトルが見えることを確認してください。

### 3. 動的ルートで記事詳細を作る

`app/posts/[slug]/page.tsx` を作成し、`params` から `slug` を受け取って該当記事を表示します。

```tsx
import { posts } from "../_data";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    return <p>記事が見つかりません</p>;
  }
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}
```

`http://localhost:3000/posts/hello` で本文が見えれば成功です。

### 4. ルートレイアウトに共通ヘッダーを置く

`app/layout.tsx` の `<body>` 内に、サイト名を出すヘッダーを追加してください。次のトピックで `<Link>` を入れる前提の土台です。

```tsx
<body>
  <header>
    <strong>Mini Blog</strong>
  </header>
  {children}
</body>
```

## 完了判定

- `/posts` でタイトルの一覧が表示される
- `/posts/hello` と `/posts/next` の両方で記事本文が表示される
- 全ページの上部に「Mini Blog」というヘッダーが表示される

## 補足

`params` を `await` し忘れると、TypeScript エラーや実行時の警告が出ます。Next.js 15 以降の `params` / `searchParams` は Promise 型で、これは Server Components が並列レンダリングを最適化するための変更です。動的セグメントのフォルダ名は実際の URL に展開されたあとも `[slug]` のままファイルシステム上に残ります。混乱しないよう、フォルダ名と URL の対応をエディタのタブ名で意識してください。

## 理解度チェック

- 動的セグメントを定義するためのフォルダ名の書き方は何ですか
- ページコンポーネントで `params` を取り出すときに必要な操作は何ですか
- ルートレイアウトの `<body>` に書いた要素はどのページで表示されますか
