---
title: "Next.js プロジェクトを作成する"
description: "create-next-app で新しい Next.js アプリを作成し、開発サーバーを起動できる状態にする。"
---

# Next.js プロジェクトを作成する

## 目標

- `create-next-app` を使ってミニブログのベースプロジェクトを作成する
- 開発サーバーを起動し、ブラウザで初期画面を確認する

## 知識

Next.js は React ベースのフルスタックフレームワークで、ファイルベースのルーティングや Server Components を備えています。本コースで扱うのは Next.js 16 系の **App Router** で、`app/` ディレクトリにファイルを置くだけでルーティングが定義される仕組みです。

新しいプロジェクトを始めるときは `create-next-app` という公式 CLI を使います。これは TypeScript・ESLint・Tailwind CSS・App Router・Turbopack といったモダンな構成を一度にセットアップしてくれるコマンドです。本コースでは `--yes` オプションで推奨デフォルトを採用し、TypeScript と Tailwind CSS を有効にした状態で進めます。

`create-next-app` でセットアップした直後の主要なスクリプトは以下の通りです。

- `next dev`: 開発サーバーを起動する。デフォルトのバンドラは Turbopack
- `next build`: 本番用にビルドする
- `next start`: 本番ビルドの結果を起動する

開発サーバーは既定で `http://localhost:3000` を待ち受けます。ファイルを保存するとブラウザに自動反映されます。

## タスク

### 1. プロジェクトを作成する

任意の作業ディレクトリで以下を実行し、`mini-blog` という名前で新規プロジェクトを作成してください。本コース全体ではここで作ったアプリを「ミニブログ」と呼び、章を進めるごとに機能を追加していきます。

```bash
pnpm create next-app@latest mini-blog --yes
```

`pnpm` 以外を使っているなら `npx create-next-app@latest mini-blog --yes` でも構いません。

### 2. 開発サーバーを起動する

プロジェクトディレクトリに入って開発サーバーを立ち上げます。

```bash
cd mini-blog
pnpm dev
```

ブラウザで `http://localhost:3000` を開き、`create-next-app` が用意した初期ページが表示されることを確認してください。

### 3. ファイル構成をざっと眺める

`app/page.tsx` と `app/layout.tsx` がトップページとルートレイアウトに対応します。試しに `app/page.tsx` の見出しを `Mini Blog` などに書き換えて保存し、ブラウザがホットリロードで更新される様子を確認してみてください。

## 完了判定

- `mini-blog` ディレクトリが生成され、`pnpm dev` でエラーなく開発サーバーが起動する
- `http://localhost:3000` でページが表示される
- `app/page.tsx` を編集すると即座にブラウザに反映される

## 補足

Node.js のバージョンが 20.9 未満だと `create-next-app` が失敗します。`node -v` で確認し、必要なら nvm などで新しい Node.js を入れてください。ポート 3000 が他のプロセスで埋まっている場合は、`pnpm dev -- -p 3001` のように別ポートを指定して起動するか、衝突しているプロセスを終了してください。Windows 環境では WSL 上での実行を推奨します。

## 理解度チェック

- App Router で新規プロジェクトを最短で作る公式 CLI は何ですか
- `next dev` と `next build` はそれぞれ何のためのスクリプトですか
- 開発サーバーが既定で待ち受けるホストとポートはどこですか
