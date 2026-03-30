.PHONY: dev-api migrate-up

help:
	@echo "make dev-api: API 開発サーバー起動（ホットリロード付き）"
	@echo "make migrate-up: マイグレーション実行"

dev-api:
	$(MAKE) -C apps/api dev

migrate-up:
	$(MAKE) -C apps/api migrate-up
