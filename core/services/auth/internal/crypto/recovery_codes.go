package crypto

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"
	"unicode"

	"golang.org/x/crypto/argon2"
)

// Recovery codes use the base32 alphabet (RFC 4648, lowercased) to
// avoid ambiguous characters (0/O, 1/I/L). Canonical form is lowercase.
const recoveryCodeAlphabet = "abcdefghijklmnopqrstuvwxyz234567"

// argon2id parameters for newly generated recovery-code hashes. Verification reads
// the parameters from the stored hash, so these can change without breaking existing codes.
const (
	recoveryCodeArgon2idMemoryKiB   uint32 = 19456
	recoveryCodeArgon2idIterations  uint32 = 2
	recoveryCodeArgon2idParallelism uint8  = 1
	recoveryCodeArgon2idSaltLength         = 16
	recoveryCodeArgon2idKeyLength   uint32 = 32
)

var ErrRecoveryCodeMismatchedHashAndCode = errors.New("crypto: recovery code hash and code mismatch")

// Strict PHC subset for recovery-code hashes: argon2id only, version 19 only,
// no keyid/data extensions, unpadded standard base64.
var recoveryCodeHashRegexp = regexp.MustCompile(`^\$argon2id\$v=19\$m=(?P<m>[0-9]+),t=(?P<t>[0-9]+),p=(?P<p>[0-9]+)\$(?P<salt>[A-Za-z0-9+/]+)\$(?P<hash>[A-Za-z0-9+/]+)$`)

// GenerateRecoveryCode generates a random recovery code of length characters
// from the lowercase base32 alphabet.
func GenerateRecoveryCode(length int) string {
	code := strings.Builder{}
	code.Grow(length)

	for range length {
		code.WriteByte(recoveryCodeAlphabet[secureRandomInt(len(recoveryCodeAlphabet))])
	}

	return code.String()
}

// NormalizeRecoveryCode converts user input to the canonical form a recovery
// code is hashed in: all whitespace and hyphen separators stripped, lowercase.
func NormalizeRecoveryCode(input string) string {
	stripped := strings.Map(func(r rune) rune {
		if r == '-' || unicode.IsSpace(r) {
			return -1
		}
		return r
	}, input)

	return strings.ToLower(stripped)
}

// GenerateRecoveryCodeHash hashes a recovery code with argon2id and a random salt,
// returning a PHC string of the form $argon2id$v=19$m=19456,t=2,p=1$<salt>$<digest>
func GenerateRecoveryCodeHash(code string) (string, error) {
	salt := make([]byte, recoveryCodeArgon2idSaltLength)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return "", err
	}

	digest := argon2.IDKey(
		[]byte(code),
		salt,
		recoveryCodeArgon2idIterations,
		recoveryCodeArgon2idMemoryKiB,
		recoveryCodeArgon2idParallelism,
		recoveryCodeArgon2idKeyLength,
	)

	return fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		recoveryCodeArgon2idMemoryKiB,
		recoveryCodeArgon2idIterations,
		recoveryCodeArgon2idParallelism,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(digest),
	), nil
}

// CompareHashAndRecoveryCode compares a stored recovery-code hash with a
// candidate code, returning nil if they match and ErrRecoveryCodeMismatchedHashAndCode otherwise.
func CompareHashAndRecoveryCode(hash, code string) error {
	submatch := recoveryCodeHashRegexp.FindStringSubmatchIndex(hash)
	if submatch == nil {
		return errors.New("crypto: incorrect recovery code hash format")
	}

	m := string(recoveryCodeHashRegexp.ExpandString(nil, "$m", hash, submatch))
	t := string(recoveryCodeHashRegexp.ExpandString(nil, "$t", hash, submatch))
	p := string(recoveryCodeHashRegexp.ExpandString(nil, "$p", hash, submatch))
	saltB64 := string(recoveryCodeHashRegexp.ExpandString(nil, "$salt", hash, submatch))
	hashB64 := string(recoveryCodeHashRegexp.ExpandString(nil, "$hash", hash, submatch))

	memory, err := strconv.ParseUint(m, 10, 32)
	if err != nil {
		return fmt.Errorf("crypto: recovery code hash has invalid m parameter %q %w", m, err)
	}
	if memory > 1024*1024 { // 1 GiB in KiB
		return fmt.Errorf("crypto: recovery code hash has m parameter %d exceeds memory limit", memory)
	}

	time, err := strconv.ParseUint(t, 10, 32)
	if err != nil {
		return fmt.Errorf("crypto: recovery code hash has invalid t parameter %q %w", t, err)
	}
	if time == 0 || time > 20 {
		return fmt.Errorf("crypto: recovery code hash has t parameter %d outside time limits", time)
	}

	threads, err := strconv.ParseUint(p, 10, 8)
	if err != nil {
		return fmt.Errorf("crypto: recovery code hash has invalid p parameter %q %w", p, err)
	}
	if threads == 0 || threads > 16 {
		return fmt.Errorf("crypto: recovery code hash has p parameter %d outside thread limits", threads)
	}

	if memory < 8*threads { // RFC 9106 requires at least 8 KiB of memory per thread
		return fmt.Errorf("crypto: recovery code hash has m parameter %d below memory minimum", memory)
	}

	salt, err := base64.RawStdEncoding.DecodeString(saltB64)
	if err != nil {
		return fmt.Errorf("crypto: recovery code hash has invalid base64 in the salt section %w", err)
	}
	if len(salt) < 8 { // RFC 9106 minimum salt length for password hashing
		return fmt.Errorf("crypto: recovery code hash has salt of %d bytes below length minimum", len(salt))
	}

	rawHash, err := base64.RawStdEncoding.DecodeString(hashB64)
	if err != nil {
		return fmt.Errorf("crypto: recovery code hash has invalid base64 in the hash section %w", err)
	}
	if len(rawHash) < 16 { // short digests weaken the constant-time comparison below
		return fmt.Errorf("crypto: recovery code hash has digest of %d bytes below length minimum", len(rawHash))
	}

	derivedKey := argon2.IDKey([]byte(code), salt, uint32(time), uint32(memory), uint8(threads), uint32(len(rawHash))) // #nosec G115

	if subtle.ConstantTimeCompare(derivedKey, rawHash) != 1 {
		return ErrRecoveryCodeMismatchedHashAndCode
	}

	return nil
}
