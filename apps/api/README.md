# API

## セットアップ

### golang-migrate のインストール

```sh
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

> `go install` を使う理由: golang-migrate の CLI はデータベースドライバーをビルドタグで制御しており、`go tool` コマンドはビルドタグの指定に対応していないため `go tool migrate` が動作しない（[golang-migrate/migrate#1232](https://github.com/golang-migrate/migrate/issues/1232)）。
