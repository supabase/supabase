package crypto

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/supabase/auth/internal/observability"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/scrypt"
)

type HashCost = int

const (
	// DefaultHashCost represents the default
	// hashing cost for any hashing algorithm.
	DefaultHashCost HashCost = iota

	// QuickHashCosts represents the quickest
	// hashing cost for any hashing algorithm,
	// useful for tests only.
	QuickHashCost HashCost = iota

	Argon2Prefix         = "$argon2"
	FirebaseScryptPrefix = "$fbscrypt"
	FirebaseScryptKeyLen = 32 // Firebase uses AES-256 which requires 32 byte keys: https://pkg.go.dev/golang.org/x/crypto/scrypt#Key
)

// PasswordHashCost is the current pasword hashing cost
// for all new hashes generated with
// GenerateHashFromPassword.
var PasswordHashCost = DefaultHashCost

var (
	generateFromPasswordSubmittedCounter = observability.ObtainMetricCounter("gotrue_generate_from_password_submitted", "Number of submitted GenerateFromPassword hashing attempts")
	generateFromPasswordCompletedCounter = observability.ObtainMetricCounter("gotrue_generate_from_password_completed", "Number of completed GenerateFromPassword hashing attempts")
)

var (
	compareHashAndPasswordSubmittedCounter = observability.ObtainMetricCounter("gotrue_compare_hash_and_password_submitted", "Number of submitted CompareHashAndPassword hashing attempts")
	compareHashAndPasswordCompletedCounter = observability.ObtainMetricCounter("gotrue_compare_hash_and_password_completed", "Number of completed CompareHashAndPassword hashing attempts")
)

var ErrArgon2MismatchedHashAndPassword = errors.New("crypto: argon2 hash and password mismatch")
var ErrScryptMismatchedHashAndPassword = errors.New("crypto: fbscrypt hash and password mismatch")

// argon2HashRegexp https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md#argon2-encoding
var argon2HashRegexp = regexp.MustCompile("^[$](?P<alg>argon2(d|i|id))[$]v=(?P<v>(16|19))[$]m=(?P<m>[0-9]+),t=(?P<t>[0-9]+),p=(?P<p>[0-9]+)(,keyid=(?P<keyid>[^,$]+))?(,data=(?P<data>[^$]+))?[$](?P<salt>[^$]*)[$](?P<hash>.*)$")
var fbscryptHashRegexp = regexp.MustCompile(`^\$fbscrypt\$v=(?P<v>[0-9]+),n=(?P<n>[0-9]+),r=(?P<r>[0-9]+),p=(?P<p>[0-9]+)(?:,ss=(?P<ss>[^,]+))?(?:,sk=(?P<sk>[^$]+))?\$(?P<salt>[^$]+)\$(?P<hash>.+)$`)

type Argon2HashInput struct {
	alg     string
	v       string
	memory  uint64
	time    uint64
	threads uint64
	keyid   string
	data    string
	salt    []byte
	rawHash []byte
}

type FirebaseScryptHashInput struct {
	v             string
	memory        uint64
	rounds        uint64
	threads       uint64
	saltSeparator []byte
	signerKey     []byte
	salt          []byte
	rawHash       []byte
}

