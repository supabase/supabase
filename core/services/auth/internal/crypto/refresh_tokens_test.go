package crypto

import (
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"math"
	"strings"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
)

func TestSafeIntegers(t *testing.T) {
	require.Equal(t, int64(math.MaxInt64), safeInt64(math.MaxUint64))
	require.Equal(t, int64(math.MaxInt64), safeInt64(math.MaxInt64))

	require.Equal(t, uint64(0), safeUint64(-1))
	require.Equal(t, uint64(math.MaxInt64), safeUint64(math.MaxInt64))
}

func TestRefreshTokenParse(t *testing.T) {
	negativeExamples := []struct {
		value []byte
		error error
	}{
		{
			value: make([]byte, minRefreshTokenLength-1),
			error: ErrRefreshTokenLength,
		},
		{
			value: make([]byte, minRefreshTokenLength),
			error: ErrRefreshTokenChecksumInvalid,
		},
		{
			value: func() []byte {
				b := make([]byte, minRefreshTokenLength)
				b[0] = 1
				return b
			}(),
			error: ErrRefreshTokenUnknownVersion,
		},
		{
			value: func() []byte {
				b := make([]byte, minRefreshTokenLength)
				for i := 1 + 16; i < len(b); i += 1 {
					b[i] = 0xFF
				}

				checksum := sha256.Sum256(b[:len(b)-refreshTokenChecksumLength])
				copy(b[len(b)-refreshTokenChecksumLength:], checksum[:refreshTokenChecksumLength])
				return b
			}(),
			error: ErrRefreshTokenCounterInvalid,
		},
		{
			value: func() []byte {
				b := make([]byte, minRefreshTokenLength)
				b[1+16] = 0xFF
				b[1+16+1] = 0

				checksum := sha256.Sum256(b[:len(b)-refreshTokenChecksumLength])
				copy(b[len(b)-refreshTokenChecksumLength:], checksum[:refreshTokenChecksumLength])
				return b
			}(),
			error: ErrRefreshTokenLength,
		},
	}

	for i, example := range negativeExamples {
		t.Run(fmt.Sprintf("negative example %d", i), func(t *testing.T) {
			rt, err := ParseRefreshToken(base64.RawURLEncoding.EncodeToString(example.value))
			require.Nil(t, rt)
			require.Error(t, err)
			require.Equal(t, err, example.error)
		})
	}

	rt, err := ParseRefreshToken(strings.Repeat("!", (4*minRefreshTokenLength)/3))
	require.Nil(t, rt)
	require.Error(t, err)

	original := &RefreshToken{
		SessionID: uuid.Must(uuid.NewV4()),
		Counter:   9223372036854775807,
	}

	parsed, err := ParseRefreshToken(original.Encode(make([]byte, 32)))
	require.Nil(t, err)
	require.Equal(t, original.SessionID.String(), parsed.SessionID.String())
	require.Equal(t, original.Counter, parsed.Counter)
	require.Equal(t, original.Raw, parsed.Raw)
	require.Equal(t, original.Signature, parsed.Signature)
}

func TestRefreshTokenTableName(t *testing.T) {
	require.Panics(t, func() {
		RefreshToken{}.TableName()
	})
}
