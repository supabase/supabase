package siws

import (
	"fmt"
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
			example: "******* wants you to sign in with your Solana account:\n\n\n\n\n\n",
			error:   ErrInvalidDomain,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n***************************************\n\n\n\n\n",
			error:   ErrInvalidAddress,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\nURI: https://google.com\n\n\n",
			error:   ErrThirdLineNotEmpty,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nNot Parsable\n",
			error:   errUnparsableLine(5),
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: ***\nIssued At: 2025-01-01T00:00:00Z",
			error:   ErrInvalidURI,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: https://google.com\nIssued At: not-a-timestamp",
			error:   ErrInvalidIssuedAt,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: https://google.com\nIssued At: 2025-01-01T00:00:00Z\nExpiration Time: not-a-timestamp",
			error:   ErrInvalidExpirationTime,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: https://google.com\nIssued At: 2025-01-01T00:00:00Z\nNot Before: not-a-timestamp",
			error:   ErrInvalidNotBefore,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 2\nIssued At: 2025-01-01T00:00:00Z\nURI: https://google.com\n",
			error:   errUnsupportedVersion("2"),
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nIssued At: 2025-01-01T00:00:00Z\n\n",
			error:   ErrMissingURI,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nResources:\n- https://google.com\n",
			error:   ErrMissingIssuedAt,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-02T00:00:00Z\nExpiration Time: 2025-01-01T00:00:00Z\n",
			error:   ErrIssuedAfterExpiration,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-01T00:00:00Z\nExpiration Time: 2025-01-02T00:00:00Z\nNot Before: 2025-01-03T00:00:00Z\n",
			error:   ErrNotBeforeAfterExpiration,
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-01T00:00:00Z\nResources:\n- https://google.com\n- ***\n",
			error:   errInvalidResource(1),
		},
		{
			example: "domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-01T00:00:00Z\nChain ID: random:mainnet",
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

	positiveExamples := []string{
		"domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nStatement\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-01T00:00:00Z\nNonce: 123\nRequest ID: abcdef\nChain ID: solana:testnet",
		"domain.com wants you to sign in with your Solana account:\n4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR\n\nVersion: 1\nURI: https://domain.com\nIssued At: 2025-01-01T00:00:00Z\nNonce: 123\nRequest ID: abcdef\nChain ID: solana:testnet",
	}

	for i, example := range positiveExamples {
		t.Run(fmt.Sprintf("positive example %d", i), func(t *testing.T) {
			parsed, err := ParseMessage(example)

			require.Nil(t, err)
			require.Equal(t, "domain.com", parsed.Domain)
			require.Equal(t, "4Cw1koUQtqybLFem7uqhzMBznMPGARbFS4cjaYbM9RnR", parsed.Address)

			if i == 0 {
				require.Equal(t, "Statement", parsed.Statement)
			} else {
				require.Equal(t, "", parsed.Statement)
			}

			require.Equal(t, "2025-01-01 00:00:00 +0000 UTC", parsed.IssuedAt.String())
			require.Equal(t, "https://domain.com", parsed.URI.String())
			require.Equal(t, "solana:testnet", parsed.ChainID)
			require.Equal(t, "123", parsed.Nonce)
			require.Equal(t, "abcdef", parsed.RequestID)

			require.Equal(t, false, parsed.VerifySignature(make([]byte, 64)))
		})
	}
}