// See: https://github.com/firebase/scrypt for implementation
func ParseFirebaseScryptHash(hash string) (*FirebaseScryptHashInput, error) {
	submatch := fbscryptHashRegexp.FindStringSubmatchIndex(hash)
	if submatch == nil {
		return nil, errors.New("crypto: incorrect scrypt hash format")
	}

	v := string(fbscryptHashRegexp.ExpandString(nil, "$v", hash, submatch))
	n := string(fbscryptHashRegexp.ExpandString(nil, "$n", hash, submatch))
	r := string(fbscryptHashRegexp.ExpandString(nil, "$r", hash, submatch))
	p := string(fbscryptHashRegexp.ExpandString(nil, "$p", hash, submatch))
	ss := string(fbscryptHashRegexp.ExpandString(nil, "$ss", hash, submatch))
	sk := string(fbscryptHashRegexp.ExpandString(nil, "$sk", hash, submatch))
	saltB64 := string(fbscryptHashRegexp.ExpandString(nil, "$salt", hash, submatch))
	hashB64 := string(fbscryptHashRegexp.ExpandString(nil, "$hash", hash, submatch))

	if v != "1" {
		return nil, fmt.Errorf("crypto: Firebase scrypt hash uses unsupported version %q only version 1 is supported", v)
	}
	memoryPower, err := strconv.ParseUint(n, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("crypto: Firebase scrypt hash has invalid n parameter %q %w", n, err)
	}
	if memoryPower == 0 {
		return nil, fmt.Errorf("crypto: Firebase scrypt hash has invalid n=0")
	}
	rounds, err := strconv.ParseUint(r, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("crypto: Firebase scrypt hash has invalid r parameter %q: %w", r, err)
	}
	if rounds == 0 {
		return nil, fmt.Errorf("crypto: Firebase scrypt hash has invalid r=0")
	}

	threads, err := strconv.ParseUint(p, 10, 8)
	if err != nil {
		return nil, fmt.Errorf("crypto: Firebase scrypt hash has invalid p parameter %q %w", p, err)
	}
	if threads == 0 {
		return nil, fmt.Errorf("crypto: Firebase scrypt hash has invalid p=0")
	}

	rawHash, err := base64.StdEncoding.DecodeString(hashB64)
	if err != nil {
		return nil, fmt.Errorf("crypto: Firebase scrypt hash has invalid base64 in the hash section %w", err)
	}

	salt, err := base64.StdEncoding.DecodeString(saltB64)
	if err != nil {
		return nil, fmt.Errorf("crypto: Firebase scrypt salt has invalid base64 in the hash section %w", err)
	}

	var saltSeparator, signerKey []byte
	if signerKey, err = base64.StdEncoding.DecodeString(sk); err != nil {
		return nil, err
	}
	if saltSeparator, err = base64.StdEncoding.DecodeString(ss); err != nil {
		return nil, err
	}

	input := &FirebaseScryptHashInput{
		v:             v,
		memory:        uint64(1) << memoryPower,
		rounds:        rounds,
		threads:       threads,
		salt:          salt,
		rawHash:       rawHash,
		saltSeparator: saltSeparator,
		signerKey:     signerKey,
	}

	return input, nil
}

func ParseArgon2Hash(hash string) (*Argon2HashInput, error) {
	submatch := argon2HashRegexp.FindStringSubmatchIndex(hash)
	if submatch == nil {
		return nil, errors.New("crypto: incorrect argon2 hash format")
	}

	alg := string(argon2HashRegexp.ExpandString(nil, "$alg", hash, submatch))
	v := string(argon2HashRegexp.ExpandString(nil, "$v", hash, submatch))
	m := string(argon2HashRegexp.ExpandString(nil, "$m", hash, submatch))
	t := string(argon2HashRegexp.ExpandString(nil, "$t", hash, submatch))
	p := string(argon2HashRegexp.ExpandString(nil, "$p", hash, submatch))
	keyid := string(argon2HashRegexp.ExpandString(nil, "$keyid", hash, submatch))
	data := string(argon2HashRegexp.ExpandString(nil, "$data", hash, submatch))
	saltB64 := string(argon2HashRegexp.ExpandString(nil, "$salt", hash, submatch))
	hashB64 := string(argon2HashRegexp.ExpandString(nil, "$hash", hash, submatch))

	if alg != "argon2i" && alg != "argon2id" {
		return nil, fmt.Errorf("crypto: argon2 hash uses unsupported algorithm %q only argon2i and argon2id supported", alg)
	}

	if v != "19" {
		return nil, fmt.Errorf("crypto: argon2 hash uses unsupported version %q only %d is supported", v, argon2.Version)
	}

	if data != "" {
		return nil, fmt.Errorf("crypto: argon2 hashes with the data parameter not supported")
	}

	if keyid != "" {
		return nil, fmt.Errorf("crypto: argon2 hashes with the keyid parameter not supported")
	}

	memory, err := strconv.ParseUint(m, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("crypto: argon2 hash has invalid m parameter %q %w", m, err)
	}
	if memory > 1024*1024 { // 1 GiB in KiB
		return nil, fmt.Errorf("crypto: argon2 hash has m parameter %d exceeds memory limit", memory)
	}

	time, err := strconv.ParseUint(t, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("crypto: argon2 hash has invalid t parameter %q %w", t, err)
	}
	if time > 20 {
		return nil, fmt.Errorf("crypto: argon2 hash has t parameter %d exceeds time limit", time)
	}

	threads, err := strconv.ParseUint(p, 10, 8)
	if err != nil {
		return nil, fmt.Errorf("crypto: argon2 hash has invalid p parameter %q %w", p, err)
	}
	if threads > 16 {
		return nil, fmt.Errorf("crypto: argon2 hash has p parameter %d exceeds thread limit", threads)
	}

	rawHash, err := base64.RawStdEncoding.DecodeString(hashB64)
	if err != nil {
		return nil, fmt.Errorf("crypto: argon2 hash has invalid base64 in the hash section %w", err)
	}
	if len(rawHash) == 0 {
		return nil, errors.New("crypto: argon2 hash is empty")
	}

	salt, err := base64.RawStdEncoding.DecodeString(saltB64)
	if err != nil {
		return nil, fmt.Errorf("crypto: argon2 hash has invalid base64 in the salt section %w", err)
	}
	if len(salt) == 0 {
		return nil, errors.New("crypto: argon2 salt is empty")
	}

	input := Argon2HashInput{
		alg:     alg,
		v:       v,
		memory:  memory,
		time:    time,
		threads: threads,
		keyid:   keyid,
		data:    data,
		salt:    salt,
		rawHash: rawHash,
	}

	return &input, nil
}

