# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) が本リポジトリ内のコードを扱う際の手順や指針をまとめたものです。

## リポジトリ概要

本リポジトリは AI を活用したインターネット塾サービス、 JukuBox のモノレポです。
JukuBox はユーザーが自分で契約している AI サービスを利用して、学習をサポートするサービスです。
ユーザーは MCP や Skill などを利用して、本サービスの機能をもとに学習を進めることができます。

## フォルダ構成

- `apps/` - アプリケーション
  - `api/` - バックエンド API
  - `web/` - WEB アプリケーション
- `docs/` - **ドキュメント**
  - `api/` - API ドキュメント

## 使用可能な CLI コマンド

- gh
- supabase
- vercel
- sentry
- playwright-cli（ブラウザ操作時に必ず使用）
- migrate（golang-migrate）

## 主要コマンド

```bash
make dev-api: API 開発サーバー起動（ホットリロード付き）
make migrate-new file=<name>: マイグレーションファイルを新規作成
make migrate-up: マイグレーション実行
make db-seed: Mock 認証用テストユーザーを投入（Service Role キー必須）
make api-test-all: API の全テスト実行（カバレッジ付き）
make api-test-coverage: API のカバレッジが80%以上かチェック
make api-test-coverage-show: API のカバレッジをブラウザで表示
make web-dev: web 開発サーバー起動
make web-lint: web の ESLint 実行
make web-test-all: web の全テスト実行（カバレッジ付き）
make web-test-coverage: web のカバレッジが80%以上かチェック
make web-test-coverage-show: web のカバレッジをブラウザで表示
make spell-check: スペルチェックの実行
```

## プロジェクト情報

### ブランチ命名規則

| ブランチ種別 | 命名規則                     | 例                      |
| ------------ | ---------------------------- | ----------------------- |
| メイン       | `main`                       | `main`                  |
| 開発         | `<チケット番号>-<task-name>` | `156-fix-note-register` |

### 開発環境

- 開発サーバー：http://localhost:3000
- DB：postgresql://postgres:password@db:5432/postgres

## ワークフロー

一連の編集完了時に以下を実施し、すべてがパスするまで修正を繰り返す。

- バリデーションチェック（lint・format・デッドコード・スペル・型チェック）
- ビルド
- テスト
- ブラウザでの動作確認
  - 機能が動作すること（ブラウザを操作して確認）
  - 画面崩れ（スクリーンショットで確認）
  - ログチェック（ブラウザ・開発サーバーにエラーメッセージが出ていないこと）
- カバレッジチェック
- E2E（DBリセット後実施）

## 参考ドキュメント

重要：タスクに関連ある agent-docs 配下のドキュメントを必ず参照すること
