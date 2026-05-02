.DEFAULT_GOAL := help

.PHONY: help dev migrate-new migrate-up query-generate test-all test-coverage test-coverage-show

DATABASE_URL ?= postgresql://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable

SUPABASE_URL ?= http://127.0.0.1:54321
SUPABASE_ANON_KEY ?= sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_JWT_SECRET ?= super-secret-jwt-token-with-at-least-32-characters-long
WEB_ORIGIN ?= http://localhost:60000
COOKIE_SECURE ?= false

export DATABASE_URL
export SUPABASE_URL
export SUPABASE_ANON_KEY
export SUPABASE_JWT_SECRET
export WEB_ORIGIN
export COOKIE_SECURE

help: ## このヘルプを表示
	@awk 'BEGIN {FS = ":[^#]*?## "} /^[a-zA-Z][a-zA-Z_-]*:.*?## / {printf "make %s: %s\n", $$1, $$2}' $(firstword $(MAKEFILE_LIST))

dev: ## 開発サーバー起動（ホットリロード付き）
	mkdir -p ./tmp && GOTMPDIR=$(CURDIR)/tmp GOCACHE=$(CURDIR)/tmp/go-cache go tool air

migrate-new: ## マイグレーションファイルを新規作成（file=<name> 必須）
ifndef file
	$(error file is required. Usage: make migrate-new file=add_users_table)
endif
	migrate create -ext sql -dir ./migrations -seq $(file)

migrate-up: ## マイグレーション実行
	migrate -path ./migrations -database "$(DATABASE_URL)" up

query-generate: ## sqlc クエリコードを生成
	sqlc generate

test-all: ## 全テスト実行（カバレッジ付き）
	go test -coverpkg=./... -coverprofile=coverage.out ./...

test-coverage-show: test-all ## カバレッジをブラウザで表示
	go tool cover -html=coverage.out

test-coverage: ## カバレッジが 80% 以上かチェック
	@go test -count=1 -coverpkg=./... -coverprofile=coverage.out ./... > /dev/null 2>&1 || (echo "NG: テスト失敗"; exit 1)
	@go tool cover -func=coverage.out | tail -1 | awk '{gsub(/%/,"",$$3); if ($$3+0 < 80) {print "NG: " $$3 "% < 80%"; exit 1} else {print "OK: " $$3 "%"}}'