func compareHashAndPasswordArgon2(ctx context.Context, hash, password string) error {
	input, err := ParseArgon2Hash(hash)
	if err != nil {
		return err
	}

	attributes := []attribute.KeyValue{
		attribute.String("alg", input.alg),
		attribute.String("v", input.v),
		attribute.Int64("m", int64(input.memory)),
		attribute.Int64("t", int64(input.time)),
		attribute.Int("p", int(input.threads)),
		attribute.Int("len", len(input.rawHash)),
	} // #nosec G115

	var match bool
	var derivedKey []byte
	compareHashAndPasswordSubmittedCounter.Add(ctx, 1, metric.WithAttributes(attributes...))
	defer func() {
		attributes = append(attributes, attribute.Bool(
			"match",
			match,
		))

		compareHashAndPasswordCompletedCounter.Add(ctx, 1, metric.WithAttributes(attributes...))
	}()

	switch input.alg {
	case "argon2i":
		derivedKey = argon2.Key([]byte(password), input.salt, uint32(input.time), uint32(input.memory), uint8(input.threads), uint32(len(input.rawHash))) // #nosec G115

	case "argon2id":
		derivedKey = argon2.IDKey([]byte(password), input.salt, uint32(input.time), uint32(input.memory), uint8(input.threads), uint32(len(input.rawHash))) // #nosec G115
	}

	match = subtle.ConstantTimeCompare(derivedKey, input.rawHash) == 1

	if !match {
		return ErrArgon2MismatchedHashAndPassword
	}

	return nil
}

func compareHashAndPasswordFirebaseScrypt(ctx context.Context, hash, password string) error {
	input, err := ParseFirebaseScryptHash(hash)
	if err != nil {
		return err
	}

	attributes := []attribute.KeyValue{
		attribute.String("v", input.v),
		attribute.Int64("n", int64(input.memory)),
		attribute.Int64("r", int64(input.rounds)),
		attribute.Int("p", int(input.threads)),
		attribute.Int("len", len(input.rawHash)),
	} // #nosec G115

	var match bool
	compareHashAndPasswordSubmittedCounter.Add(ctx, 1, metric.WithAttributes(attributes...))
	defer func() {
		attributes = append(attributes, attribute.Bool("match", match))
		compareHashAndPasswordCompletedCounter.Add(ctx, 1, metric.WithAttributes(attributes...))
	}()

	derivedKey := firebaseScrypt([]byte(password), input.salt, input.signerKey, input.saltSeparator, input.memory, input.rounds, input.threads)

	match = subtle.ConstantTimeCompare(derivedKey, input.rawHash) == 1
	if !match {
		return ErrScryptMismatchedHashAndPassword
	}

	return nil
}

