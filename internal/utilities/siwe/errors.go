package siwe

import (
	"errors"
	"fmt"
)

// Static errors
var (
	ErrMessageTooShort          = errors.New("siwe: message needs at least 6 lines")
	ErrInvalidHeader            = errors.New("siwe: message first line does not end in \" wants you to sign in with your Ethereum account:\"")
	ErrInvalidDomain            = errors.New("siwe: domain in first line of message is not valid")
	ErrInvalidAddress           = errors.New("siwe: wallet address is not a valid Ethereum address")
	ErrThirdLineNotEmpty        = errors.New("siwe: third line must be empty")
	ErrInvalidURI               = errors.New("siwe: URI is not valid")
	ErrInvalidIssuedAt          = errors.New("siwe: Issued At is not a valid ISO8601 timestamp")
	ErrInvalidExpirationTime    = errors.New("siwe: Expiration Time is not a valid ISO8601 timestamp")
	ErrInvalidNotBefore         = errors.New("siwe: Not Before is not a valid ISO8601 timestamp")
	ErrMissingURI               = errors.New("siwe: URI is not specified")
	ErrMissingIssuedAt          = errors.New("siwe: Issued At is not specified")
	ErrIssuedAfterExpiration    = errors.New("siwe: Issued At is after Expiration Time")
	ErrNotBeforeAfterExpiration = errors.New("siwe: Not Before is after Expiration Time")
	ErrInvalidChainID           = errors.New("siwe: Chain ID is not valid")
)

// Dynamic error constructors
func errUnparsableLine(index int) error {
	return fmt.Errorf("siwe: encountered unparsable line at index %d", index)
}

func errUnsupportedVersion(got string) error {
	return fmt.Errorf("siwe: Version value is not supported, expected 1 got %q", got)
}

func errInvalidResource(position int) error {
	return fmt.Errorf("siwe: Resource at position %d has invalid URI", position)
}
