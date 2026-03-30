.PHONY: dev-api

help:
	@echo "make dev-api: API 開発サーバー起動（ホットリロード付き）"

dev-api:
	$(MAKE) -C apps/api dev
