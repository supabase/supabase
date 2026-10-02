package crypto

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"testing"
	"testing/iotest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/argon2"
)

func TestGenerateRecoveryCode(t *testing.T) {
	for _, length := range []int{13, 16, 64} {
		code := GenerateRecoveryCode(length)

		assert.Len(t, code, length)

		for _, c := range code {
			assert.Contains(t, recoveryCodeAlphabet, string(c))
		}
	}

	// check for duplicate codes across a large sample
	codes := make(map[string]bool)
	for range 100 {
		code := GenerateRecoveryCode(16)

		if codes[code] {
			t.Errorf("GenerateRecoveryCode() generated duplicate code: %s", code)
		}
		codes[code] = true
	}
}

func TestNormalizeRecoveryCode(t *testing.T) {
	examples := []struct {
		input    string
		expected string
	}{
		{" AbCD EfgH-JKLM NP27 ", "abcdefghjklmnp27"},
		{"ABCD-EFGH-JKLM-NP27", "abcdefghjklmnp27"},
		{"abcdefghjklmnp27", "abcdefghjklmnp27"},
		{"\tabcd efgh\njklm np27\r", "abcdefghjklmnp27"},
		{"----", ""},
		{"", ""},
	}

	for _, example := range examples {
		assert.Equal(t, example.expected, NormalizeRecoveryCode(example.input))
	}
}

func TestGenerateRecoveryCodeHash(t *testing.T) {
	code := GenerateRecoveryCode(16)

	hash, err := GenerateRecoveryCodeHash(code)
	require.NoError(t, err)

	prefix := "$argon2id$v=19$m=19456,t=2,p=1$"
	require.True(t, strings.HasPrefix(hash, prefix), "hash %q does not have prefix %q", hash, prefix)

	parts := strings.Split(strings.TrimPrefix(hash, prefix), "$")
	require.Len(t, parts, 2)

	salt, err := base64.RawStdEncoding.DecodeString(parts[0])
	require.NoError(t, err)
	assert.Len(t, salt, recoveryCodeArgon2idSaltLength)

	digest, err := base64.RawStdEncoding.DecodeString(parts[1])
	require.NoError(t, err)
	assert.Len(t, digest, int(recoveryCodeArgon2idKeyLength))

	// a fresh salt is drawn per call, so hashing the same code twice must
	// yield different hashes
	otherHash, err := GenerateRecoveryCodeHash(code)
	require.NoError(t, err)
	assert.NotEqual(t, hash, otherHash)
}

func TestGenerateRecoveryCodeHashRandFailure(t *testing.T) {
	originalReader := rand.Reader
	rand.Reader = iotest.ErrReader(errors.New("out of entropy"))
	defer func() {
		rand.Reader = originalReader
	}()

	_, err := GenerateRecoveryCodeHash("abcdefghjklmnp27")
	require.Error(t, err)
}

func TestCompareHashAndRecoveryCode(t *testing.T) {
	code := GenerateRecoveryCode(16)

	hash, err := GenerateRecoveryCodeHash(code)
	require.NoError(t, err)

	assert.NoError(t, CompareHashAndRecoveryCode(hash, code))

	err = CompareHashAndRecoveryCode(hash, GenerateRecoveryCode(16))
	assert.ErrorIs(t, err, ErrRecoveryCodeMismatchedHashAndCode)
}

