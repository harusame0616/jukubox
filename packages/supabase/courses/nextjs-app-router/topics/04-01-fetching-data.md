---
title: "Server Components で記事を fetch する"
description: "固定配列をサーバー側のストアからの取得に置き換え、async コンポーネントでデータを読み込む。"
---

# Server Components で記事を fetch する

## 目標

- Server Component を `async` 関数として記述し、`await` でデータを取得できる
- in-memory のストアモジュールから記事一覧と単一記事を取得する関数を作る
- Cache Components が有効でも、`<Suspense>` を使えば非キャッシュデータを安全に表示できる

## 知識

App Router では **Server Component を `async` 関数として書ける** ため、コンポーネントの中で直接 `await` してデータを取得できます。`fetch()` の結果でも、ORM や DB クライアントの戻り値でも、サーバー側で実行される I/O ならそのまま使えます。

```tsx
export default async function Page() {
  const data = await fetch("https://api.example.com/posts");
  const posts = await data.json();
  return <ul>{/* ... */}</ul>;
}
```

`cacheComponents: true` を有効にしていると、`fetch` や DB クエリは **デフォルトでキャッシュされません**。そのため、これらを使うコンポーネントは `<Suspense>` で囲うか、`'use cache'` を付けて明示的にキャッシュ対象にする必要があります。今回はキャッシュは使わず、`<Suspense>` でくくることで「動的なまま流す」アプローチを取ります。`'use cache'` を使うキャッシュ化は次章で扱います。

データ取得関数は **コンポーネントの中に直接書かず、`lib/` などに切り出す** のが基本です。これは複数のコンポーネントから共有しやすく、テストも書きやすくなるためです。本コースでは外部 DB を使わず、サーバープロセスのメモリ上で動く簡易ストアを使います。

## タスク

### 1. in-memory ストアを作る

`app/posts/_data.ts` を以下のように書き換え、ストアと取得関数を分離します。配列を `let` で保持し、後の章で書き込みもできるようにします。

```ts
export type Post = {
  slug: string;
  title: string;
  body: string;
};

let posts: Post[] = [
  { slug: "hello", title: "Hello, Mini Blog", body: "最初の記事です。" },
  { slug: "next", title: "Next.js を学ぶ", body: "App Router の入門中。" },
];

export async function getPosts(): Promise<Post[]> {
  return posts;
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return posts.find((p) => p.slug === slug);
}

export async function addPost(input: Post): Promise<void> {
  posts = [input, ...posts];
}
```

### 2. 一覧ページを async に書き換える

`app/posts/page.tsx` を `async` 関数に変更し、`getPosts()` で取得したデータを描画します。データ取得部分を `<Suspense>` 配下のコンポーネントに切り出すのが望ましい構成です。

```tsx
import Link from "next/link";
import { Suspense } from "react";
import { getPosts } from "./_data";
import { LikeButton } from "./_components/like-button";

async function PostList() {
  const posts = await getPosts();
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          <LikeButton initialLikes={0} />
        </li>
      ))}
    </ul>
  );
}

export default function PostsPage() {
  return (
    <main>
      <h1>記事一覧</h1>
      <Suspense fallback={<p>読み込み中...</p>}>
        <PostList />
      </Suspense>
    </main>
  );
}
```

### 3. 詳細ページも async に書き換える

`app/posts/[slug]/page.tsx` で `getPost(slug)` を使うように修正します。

```tsx
import { getPost } from "../_data";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return <p>記事が見つかりません</p>;
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}
```

## 完了判定

- `app/posts/_data.ts` に `getPosts` / `getPost` / `addPost` がエクスポートされている
- `/posts` で一覧が表示され、開発ツールの Network タブを見ても余計な API コールが起きていない（サーバー側で完結している）
- `/posts/hello` の詳細ページが正しく表示される

## 補足

複数の独立したデータを取りたいときは、`Promise.all` でまとめて並列に await すると効率的です。逐次的に `await` を並べると、最初のリクエストが終わるまで次が始まらず遅くなります。`<Suspense>` で囲ったコンポーネントが投げるエラーは、後の章で導入する `error.tsx` で捕捉できるようになります。サーバー側の例外メッセージはターミナルにも出るので、開発時はターミナルの出力も合わせて確認すると原因特定が早まります。

## 理解度チェック

- App Router の Server Component の中で `await` を使えるのはなぜですか
- `cacheComponents: true` のとき、キャッシュしない `fetch` を使うコンポーネントはどう扱う必要がありますか
- 並列に複数のデータを取得したいときに使う JavaScript の API は何ですか
