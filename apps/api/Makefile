.PHONY: dev migrate-up

DATABASE_URL ?= postgresql://postgres:password@localhost:5432/postgres?sslmode=disable

help:
	@echo "make dev: 開発サーバー起動（ホットリロード付き）"
	@echo "make migrate-up: マイグレーション実行"

dev:
	mkdir -p ./tmp && GOTMPDIR=$(CURDIR)/tmp GOCACHE=$(CURDIR)/tmp/go-cache go tool air

migrate-up:
	migrate -path ./migrations -database "$(DATABASE_URL)" up
