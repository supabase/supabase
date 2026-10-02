package security

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestVerifyPKCEChallenge(t *testing.T) {
	tests := []struct {
		name                string
		codeChallenge       string
		codeChallengeMethod string
		codeVerifier        string
		wantErr             bool
		errMsg              string
	}{
		{
			name:                "valid S256 PKCE",
			codeChallenge:       "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", // S256 of "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
			codeChallengeMethod: "S256",
			codeVerifier:        "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
			wantErr:             false,
		},
		{
			name:                "valid plain PKCE",
			codeChallenge:       "test-challenge",
			codeChallengeMethod: "plain",
			codeVerifier:        "test-challenge",
			wantErr:             false,
		},
		{
			name:                "invalid S256 verifier",
			codeChallenge:       "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
			codeChallengeMethod: "S256",
			codeVerifier:        "wrong-verifier",
			wantErr:             true,
			errMsg:              "code challenge does not match",
		},
		{
			name:                "invalid plain verifier",
			codeChallenge:       "test-challenge",
			codeChallengeMethod: "plain",
			codeVerifier:        "wrong-challenge",
			wantErr:             true,
			errMsg:              "code challenge does not match",
		},
		{
			name:                "invalid challenge method",
			codeChallenge:       "test-challenge",
			codeChallengeMethod: "invalid",
			codeVerifier:        "test-challenge",
			wantErr:             true,
			errMsg:              "code challenge method not supported",
		},
		{
			name:                "case insensitive S256 method",
			codeChallenge:       "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
			codeChallengeMethod: "s256",
			codeVerifier:        "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
			wantErr:             false,
		},
		{
			name:                "case insensitive plain method",
			codeChallenge:       "test-challenge",
			codeChallengeMethod: "PLAIN",
			codeVerifier:        "test-challenge",
			wantErr:             false,
		},
		{
			name:                "empty verifier with S256",
			codeChallenge:       "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
			codeChallengeMethod: "S256",
			codeVerifier:        "",
			wantErr:             true,
			errMsg:              "code challenge does not match",
		},
		{
			name:                "empty verifier with plain",
			codeChallenge:       "test-challenge",
			codeChallengeMethod: "plain",
			codeVerifier:        "",
			wantErr:             true,
			errMsg:              "code challenge does not match",
		},
		{
			name:                "empty challenge with S256",
			codeChallenge:       "",
			codeChallengeMethod: "S256",
			codeVerifier:        "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
			wantErr:             true,
			errMsg:              "code challenge does not match",
		},
		{
			name:                "empty challenge with plain",
			codeChallenge:       "",
			codeChallengeMethod: "plain",
			codeVerifier:        "test-challenge",
			wantErr:             true,
			errMsg:              "code challenge does not match",
		},
		{
			name:                "both empty with plain",
			codeChallenge:       "",
			codeChallengeMethod: "plain",
			codeVerifier:        "",
			wantErr:             false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := VerifyPKCEChallenge(tt.codeChallenge, tt.codeChallengeMethod, tt.codeVerifier)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
