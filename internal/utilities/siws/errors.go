package siws

import (
	"errors"
	"fmt"
)

// Static errors
var (
	ErrMessageTooShort          = errors.New("siws: message needs at least 6 lines")
	ErrInvalidHeader            = errors.New("siws: message first line does not end in \" wants you to sign in with your Solana account:\"")
	ErrInvalidDomain            = errors.New("siws: domain in first line of message is not valid")
	ErrInvalidAddress           = errors.New("siws: wallet address is not in base58 format")
	ErrThirdLineNotEmpty        = errors.New("siws: third line must be empty")
	ErrInvalidURI               = errors.New("siws: URI is not valid")
	ErrInvalidIssuedAt          = errors.New("siws: Issued At is not a valid ISO8601 timestamp")
	ErrInvalidExpirationTime    = errors.New("siws: Expiration Time is not a valid ISO8601 timestamp")
	ErrInvalidNotBefore         = errors.New("siws: Not Before is not a valid ISO8601 timestamp")
	ErrMissingURI               = errors.New("siws: URI is not specified")
	ErrMissingIssuedAt          = errors.New("siws: Issued At is not specified")
	ErrIssuedAfterExpiration    = errors.New("siws: Issued At is after Expiration Time")
	ErrNotBeforeAfterExpiration = errors.New("siws: Not Before is after Expiration Time")
	ErrInvalidChainID           = errors.New("siws: Chain ID is not valid")
)

// Dynamic error constructors
func errUnparsableLine(index int) error {
	return fmt.Errorf("siws: encountered unparsable line at index %d", index)
}

func errUnsupportedVersion(got string) error {
	return fmt.Errorf("siws: Version value is not supported, expected 1 got %q", got)
}

func errInvalidResource(position int) error {
	return fmt.Errorf("siws: Resource at position %d has invalid URI", position)
}
