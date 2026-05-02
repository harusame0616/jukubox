.DEFAULT_GOAL := help

.PHONY: help dev lint test-all test-coverage test-coverage-show

help: ## このヘルプを表示
	@awk 'BEGIN {FS = ":[^#]*?## "} /^[a-zA-Z][a-zA-Z_-]*:.*?## / {printf "make %s: %s\n", $$1, $$2}' $(firstword $(MAKEFILE_LIST))

dev: ## 開発サーバー起動
	pnpm dev

lint: ## ESLint の実行
	pnpm lint

test-all: ## 全テスト実行（カバレッジ付き）
	pnpm vitest run --coverage

test-coverage: ## カバレッジが 80% 以上かチェック
	@pnpm vitest run --coverage --silent > /dev/null 2>&1 || (echo "NG: テスト失敗"; exit 1)
	@node -e "const s=require('./coverage/coverage-summary.json').total.lines.pct; if(s<80){console.log('NG: '+s+'% < 80%');process.exit(1)}else{console.log('OK: '+s+'%')}"

test-coverage-show: test-all ## カバレッジをブラウザで表示
	open coverage/index.html
