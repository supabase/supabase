package siwe

import (
	"regexp"
	"strconv"
)

var domainPattern = regexp.MustCompile(`^(localhost|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(?::\d{1,5})?$`)

func IsValidDomain(domain string) bool {
	return domainPattern.MatchString(domain)
}

func isValidEthereumNetwork(network string) bool {
	// REF: https://eips.ethereum.org/EIPS/eip-155
	// parse the network as an int first (not a string)
	chainId, err := strconv.Atoi(network)
	if err != nil {
		return false
	}
	return chainId > 0
}
