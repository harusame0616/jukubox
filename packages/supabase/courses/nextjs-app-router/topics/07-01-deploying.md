---
title: "Vercel にデプロイして公開する"
description: "GitHub にミニブログを push し、Vercel から接続して本番 URL を取得する。"
---

# Vercel にデプロイして公開する

## 目標

- 作成したミニブログを GitHub リポジトリに push する
- Vercel に接続してデプロイし、本番 URL でアクセスできるようにする
- 本番ビルドが通ることを確認する

## 知識

Next.js は本番にもいろいろな方法でデプロイできます。代表的な選択肢を整理しておきます。

- **Node.js サーバー**: 任意の VPS やコンテナサービス。`next build` で生成し、`next start` で起動する。Next.js の全機能をサポート
- **Docker コンテナ**: コンテナオーケストレーターやクラウドのコンテナサービスで動かす。これも全機能サポート
- **Static export**: 完全な静的サイトとして書き出す。Server Actions などのサーバー機能は使えない
- **Adapters / マネージドサービス**: **Vercel** や **Bun** が verified adapter を提供しており、Cloudflare、Netlify、Firebase App Hosting なども独自の Next.js 連携を提供している

本コースでは作者が Next.js を作っている **Vercel** に乗せます。Vercel は GitHub と連携し、push のたびに自動でビルドとデプロイを走らせ、PR ごとに **プレビュー URL** も発行してくれます。`'use cache'` や `updateTag` といった Cache Components の機能もそのまま使えます。

デプロイ前にローカルで `next build` を通しておくのが鉄則です。Cache Components が有効な状態だと、`<Suspense>` で囲むのを忘れた箇所でビルドが落ちます。手元で見つけて直しておきましょう。

## タスク

### 1. ローカルで本番ビルドを通す

`mini-blog` ディレクトリで本番ビルドを実行し、警告やエラーが出ないか確認します。

```bash
pnpm build
```

ビルド成果のサマリで `/posts` が **Prerendered** 寄りになっていることを確認してください。問題があれば、メッセージに従って `<Suspense>` を追加するか `'use cache'` を見直します。

### 2. GitHub にリポジトリを作って push する

GitHub に新規リポジトリ（例: `mini-blog`）を作成し、ローカルの状態を push します。

```bash
git init
git add .
git commit -m "feat: initial mini blog"
git branch -M main
git remote add origin https://github.com/<your-account>/mini-blog.git
git push -u origin main
```

### 3. Vercel に接続してデプロイする

[https://vercel.com](https://vercel.com) にログインし、「New Project」から先ほどの GitHub リポジトリをインポートします。フレームワークは自動で **Next.js** が選ばれます。環境変数は本コースの範囲では不要です。

「Deploy」を押すとビルドが始まり、数十秒〜数分で完了します。発行された URL（`https://<project>.vercel.app`）にアクセスし、ローカルと同じくホーム・記事一覧・記事詳細が表示されること、ヘッダーリンクで遷移できること、新規投稿フォームから記事を作れることを確認してください。

> 補足: in-memory ストアはデプロイ後に複数のサーバーインスタンスで共有されないため、本番環境では「投稿しても次のリクエストで消える」可能性があります。学習用なので深追いせず、永続化したい場合は次の学習として Supabase などの DB を導入してください。

## 完了判定

- ローカルで `pnpm build` がエラーなく完了する
- GitHub にリポジトリが作られて main ブランチが push されている
- Vercel から本番 URL が発行され、トップページと記事一覧が閲覧できる

## 補足

Vercel 以外でも、Node.js を実行できる環境なら `next build` と `next start` で動かせます。Docker で動かしたい場合は `output: 'standalone'` を `next.config.ts` に追加すると、最小限のランタイム依存だけを含む軽量な成果物が生成されます。本コースで使った Cache Components の機能（`'use cache'` / `cacheLife` / `cacheTag` / `updateTag`）はランタイム側のキャッシュが必要なので、完全な Static export では一部使えません。デプロイ後に `pnpm dev` をローカルで動かしながら本番 URL と挙動を比較するのも、原因切り分けに有効です。

## 理解度チェック

- Next.js を最も完全な機能でデプロイできる代表的な 2 つの方式は何ですか
- 本番にデプロイする前にローカルで実行しておくべきコマンドは何ですか
- Static export で動かない代表的な機能を 1 つ挙げてください
