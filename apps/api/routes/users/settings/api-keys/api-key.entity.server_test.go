package apikeys

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestApiKeyEntitySmall(t *testing.T) {
	t.Run("GenerateNewApiKey: 正しいフォーマットで plain key が生成される", func(t *testing.T) {
		apiKey := GenerateNewApiKey()

		assert.Regexp(t, "^ijuku_[A-Za-z0-9\\-_]{43}$", apiKey.Plain)
	})

	t.Run("GenerateNewApiKey: 正しいフォーマットで plain key が生成される", func(t *testing.T) {
		apiKey := GenerateNewApiKey()

		assert.Regexp(t, "^ijuku_[A-Za-z0-9\\-_]{43}$", apiKey.Plain)
	})

	t.Run("GenerateApiKeyFromPlain: 正しいフォーマットで plain key を設定できる", func(t *testing.T) {
		const plain = "ijuku_WLLzKj--pHcnavVL3eFTcUZI65sdTVCp690B5r7Vc3s"
		apiKey, err := GenerateApiKeyFromPlainKey(plain)

		assert.Equal(t, plain, apiKey.Plain)
		assert.NoError(t, err)
	})

	t.Run("GenerateApiKeyFromPlain: 正しくないフォーマットでエラーを返す（prefix なし）", func(t *testing.T) {
		const plain = "WLLzKj--pHcnavVL3eFTcUZI65sdTVCp690B5r7Vc3s"
		_, err := GenerateApiKeyFromPlainKey(plain)

		assert.ErrorIs(t, err, ErrApiKeyIsInvalidFormat)
	})

	t.Run("GenerateApiKeyFromPlain: 正しくないフォーマットでエラーを返す（base64 でない文字）", func(t *testing.T) {
		const plain = "ijuku_WLLzKj--pHcnavVL3eFTcUZI65sdTVCp690B5r7Vc3$"
		_, err := GenerateApiKeyFromPlainKey(plain)

		assert.ErrorIs(t, err, ErrApiKeyIsInvalidFormat)
	})

	t.Run("GetHash: SHA-256 hex 形式で返される", func(t *testing.T) {
		hash := GenerateNewApiKey().GetHash()
		assert.Regexp(t, "^[0-9a-f]{64}$", hash)
	})

	t.Run("GetHash: 同じキーから同じハッシュが生成される", func(t *testing.T) {
		apiKey := GenerateNewApiKey()
		assert.Equal(t, apiKey.GetHash(), apiKey.GetHash())
	})

	t.Run("GetHash: 異なるキーからは異なるハッシュが生成される", func(t *testing.T) {
		a := GenerateNewApiKey()
		b := GenerateNewApiKey()
		assert.NotEqual(t, a.GetHash(), b.GetHash())
	})
}
