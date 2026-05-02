.PHONY: dev-api migrate-up db-seed api-test-all api-test-coverage api-test-coverage-show web-dev web-lint web-test-all web-test-coverage web-test-coverage-show spell-check

help:
	@echo "make dev-api: API 開発サーバー起動（ホットリロード付き）"
	@echo "make migrate-new file=<name>: マイグレーションファイルを新規作成"
	@echo "make migrate-up: マイグレーション実行"
	@echo "make db-seed: Mock 認証用テストユーザーを投入（Service Role キー必須）"
	@echo "make api-test-all: API の全テスト実行（カバレッジ付き）"
	@echo "make api-test-coverage: API のカバレッジが80%以上かチェック"
	@echo "make api-test-coverage-show: API のカバレッジをブラウザで表示"
	@echo "make web-dev: web 開発サーバー起動"
	@echo "make web-lint: web の ESLint 実行"
	@echo "make web-test-all: web の全テスト実行（カバレッジ付き）"
	@echo "make web-test-coverage: web のカバレッジが80%以上かチェック"
	@echo "make web-test-coverage-show: web のカバレッジをブラウザで表示"
	@echo "make spell-check: スペルチェックの実行"

dev-api:
	$(MAKE) -C apps/api dev

migrate-new:
	$(MAKE) -C apps/api migrate-new file=$(file)

migrate-up:
	$(MAKE) -C apps/api migrate-up

db-seed:
	node --experimental-strip-types packages/supabase/seed.ts

db-reset:
	$(MAKE) -C apps/api db-reset

query-generate:
	$(MAKE) -C apps/api query-generate

api-test-all:
	$(MAKE) -C apps/api test-all

api-test-coverage:
	$(MAKE) -C apps/api test-coverage

api-test-coverage-show:
	$(MAKE) -C apps/api test-coverage-show

web-dev:
	$(MAKE) -C apps/web dev

web-lint:
	$(MAKE) -C apps/web lint

web-test-all:
	$(MAKE) -C apps/web test-all

web-test-coverage:
	$(MAKE) -C apps/web test-coverage

web-test-coverage-show:
	$(MAKE) -C apps/web test-coverage-show

spell-check:
	pnpm cspell "**"
