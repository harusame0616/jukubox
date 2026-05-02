# API仕様書: API キー発行 (Generate API Key)

## 1. 概要・エンドポイント定義

ログイン中ユーザー向けに新しい API キーを発行します。レスポンスには **平文の API キー** が含まれ、サーバーには再表示できないため、クライアント側で必ず安全に保管してください。

| 項目       | 内容                                  |
| :--------- | :------------------------------------ |
| **Method** | `POST`                                |
| **Path**   | `/v1/me/apikeys`                      |
| **認証**   | 要 (Supabase JWT / Bearer Token)      |

---

## 2. リクエスト

### 2.1. パスパラメータ

なし。対象ユーザーは Authorization ヘッダーの JWT から解決します。

### 2.2. ヘッダー

| ヘッダー名        | 値の形式            | 必須 | 説明                                       |
| :---------------- | :------------------ | :--- | :----------------------------------------- |
| **Authorization** | `Bearer {JWT}`      | Yes  | Supabase 発行の JWT (アクセストークン)。   |

### 2.3. リクエストボディ (JSON)

| パラメータ名 | 型     | 必須 | 説明                                                                                            |
| :----------- | :----- | :--- | :---------------------------------------------------------------------------------------------- |
| `expiredAt`  | String | No   | API キーの有効期限 (ISO 8601 / RFC 3339)。省略 / `null` の場合は無期限。                          |

ボディ全体を省略した場合は無期限の API キーを発行します。

---

## 3. レスポンス

### 3.1. 成功時 (`200 OK`)

```json
{
  "apikey": "sk_live_abc123def456..."
}
```

| フィールド | 型     | 説明                                                                                                  |
| :--------- | :----- | :---------------------------------------------------------------------------------------------------- |
| `apikey`   | String | 発行された API キーの **平文**。レスポンス受信時にのみ取得可能。サーバーはハッシュ化された値のみ保持。 |

### 3.2. エラー時

| HTTP Status                   | エラーコード (code)            | 発生条件                                                                                       |
| :---------------------------- | :----------------------------- | :--------------------------------------------------------------------------------------------- |
| **400 Bad Request**           | `INPUT_VALIDATION_ERROR`       | `expiredAt` が ISO 8601 形式でない、ボディが不正な JSON、 `userID` (JWT) が UUID でない場合。  |
| **401 Unauthorized**          | `UNAUTHORIZED`                 | Authorization ヘッダー欠落、または JWT が無効な場合。                                          |
| **409 Conflict**              | `APIKEY_QUOTA_EXCEEDS_LIMIT`   | 1 ユーザーあたりの上限 (5 件) に達している場合。                                               |
| **503 Service Unavailable**   | `APIKEY_LOCK_TIMEOUT`          | 同時発行リクエストの排他ロック取得がタイムアウトした場合。リトライしてください。               |
| **500 Internal Server Error** | `SERVER_INTERNAL_ERROR`        | DB エラーなど予期しないサーバーエラー。                                                        |

エラーレスポンス例:

```json
{
  "code":    "APIKEY_QUOTA_EXCEEDS_LIMIT",
  "message": "Api key quota exceeds limit. Api key quota limit is 5"
}
```

---

## 4. 振る舞い・ロジック

- 平文の API キーはレスポンスにのみ含まれ、サーバー側はハッシュ化された値しか保存しないため再表示できない。
- 1 ユーザーあたりの保有上限は 5 件。上限到達時は `409 APIKEY_QUOTA_EXCEEDS_LIMIT`。
- 同時実行は PostgreSQL Advisory Lock で排他。タイムアウト時は `503 APIKEY_LOCK_TIMEOUT` で安全側にリトライ要求。

---

## 5. 認証 (Authentication)

本エンドポイントは Supabase の JWT を用いた認証で保護されており、 [認証.md](./認証.md) で説明している API キー (Bearer) 認証とは別系統です。発行された API キーは [認証.md](./認証.md) のフローで利用します。

---

## 6. リクエスト例 (cURL)

```bash
curl -X POST "https://api.example.com/v1/me/apikeys" \
     -H "Authorization: Bearer eyJhbGciOi..." \
     -H "Content-Type: application/json" \
     -d '{
           "expiredAt": "2027-01-10T00:00:00Z"
         }'
```

---

## 7. 関連ドキュメント

- [apiキー一覧.md](./apiキー一覧.md)
- [認証.md](./認証.md)
