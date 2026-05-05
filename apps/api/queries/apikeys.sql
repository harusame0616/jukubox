-- name: CountApiKeyByUserID :one
SELECT
    COUNT(*)
FROM
    apikeys
WHERE
    apikeys.user_id = @UserID :: uuid;

-- name: InsertApiKey :exec
INSERT INTO
    apikeys (
        apikey_id,
        key_hash,
        user_id,
        plain_suffix,
        expired_at
    )
VALUES
    (
        @apikey_id,
        @key_hash,
        @user_id,
        @key_plain_suffix,
        @expired_at
    );

-- name: ListApiKeysByUserID :many
SELECT
    apikey_id,
    plain_suffix,
    _created_at,
    expired_at
FROM
    apikeys
WHERE
    apikeys.user_id = @UserID :: uuid;

-- name: DeleteApiKeyByID :execrows
DELETE FROM
    apikeys
WHERE
    apikeys.apikey_id = @apikey_id :: uuid
    AND apikeys.user_id = @user_id :: uuid;

-- name: GetUserIDByApiKeyHash :one
SELECT
    user_id
FROM
    apikeys
WHERE
    apikeys.key_hash = @key_hash
    AND (
        apikeys.expired_at = 'infinity'
        OR apikeys.expired_at > now()
    );
