package apikeys

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/uuidutils"
)

type hashedApiKey struct {
	apiKeyID          uuid.UUID
	hashedApiKey      string
	plainApiKeySuffix string
	userID            uuid.UUID
	expiredAt         *time.Time
}

type NewHashedApiKeyParams struct {
	UserID    uuid.UUID
	ExpiredAt *time.Time
}

var ErrApiKeyCountExceedsLimit = errors.New("API key count exceeds the limit")

const apiKeyMaxCount = 5

func NewHashedApiKey(params NewHashedApiKeyParams) (hashedApiKey, string) {
	plainKey := generatePlainApiKey()
	key := hashedApiKey{
		apiKeyID:          uuidutils.MustNewUUID(),
		userID:            params.UserID,
		hashedApiKey:      getHash(plainKey),
		plainApiKeySuffix: plainKey[len(plainKey)-4:],
		expiredAt:         params.ExpiredAt,
	}

	return key, plainKey
}

// API キー hash は認証ミドルウェアでの照合と同じアルゴリズムを使う。
// libauth.HashApiKey に詳細コメントあり。
func getHash(plain string) string {
	return libauth.HashApiKey(plain)
}

func generatePlainApiKey() string {
	b := make([]byte, 32)

	if _, err := rand.Read(b); err != nil {
		panic(err)
	}

	return fmt.Sprintf("jukubox_%s", base64.RawURLEncoding.EncodeToString(b))
}
