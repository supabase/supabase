package siwe

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseMessage(t *testing.T) {
	negativeExamples := []struct {
		example string
		error   error
	}{
		{
			example: "",
			error:   ErrMessageTooShort,
		},
		{
			example: "\n\n\n\n",
			error:   ErrMessageTooShort,
		},
		{
			example: "domain.com whatever\n\n\n\n\n\n",
			error:   ErrInvalidHeader,
		},
		{
			example: "******* wants you to sign in with your Ethereum account:\n\n\n\n\n\n",
			error:   ErrInvalidDomain,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n***************************************\n\n\n\n\n",
			error:   ErrInvalidAddress,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\nURI: https://google.com\n\n\n",
			error:   ErrThirdLineNotEmpty,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nNot Parsable\n",
			error:   errUnparsableLine(5),
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nURI: ***\nIssued At: 2025-01-01T00:00:00Z",
			error:   ErrInvalidURI,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nURI: https://google.com\nIssued At: not-a-timestamp",
			error:   ErrInvalidIssuedAt,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nURI: https://google.com\nIssued At: 2025-01-01T00:00:00Z\nExpiration Time: not-a-timestamp",
			error:   ErrInvalidExpirationTime,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nURI: https://google.com\nIssued At: 2025-01-01T00:00:00Z\nNot Before: not-a-timestamp",
			error:   ErrInvalidNotBefore,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 2\nIssued At: 2025-01-01T00:00:00Z\nURI: https://google.com\n",
			error:   errUnsupportedVersion("2"),
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nIssued At: 2025-01-01T00:00:00Z\n\n",
			error:   ErrMissingURI,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nResources:\n- https://google.com\n",
			error:   ErrMissingIssuedAt,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-02T00:00:00Z\nExpiration Time: 2025-01-01T00:00:00Z\n",
			error:   ErrIssuedAfterExpiration,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-01T00:00:00Z\nExpiration Time: 2025-01-02T00:00:00Z\nNot Before: 2025-01-03T00:00:00Z\n",
			error:   ErrNotBeforeAfterExpiration,
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-01T00:00:00Z\nResources:\n- https://google.com\n- ***\n",
			error:   errInvalidResource(1),
		},
		{
			example: "domain.com wants you to sign in with your Ethereum account:\n0x742d35Cc6635C0532925a3b8D53d6e8b3f56ddF1\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-01T00:00:00Z\nChain ID: random:mainnet",
			error:   ErrInvalidChainID,
		},
	}

	for i, example := range negativeExamples {
		_, err := ParseMessage(example.example)

		t.Run(fmt.Sprintf("negative example %d", i), func(t *testing.T) {
			require.NotNil(t, err)
			require.Equal(t, example.error.Error(), err.Error())
		})
	}

	positiveExamples := []struct {
		message   string
		signature string
	}{
		{
			message:   "example.com wants you to sign in with your Ethereum account:\n0x196a28d05bA75C8dC35B0F6e71DD622D1aC82b7E\n\nSign in to Example App\n\nURI: https://example.com\nVersion: 1\nChain ID: 1\nNonce: 12345678\nIssued At: 2025-01-01T00:00:00.000Z",
			signature: "0xee337880f195524c156b8cc5f425ffcedb9d94638a91fa41ba72e26d93f04c9d1c7bca7020071c34ef7527ed6389ee24b59de79deab4e9e8251e6ca1e195a56a1b",
		},
		// Address: 0x196a28d05bA75C8dC35B0F6e71DD622D1aC82b7E
		{
			message:   "example.com wants you to sign in with your Ethereum account:\n0x196a28d05bA75C8dC35B0F6e71DD622D1aC82b7E\n\nURI: https://example.com\nVersion: 1\nChain ID: 1\nNonce: 12345678\nIssued At: 2025-01-01T00:00:00.000Z",
			signature: "0x0851224c203d08ced345bc99e66ac531eafbbb54eff94f7297b54ec19a0db7e879c4d246d45e0e13c9c2801db1f71f283c373b8c10cc0a91fe6418220a0aa5391b",
		},
	}

	for i, example := range positiveExamples {
		t.Run(fmt.Sprintf("positive example %d", i), func(t *testing.T) {
			parsed, err := ParseMessage(example.message)

			require.Nil(t, err)
			require.Equal(t, "example.com", parsed.Domain)
			require.Equal(t, "0x196a28d05bA75C8dC35B0F6e71DD622D1aC82b7E", parsed.Address)

			if i == 0 {
				require.Equal(t, "Sign in to Example App", *parsed.Statement)
			} else {
				require.Nil(t, parsed.Statement)
			}

			require.Equal(t, "2025-01-01 00:00:00 +0000 UTC", parsed.IssuedAt.String())
			require.Equal(t, "https://example.com", parsed.URI.String())
			require.Equal(t, "1", parsed.ChainID)
			require.Equal(t, "12345678", parsed.Nonce)
			// require.Equal(t, "abcdef", *parsed.RequestID)

			require.Equal(t, true, parsed.VerifySignature((example.signature)))
		})
	}
}

// VerifySignature receives an attacker-controlled signature (via POST /token
// grant_type=web3). It must return false for malformed input, not panic — a
// panic is turned into an HTTP 500 + stack-trace log instead of the intended
// clean 400. The sibling internal/utilities/siws implementation is the
// reference: it returns false on every error path.
func TestVerifySignatureRejectsMalformedInput(t *testing.T) {
	message := "example.com wants you to sign in with your Ethereum account:\n0x196a28d05bA75C8dC35B0F6e71DD622D1aC82b7E\n\nURI: https://example.com\nVersion: 1\nChain ID: 1\nNonce: 12345678\nIssued At: 2025-01-01T00:00:00.000Z"
	parsed, err := ParseMessage(message)
	require.Nil(t, err)

	malformed := []struct {
		name      string
		signature string
	}{
		{"empty", ""},
		// 130 hex chars but no 0x prefix -> hexutil.Decode errors (previously panicked).
		{"missing 0x prefix", strings.Repeat("a", 130)},
		// non-hex characters after the prefix -> decode errors.
		{"non-hex characters", "0x" + strings.Repeat("z", 130)},
		// decodes fine but is not 65 bytes.
		{"wrong length", "0xdeadbeef"},
		// valid 65-byte hex but unrecoverable -> crypto.Ecrecover errors (previously panicked).
		{"unrecoverable signature", "0x" + strings.Repeat("0", 130)},
	}
	for _, tc := range malformed {
		t.Run(tc.name, func(t *testing.T) {
			require.NotPanics(t, func() {
				require.False(t, parsed.VerifySignature(tc.signature))
			})
		})
	}
}
