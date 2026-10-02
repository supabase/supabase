package crypto

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"math"

	"github.com/gofrs/uuid"
)

func GenerateRefreshTokenHmacKey() []byte {
	key := make([]byte, 32)
	must(rand.Read(key))

	return key
}

const refreshTokenChecksumLength = 4
const refreshTokenSignatureLength = 16
const minRefreshTokenLength = 1 + 16 + 1 + refreshTokenSignatureLength + refreshTokenChecksumLength
const maxRefreshTokenLength = minRefreshTokenLength + 8

// RefreshToken is an object that encodes a cryptographically authenticated
// (signed) message containing a version, session ID and monotonically
// increasing non-negative counter.
//
// The signature is a truncated (first 128 bits) of HMAC-SHA-256, which saves
// on encoded length without sacrificing security. The checksum of 4 bytes at
// the end is to lessen the load on the server with invalid strings (those that
// are not likely to be a proper refresh token).
type RefreshToken struct {
	Raw []byte

	Version   byte
	SessionID uuid.UUID
	Counter   int64
	Signature []byte
}

func (RefreshToken) TableName() string {
	panic("crypto.RefreshToken is not meant to be saved in the database")
}

func (r *RefreshToken) CheckSignature(hmacSha256Key []byte) bool {
	bytes := r.Raw[:len(r.Raw)-refreshTokenSignatureLength-refreshTokenChecksumLength]

	h := hmac.New(sha256.New, hmacSha256Key)
	h.Write(bytes)
	signature := h.Sum(nil)[:refreshTokenSignatureLength]

	return hmac.Equal(signature, r.Signature)
}

func (r *RefreshToken) Encode(hmacSha256Key []byte) string {
	result := make([]byte, 0, maxRefreshTokenLength)

	result = append(result, 0)
	result = append(result, r.SessionID.Bytes()...)
	result = binary.AppendUvarint(result, safeUint64(r.Counter))

	// Note on truncating the HMAC-SHA-256 output:
	// This does not impact security as the brute-force space is 2^128 and
	// the collision space is 2^64, both unattainable in practice.

	h := hmac.New(sha256.New, hmacSha256Key)
	h.Write(result)
	signature := h.Sum(nil)[:refreshTokenSignatureLength]

	result = append(result, signature...)

	checksum := sha256.Sum256(result)
	result = append(result, checksum[:refreshTokenChecksumLength]...)

	r.Version = 0
	r.Raw = result
	r.Signature = signature

	return base64.RawURLEncoding.EncodeToString(result)
}

var (
	ErrRefreshTokenLength          = errors.New("crypto: refresh token length is not valid")
	ErrRefreshTokenUnknownVersion  = errors.New("crypto: refresh token version is not 0")
	ErrRefreshTokenChecksumInvalid = errors.New("crypto: refresh token checksum is not valid")
	ErrRefreshTokenCounterInvalid  = errors.New("crypto: refresh token's counter is not valid")
)

func safeInt64(v uint64) int64 {
	if v > math.MaxInt64 {
		return math.MaxInt64
	}

	return int64(v)
}

func safeUint64(v int64) uint64 {
	if v < 0 {
		return 0
	}

	return uint64(v)
}

func ParseRefreshToken(token string) (*RefreshToken, error) {
	bytes, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil {
		return nil, err
	}

	if len(bytes) < minRefreshTokenLength {
		return nil, ErrRefreshTokenLength
	}

	if bytes[0] != 0 {
		return nil, ErrRefreshTokenUnknownVersion
	}

	parseFrom := bytes[1 : len(bytes)-refreshTokenChecksumLength]

	checksum256 := sha256.Sum256(bytes[:len(bytes)-refreshTokenChecksumLength])
	if subtle.ConstantTimeCompare(checksum256[:refreshTokenChecksumLength], bytes[len(bytes)-refreshTokenChecksumLength:]) != 1 {
		return nil, ErrRefreshTokenChecksumInvalid
	}

	sessionID := uuid.FromBytesOrNil(parseFrom[0:16])

	parseFrom = parseFrom[16:]

	counter, counterBytes := binary.Uvarint(parseFrom)
	if counterBytes <= 0 {
		return nil, ErrRefreshTokenCounterInvalid
	}

	parseFrom = parseFrom[counterBytes:]

	if len(parseFrom) != 16 {
		return nil, ErrRefreshTokenLength
	}

	signature := parseFrom

	return &RefreshToken{
		Raw: bytes,

		Version:   0,
		SessionID: sessionID,
		Counter:   safeInt64(counter),
		Signature: signature,
	}, nil
}