func firebaseScrypt(password, salt, signerKey, saltSeparator []byte, memCost, rounds, p uint64) []byte {
	ck := must(scrypt.Key(password, append(salt, saltSeparator...), int(memCost), int(rounds), int(p), FirebaseScryptKeyLen)) // #nosec G115
	block := must(aes.NewCipher(ck))

	cipherText := make([]byte, aes.BlockSize+len(signerKey))

	// #nosec G407 -- Firebase scrypt requires deterministic IV for consistent results. See: JaakkoL/firebase-scrypt-python@master/firebasescrypt/firebasescrypt.py#L58
	stream := cipher.NewCTR(block, cipherText[:aes.BlockSize])
	stream.XORKeyStream(cipherText[aes.BlockSize:], signerKey)

	return cipherText[aes.BlockSize:]
}

// CompareHashAndPassword compares the hash and
// password, returns nil if equal otherwise an error. Context can be used to
// cancel the hashing if the algorithm supports it.
func CompareHashAndPassword(ctx context.Context, hash, password string) error {
	if strings.HasPrefix(hash, Argon2Prefix) {
		return compareHashAndPasswordArgon2(ctx, hash, password)
	} else if strings.HasPrefix(hash, FirebaseScryptPrefix) {
		return compareHashAndPasswordFirebaseScrypt(ctx, hash, password)
	}

	// assume bcrypt
	hashCost, err := bcrypt.Cost([]byte(hash))
	if err != nil {
		return err
	}

	attributes := []attribute.KeyValue{
		attribute.String("alg", "bcrypt"),
		attribute.Int("bcrypt_cost", hashCost),
	}

	compareHashAndPasswordSubmittedCounter.Add(ctx, 1, metric.WithAttributes(attributes...))
	defer func() {
		attributes = append(attributes, attribute.Bool(
			"match",
			!errors.Is(err, bcrypt.ErrMismatchedHashAndPassword),
		))

		compareHashAndPasswordCompletedCounter.Add(ctx, 1, metric.WithAttributes(attributes...))
	}()

	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err
}

// GenerateFromPassword generates a password hash from a
// password, using PasswordHashCost. Context can be used to cancel the hashing
// if the algorithm supports it.
func GenerateFromPassword(ctx context.Context, password string) (string, error) {
	hashCost := bcrypt.DefaultCost

	switch PasswordHashCost {
	case QuickHashCost:
		hashCost = bcrypt.MinCost
	}

	attributes := []attribute.KeyValue{
		attribute.String("alg", "bcrypt"),
		attribute.Int("bcrypt_cost", hashCost),
	}

	generateFromPasswordSubmittedCounter.Add(ctx, 1, metric.WithAttributes(attributes...))
	defer generateFromPasswordCompletedCounter.Add(ctx, 1, metric.WithAttributes(attributes...))

	hash := must(bcrypt.GenerateFromPassword([]byte(password), hashCost))

	return string(hash), nil
}

func GeneratePassword(requiredChars []string, length int) string {
	passwordBuilder := strings.Builder{}
	passwordBuilder.Grow(length)

	// Add required characters
	for _, group := range requiredChars {
		if len(group) > 0 {
			randomIndex := secureRandomInt(len(group))

			passwordBuilder.WriteByte(group[randomIndex])
		}
	}

	// Define a default character set for random generation (if needed)
	const allChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	// Fill the rest of the password
	for passwordBuilder.Len() < length {
		randomIndex := secureRandomInt(len(allChars))
		passwordBuilder.WriteByte(allChars[randomIndex])
	}

	// Convert to byte slice for shuffling
	passwordBytes := []byte(passwordBuilder.String())

	// Secure shuffling
	for i := len(passwordBytes) - 1; i > 0; i-- {
		j := secureRandomInt(i + 1)

		passwordBytes[i], passwordBytes[j] = passwordBytes[j], passwordBytes[i]
	}

	return string(passwordBytes)
}
