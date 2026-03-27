# GitHub Action 実装ガイドライン

GitHub Actions ワークフローは以下のルールに従うこと。

## 必須設定

### ステップ名の日本語化
各ステップには日本語でわかりやすい名前を必ず付けること。

例:
- `name: リポジトリのチェックアウト`
- `name: 依存関係のインストール`

### pnpm バージョン
`pnpm/action-setup` でバージョンを省略し、`package.json` の `packageManager` フィールドのバージョンを自動使用させること。

- ❌ 悪い例: `version: 10.12.4`
- ✅ 良い例: バージョン指定なし（省略）

### Node.js バージョン
`setup-node` で `.node-version` ファイルを参照すること。

```yaml
- uses: actions/setup-node@v4
  with:
    node-version-file: .node-version
```

### concurrency 設定
重複実行を防ぐため、原則的に concurrency を設定すること。設定しない場合はワークフローファイルにその理由をコメントで残すこと。

```yaml
concurrency:
  group: <workflow-name>-${{ github.ref }}
  cancel-in-progress: true
```

### タイムアウト設定
各ジョブには最低でも 10 分のタイムアウトを設定すること。

```yaml
jobs:
  build:
    timeout-minutes: 10
```

## 実装例

```yaml
name: CI

on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: リポジトリのチェックアウト
        uses: actions/checkout@v4

      - name: pnpm のセットアップ
        uses: pnpm/action-setup@v4
        # version は省略（package.json の packageManager を使用）

      - name: Node.js のセットアップ
        uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm

      - name: 依存関係のインストール
        run: pnpm install

      - name: ビルド
        run: pnpm -w build
```
