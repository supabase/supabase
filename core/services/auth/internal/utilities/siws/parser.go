package siws

import (
	"bytes"
	"crypto/ed25519"
	"encoding/binary"
	"math"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/btcsuite/btcutil/base58"
)

// SIWSMessage is the final structured form of a parsed SIWS message.
type SIWSMessage struct {
	Raw string

	Domain         string
	Address        string
	Statement      string
	URI            *url.URL
	Version        string
	Nonce          string
	IssuedAt       time.Time
	ChainID        string
	NotBefore      time.Time
	RequestID      string
	ExpirationTime time.Time
	Resources      []*url.URL
}

const headerSuffix = " wants you to sign in with your Solana account:"

var addressPattern = regexp.MustCompile("^[a-zA-Z0-9]{32,44}$")

func ParseMessage(raw string) (*SIWSMessage, error) {
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

	msg := &SIWSMessage{
		Raw:     raw,
		Domain:  domain,
		Address: address,
	}

	if lines[2] != "" {
		return nil, ErrThirdLineNotEmpty
	}

	startIndex := 3
	if lines[3] != "" && lines[4] == "" {
		msg.Statement = lines[3]
		startIndex = 5
	}

	inResources := false
	for i := startIndex; i < len(lines); i += 1 {
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

			msg.URI = uri

		case "Version":
			msg.Version = value

		case "Chain ID":
			if value != "" && !IsValidSolanaNetwork(value) {
				return nil, ErrInvalidChainID
			}
			msg.ChainID = value

		case "Nonce":
			msg.Nonce = value

		case "Issued At":
			ts, err := time.Parse(time.RFC3339, value)
			if err != nil {
				ts, err = time.Parse(time.RFC3339Nano, value)
				if err != nil {
					return nil, ErrInvalidIssuedAt
				}
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
			msg.ExpirationTime = ts

		case "Not Before":
			ts, err := time.Parse(time.RFC3339, value)
			if err != nil {
				ts, err = time.Parse(time.RFC3339Nano, value)
				if err != nil {
					return nil, ErrInvalidNotBefore
				}
			}
			msg.NotBefore = ts

		case "Request ID":
			msg.RequestID = value
		}
	}

	if msg.Version != "1" {
		return nil, errUnsupportedVersion(msg.Version)
	}

	if msg.IssuedAt.IsZero() {
		return nil, ErrMissingIssuedAt
	}

	if msg.URI == nil {
		return nil, ErrMissingURI
	}

	if !msg.IssuedAt.IsZero() && !msg.ExpirationTime.IsZero() {
		if msg.IssuedAt.After(msg.ExpirationTime) {
			return nil, ErrIssuedAfterExpiration
		}
	}

	if !msg.NotBefore.IsZero() && !msg.ExpirationTime.IsZero() {
		if msg.NotBefore.After(msg.ExpirationTime) {
			return nil, ErrNotBeforeAfterExpiration
		}
	}

	return msg, nil
}

func (m *SIWSMessage) VerifySignature(signature []byte) bool {
	pubKey := base58.Decode(m.Address)
	raw := []byte(m.Raw)

	// try to verify just the signed message (in accordance with https://github.com/phantom/sign-in-with-solana
	if ed25519.Verify(pubKey, raw, signature) {
		return true
	}

	// if that didn't work, try to verify the signed message as if it was signed via Ledger (https://docs.anza.xyz/proposals/off-chain-message-signing)
	var buffer bytes.Buffer

	// Write 16-byte prefix
	buffer.WriteByte(0xff)
	buffer.WriteString("solana offchain")

	// Write single-byte fields
	buffer.WriteByte(0x00) // version

	// Write domain, padded/truncated to 32 bytes
	domain := make([]byte, 32)
	copy(domain, m.Domain)
	buffer.Write(domain)

	buffer.WriteByte(0x00) // message format = ascii
	buffer.WriteByte(0x01) // signer num = 1

	// Write pubkey
	buffer.Write(pubKey)

	// Write message length (2 bytes, little endian)
	var rawMsgLen = len(raw)
	if rawMsgLen > math.MaxUint16 {
		return false
	}

	if err := binary.Write(&buffer, binary.LittleEndian, uint16(rawMsgLen)); err != nil {
		return false
	}

	// Write message
	buffer.Write(raw)

	return ed25519.Verify(pubKey, buffer.Bytes(), signature)
}
