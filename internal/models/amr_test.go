package models

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// TestAMRClaimIsAAL2 pins which authentication methods upgrade a session to AAL2.
func TestAMRClaimIsAAL2(t *testing.T) {
	for method, want := range map[AuthenticationMethod]bool{
		TOTPSignIn:      true,
		MFAPhone:        true,
		MFAWebAuthn:     true,
		MFARecoveryCode: true,
		PasswordGrant:   false,
		OTP:             false,
	} {
		methodString := method.String()
		claim := AMRClaim{AuthenticationMethod: &methodString}
		require.Equal(t, want, claim.IsAAL2Claim(), "method %q", methodString)
	}
}
