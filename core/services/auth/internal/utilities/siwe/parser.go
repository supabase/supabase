package siwe

import (
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
)

// SIWEMessage is the final structured form of a parsed SIWE message.
// REF: https://eips.ethereum.org/EIPS/eip-4361
type SIWEMessage struct {
	Raw string

	Domain         string
	Address        string
	Statement      *string
	URI            url.URL
	Version        string
	ChainID        string
	Nonce          string
	IssuedAt       time.Time
	ExpirationTime *time.Time
	NotBefore      *time.Time
	RequestID      *string
	Resources      []*url.URL
}

const headerSuffix = " wants you to sign in with your Ethereum account:"

var addressPattern = regexp.MustCompile("^0x[a-fA-F0-9]{40}$")

func ParseMessage(raw string) (*SIWEMessage, error) {
	lines := strings.Split(raw, "\n")
	if len(lines) < 6 {
		return nil, ErrMessageTooShort
	}

	// Parse first line exactly
	header := lines[0]
	if !strings.HasSuffix(header, headerSuffix) {
		return nil, ErrInvalidHeader
	}

	domain := strings.TrimSpace(strings.TrimSuffix(header, headerSuffix))
	if !IsValidDomain(domain) {
		return nil, ErrInvalidDomain
	}

	address := strings.TrimSpace(lines[1])
	if !addressPattern.MatchString(address) {
		return nil, ErrInvalidAddress
	}

	msg := &SIWEMessage{
		Raw:     raw,
		Domain:  domain,
		Address: address,
	}

	if lines[2] != "" {
		return nil, ErrThirdLineNotEmpty
	}

	startIndex := 3
	if lines[3] != "" && lines[4] == "" {
		statement := lines[3]
		msg.Statement = &statement
		startIndex = 5
	}

	inResources := false
	for i := startIndex; i < len(lines); i++ {

		line := strings.TrimSpace(lines[i])

		if inResources {
			if after, ok := strings.CutPrefix(line, "- "); ok {
				resource := strings.TrimSpace(after)

				resourceURL, err := url.ParseRequestURI(resource)
				if err != nil {
					return nil, errInvalidResource(len(msg.Resources))
				}

				msg.Resources = append(msg.Resources, resourceURL)
				continue
			} else {
				inResources = false
			}
		}

		if line == "Resources:" {
			inResources = true
			continue
		}

		if line == "" {
			continue
		}

		key, value, found := strings.Cut(line, ":")
		if !found {
			return nil, errUnparsableLine(i)
		}

		value = strings.TrimSpace(value)

		switch key {
		case "URI":
			uri, err := url.ParseRequestURI(value)
			if err != nil {
				return nil, ErrInvalidURI
			}
			msg.URI = *uri

		case "Version":
			msg.Version = value

		case "Chain ID":
			if value == "" || !isValidEthereumNetwork(value) {
				return nil, ErrInvalidChainID
			}
			msg.ChainID = value

		case "Nonce":
			// this is supposed to be REQUIRED >8 chr alphanum but we'll leave it for now for gotrue's nonce impl
			msg.Nonce = value

		case "Issued At":
			ts, err := time.Parse(time.RFC3339, value)
			if err != nil {
				ts, err = time.Parse(time.RFC3339Nano, value)
				if err != nil {
					return nil, ErrInvalidIssuedAt
				}
			}
			if ts.IsZero() {
				return nil, ErrMissingIssuedAt
			}
			msg.IssuedAt = ts

		case "Expiration Time":
			ts, err := time.Parse(time.RFC3339, value)
			if err != nil {
				ts, err = time.Parse(time.RFC3339Nano, value)
				if err != nil {
					return nil, ErrInvalidExpirationTime
				}
			}
			msg.ExpirationTime = &ts

		case "Not Before":
			ts, err := time.Parse(time.RFC3339, value)
			if err != nil {
				ts, err = time.Parse(time.RFC3339Nano, value)
				if err != nil {
					return nil, ErrInvalidNotBefore
				}
			}

			msg.NotBefore = &ts

		case "Request ID":
			// This is supposed to be a pchar (RFC 3986) but generally we'll keep it as any str for now
			msg.RequestID = &value
		}
	}

	if msg.Version != "1" {
		return nil, errUnsupportedVersion(msg.Version)
	}

	if msg.IssuedAt.IsZero() {
		return nil, ErrMissingIssuedAt
	}

	if msg.URI.String() == "" {
		return nil, ErrMissingURI
	}

	if msg.ExpirationTime != nil && !msg.IssuedAt.IsZero() {
		if msg.IssuedAt.After(*msg.ExpirationTime) {
			return nil, ErrIssuedAfterExpiration
		}
	}

	if msg.NotBefore != nil && msg.ExpirationTime != nil {
		if msg.NotBefore.After(*msg.ExpirationTime) {
			return nil, ErrNotBeforeAfterExpiration
		}
	}

	return msg, nil
}

// VerifySignature validates that the signature was created by the private key
// corresponding to the address in the message. This performs ECDSA recovery
// which is computationally expensive, so it should be called only after
// ParseMessage has validated the message structure.
//
// The signature must be a 65-byte hex string in the format: 0x{R}{S}{V}
// where R and S are 32 bytes each and V is 1 byte.
//
// Returns true if the recovered address matches the message address (case-insensitive).
func (m *SIWEMessage) VerifySignature(signatureHex string) bool {
	sig, err := hexutil.Decode(signatureHex)
	if err != nil || len(sig) != 65 {
		// Signature is attacker-controlled request input; a verifier must
		// reject it, not panic (which the API turns into a 500 + stack trace).
		return false
	}

	// Create signature in [R || S || V] format
	signature := make([]byte, 65)
	copy(signature, sig)

	// Normalize V if needed
	// #nosec G602
	if signature[64] >= 27 {
		signature[64] -= 27 // #nosec G602
	}

	hash := accounts.TextHash([]byte(m.Raw))

	// Recover public key
	pubKey, err := crypto.Ecrecover(hash, signature)
	if err != nil {
		// A malformed signature (e.g. an invalid recovery byte) fails recovery;
		// treat it as a non-matching signature rather than panicking.
		return false
	}

	// Convert to address
	recoveredAddr := common.BytesToAddress(crypto.Keccak256(pubKey[1:])[12:])

	return strings.EqualFold(recoveredAddr.Hex(), m.Address)
}
