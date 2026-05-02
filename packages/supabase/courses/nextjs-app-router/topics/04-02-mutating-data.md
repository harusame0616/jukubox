---
title: "Server Action で新規記事を投稿する"
description: "use server を使ったサーバー関数を form の action に渡し、ミニブログに投稿フォームを追加する。"
---

# Server Action で新規記事を投稿する

## 目標

- `'use server'` ディレクティブで Server Action を定義する
- `<form action={createPost}>` の形でフォームと Server Action を結びつける
- フォーム送信後、再表示される一覧に新規記事が含まれる

## 知識

データの書き込み（**ミューテーション**）は、Next.js の **Server Action** を使うのが標準的なやり方です。Server Action は React の **Server Functions** という機能の応用で、`'use server'` ディレクティブを付けたサーバー上の非同期関数のことを指します。

- 関数本体の先頭に `'use server'` を書く
- もしくはファイル先頭に `'use server'` を書くと、そのファイルからエクスポートされる全ての関数が Server Function になる

```ts
"use server";

export async function createPost(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  // ... DB 書き込み
}
```

Server Action を `<form>` の `action` プロップに渡すと、フォーム送信時にブラウザは自動的に POST リクエストを送り、Next.js が該当の Server Function を実行してくれます。受け取る引数は **`FormData`** で、`formData.get('title')` のように値を取り出せます。プログレッシブエンハンスメントが効くので、JavaScript が無効でもフォーム送信が動きます。

ミューテーション後にページの表示を更新するには、`revalidatePath('/posts')` のようにキャッシュを無効化するか、`redirect('/posts/...')` で別ページに遷移します。Cache Components 環境で「ユーザーが直後に自分の変更を確認する」ような操作には、次章で扱う `updateTag` を使うとより自然です。今回はまず一覧ページに即時反映するため `revalidatePath` を使います。

> 重要: Server Action は HTTP の POST で外部から直接呼び出せます。本番運用では関数の冒頭で必ず認証・認可を確認してください。本コースでは学習用 in-memory ストアを使うので省略しています。

## タスク

### 1. Server Action ファイルを作る

`app/posts/_actions.ts` を作成し、ファイル先頭に `'use server'` を書いて `createPost` をエクスポートします。

```ts
"use server";

import { revalidatePath } from "next/cache";
import { addPost } from "./_data";

export async function createPost(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || `post-${Date.now()}`;

  await addPost({ slug, title, body });
  revalidatePath("/posts");
}
```

### 2. 投稿フォームを一覧ページに置く

`app/posts/page.tsx` の一覧表示の上に `<form>` を追加し、`createPost` を `action` に渡します。

```tsx
import { createPost } from "./_actions";

// ...
<form action={createPost}>
  <label>
    タイトル
    <input name="title" type="text" required />
  </label>
  <label>
    本文
    <textarea name="body" required />
  </label>
  <button type="submit">投稿する</button>
</form>;
```

### 3. 動作確認

ブラウザで `/posts` を開き、適当なタイトルと本文を入力して送信してください。一覧の先頭に新しい記事が表示され、`/posts/<生成されたスラッグ>` に遷移すると本文も読めるはずです。

## 完了判定

- 投稿フォームから新しい記事を作成できる
- 送信後、一覧ページに新しい記事が反映されている
- 詳細ページ（`/posts/<新しい slug>`）でも本文が読める

## 補足

`'use server'` をファイル先頭に書くか、関数本体の先頭に書くかは目的に応じて使い分けます。Client Component から import する場合はファイル先頭に書く必要があります。送信中の状態を UI に反映したい場合は、Client Component で `useActionState` フックを使うとフォームの `pending` 状態やバリデーションメッセージを扱えます。in-memory のストアは開発サーバーを再起動すると消える点も覚えておいてください。永続化したい場合は次のステップとして DB（Supabase など）への置き換えを検討します。

## 理解度チェック

- Server Action を定義するために必要なディレクティブは何ですか
- `<form>` の `action` プロップに Server Action を渡すと、どのような HTTP メソッドでサーバーに送られますか
- ミューテーション後に一覧を最新化する代表的な手段を 2 つ挙げてください