func TestCompareHashAndRecoveryCodeParameterAgility(t *testing.T) {
	// parameters are read from the hash, so a hash generated with different
	// parameters than the current defaults must still verify
	code := "abcdefghjklmnp27"
	salt := []byte("0123456789abcdef")

	digest := argon2.IDKey([]byte(code), salt, 2, 16, 2, 24)
	hash := fmt.Sprintf(
		"$argon2id$v=19$m=16,t=2,p=2$%s$%s",
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(digest),
	)

	assert.NoError(t, CompareHashAndRecoveryCode(hash, code))
	assert.ErrorIs(t, CompareHashAndRecoveryCode(hash, "wrongcodejklmnp27"), ErrRecoveryCodeMismatchedHashAndCode)

	// a hash sitting exactly on every minimum bound (m=8*p, 8-byte salt,
	// 16-byte digest) must still verify
	minSalt := []byte("01234567")
	minDigest := argon2.IDKey([]byte(code), minSalt, 1, 8, 1, 16)
	minHash := fmt.Sprintf(
		"$argon2id$v=19$m=8,t=1,p=1$%s$%s",
		base64.RawStdEncoding.EncodeToString(minSalt),
		base64.RawStdEncoding.EncodeToString(minDigest),
	)

	assert.NoError(t, CompareHashAndRecoveryCode(minHash, code))
	assert.ErrorIs(t, CompareHashAndRecoveryCode(minHash, "wrongcodejklmnp27"), ErrRecoveryCodeMismatchedHashAndCode)
}

func TestCompareHashAndRecoveryCodeNegativeExamples(t *testing.T) {
	negativeExamples := []string{
		// argon2i
		"$argon2i$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// argon2d
		"$argon2d$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// v=16
		"$argon2id$v=16$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// data
		"$argon2id$v=19$m=16,t=2,p=1,data=abc$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// keyid
		"$argon2id$v=19$m=16,t=2,p=1,keyid=abc$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// m larger than 32 bits
		"$argon2id$v=19$m=4294967297,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// m exceeds the 1 GiB limit
		"$argon2id$v=19$m=1048577,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// m is 0
		"$argon2id$v=19$m=0,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// m below the minimum of 8 KiB per thread
		"$argon2id$v=19$m=7,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// m below the minimum of 8 KiB per thread at the thread limit
		"$argon2id$v=19$m=127,t=2,p=16$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// t larger than 32 bits
		"$argon2id$v=19$m=16,t=4294967297,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// t is 0
		"$argon2id$v=19$m=16,t=0,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// t exceeds the limit of 20
		"$argon2id$v=19$m=16,t=21,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// p larger than 8 bits
		"$argon2id$v=19$m=16,t=2,p=256$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// p is 0
		"$argon2id$v=19$m=16,t=2,p=0$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// p exceeds the limit of 16
		"$argon2id$v=19$m=16,t=2,p=17$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// salt not base64
		"$argon2id$v=19$m=16,t=2,p=1$!!!$NfEnUOuUpb7F2fQkgFUG4g",
		// salt in the base64 alphabet but not decodable (length % 4 == 1)
		"$argon2id$v=19$m=16,t=2,p=1$AAAAA$NfEnUOuUpb7F2fQkgFUG4g",
		// hash not base64
		"$argon2id$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$!!!",
		// hash in the base64 alphabet but not decodable (length % 4 == 1)
		"$argon2id$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$AAAAA",
		// salt empty
		"$argon2id$v=19$m=16,t=2,p=1$$NfEnUOuUpb7F2fQkgFUG4g",
		// salt of 4 bytes, below the minimum of 8
		"$argon2id$v=19$m=16,t=2,p=1$AAAAAA$NfEnUOuUpb7F2fQkgFUG4g",
		// hash empty
		"$argon2id$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$",
		// hash of 8 bytes, below the minimum of 16
		"$argon2id$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$AAAAAAAAAAA",
		// bcrypt hash
		"$2y$04$mIJxfrCaEI3GukZe11CiXublhEFanu5.ododkll1WphfSp6pn4zIu",
		// not a hash at all
		"not-a-hash",
		// empty string
		"",
	}

	for _, example := range negativeExamples {
		err := CompareHashAndRecoveryCode(example, "test")
		assert.Error(t, err, "expected %q to be rejected", example)
		assert.NotErrorIs(t, err, ErrRecoveryCodeMismatchedHashAndCode, "expected %q to fail parsing, not comparison", example)
	}
}
