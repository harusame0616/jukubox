package apikeys

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
)

type ApiKey struct {
	Plain string
}

var plainRegex = regexp.MustCompile(`^ijuku_[A-Za-z0-9\-_]{43}$`)
var ErrApiKeyIsInvalidFormat = errors.New("apikey format is invalid format")

func GenerateNewApiKey() ApiKey {
	b := make([]byte, 32)
	rand.Read(b)

	return ApiKey{
		Plain: fmt.Sprintf("ijuku_%s", base64.RawURLEncoding.EncodeToString(b)),
	}
}

func GenerateApiKeyFromPlainKey(plain string) (ApiKey, error) {
	if !plainRegex.MatchString(plain) {
		return ApiKey{}, ErrApiKeyIsInvalidFormat
	}

	return ApiKey{
		Plain: plain,
	}, nil

}

func (apiKey ApiKey) GetHash() string {
	hash := sha256.Sum256([]byte(apiKey.Plain))
	return hex.EncodeToString(hash[:])
}
