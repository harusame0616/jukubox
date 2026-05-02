---
title: "Cache Components を有効化する"
description: "next.config.ts に cacheComponents: true を設定し、新しいキャッシュモデルに切り替える。"
---

# Cache Components を有効化する

## 目標

- `next.config.ts` に `cacheComponents: true` を追加する
- Cache Components を有効化したときの基本的なルール（明示的にキャッシュしたものだけが静的シェルに入る）を理解する

## 知識

Next.js 16 から導入された **Cache Components** は、App Router のキャッシュモデルを「**明示的にキャッシュしたものだけが静的にプリレンダリングされ、それ以外は実行時に動的レンダリングされる**」という方針に統一する機能です。`cacheComponents: true` を `next.config.ts` で有効にすると、以下の API がそろって使えるようになります。

- `'use cache'` ディレクティブ: 関数やコンポーネントの結果をキャッシュ
- `cacheLife(profile)`: キャッシュの有効期間プロファイル（`seconds` / `minutes` / `hours` / `days` / `weeks` / `max`）を指定
- `cacheTag(tag)`: キャッシュにタグを付け、タグ単位で無効化できるようにする

Cache Components が有効なときは、`fetch()` や DB アクセス、`cookies()` のようなリクエスト時 API は **デフォルトでキャッシュされません**。それらにアクセスするコンポーネントは `<Suspense>` で囲うか、`'use cache'` を付けてキャッシュ対象にする必要があります。これを忘れると `Uncached data was accessed outside of <Suspense>` というビルド時エラーが出ます。

これは React の **Partial Prerendering (PPR)** という考え方とセットになっています。キャッシュ可能な部分は静的シェルとして事前生成され、動的な部分は `<Suspense>` のフォールバックを差し込みつつ実行時にストリーミングで埋めていきます。本コースでは Cache Components 前提でミニブログを組み立てるため、ここで必ず有効化しておきます。

## タスク

### 1. next.config.ts を編集する

`mini-blog` プロジェクト直下にある `next.config.ts` を開き、`cacheComponents: true` を追加してください。

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

`next.config.js` の場合は `module.exports` 形式に合わせて同じ内容を追記します。

### 2. 開発サーバーを再起動する

`next.config.ts` の変更はホットリロードでは反映されないことが多いため、開発サーバーを一度止めて `pnpm dev` で起動し直してください。`/` にアクセスして引き続きホームが表示されれば OK です。

### 3. 何が変わるのかメモする

このトピックの時点では UI に見える変化はありませんが、**今後 `fetch` や `cookies()` を使うときには `<Suspense>` か `'use cache'` で挟む必要がある** という点を、ノートやコメントに書き留めておいてください。次章以降の指示で活きてきます。

## 完了判定

- `next.config.ts` に `cacheComponents: true` が記述されている
- 開発サーバーを再起動してもエラーなくホームが表示される

## 補足

`cacheComponents` は Next.js 16 で導入されたフラグで、以前の `experimental.ppr` / `experimental.dynamicIO` / `experimental.useCache` をひとまとめにした上位互換の設定です。したがって本コースの内容は 16 系専用と考えてください。古いバージョンで参照していた個別フラグは設定しないでください。設定後にビルドが「Uncached data was accessed outside of `<Suspense>`」で失敗するときは、その箇所のデータアクセスが意図せず非キャッシュになっている合図なので、`<Suspense>` で包むか `'use cache'` を付けて対処します。

## 理解度チェック

- `cacheComponents: true` を有効にしたあと、`fetch` のような非キャッシュデータを使うコンポーネントはどうラップする必要がありますか
- `'use cache'` ディレクティブの目的を一言で説明してください
- Cache Components で利用できるキャッシュ寿命プロファイル（`cacheLife`）を 3 つ挙げてください
