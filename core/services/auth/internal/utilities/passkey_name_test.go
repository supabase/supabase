package utilities

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
)

func TestPasskeyFriendlyName(t *testing.T) {
	aaguidBytes := func(s string) []byte {
		return uuid.Must(uuid.FromString(s)).Bytes()
	}

	tests := []struct {
		name     string
		aaguid   []byte
		expected string
	}{
		{
			name:     "known AAGUID: Google Password Manager",
			aaguid:   aaguidBytes("ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4"),
			expected: "Google Password Manager",
		},
		{
			name:     "known AAGUID: 1Password",
			aaguid:   aaguidBytes("bada5566-a7aa-401f-bd96-45619a55120d"),
			expected: "1Password",
		},
		{
			name:     "known AAGUID: iCloud Keychain",
			aaguid:   aaguidBytes("dd4ec289-e01d-41c9-bb89-70fa845d4bf2"),
			expected: "iCloud Keychain (Managed)",
		},
		{
			name:     "known AAGUID: LastPass",
			aaguid:   aaguidBytes("b78a0a55-6ef8-d246-a042-ba0f6d55050c"),
			expected: "LastPass",
		},
		{
			name:     "known AAGUID: YubiKey (hardware authenticator)",
			aaguid:   aaguidBytes("cb69481e-8ff7-4039-93ec-0a2729a154a8"),
			expected: "YubiKey 5 Series",
		},
		{
			name:     "unknown AAGUID returns Passkey",
			aaguid:   aaguidBytes("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
			expected: "Passkey",
		},
		{
			name:     "zero AAGUID returns Passkey",
			aaguid:   make([]byte, 16),
			expected: "Passkey",
		},
		{
			name:     "nil AAGUID returns Passkey",
			aaguid:   nil,
			expected: "Passkey",
		},
		{
			name:     "empty AAGUID returns Passkey",
			aaguid:   []byte{},
			expected: "Passkey",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := PasskeyFriendlyName(tt.aaguid)
			assert.Equal(t, tt.expected, result)
		})
	}
}
