package utilities

import (
	_ "embed"
	"encoding/json"

	"github.com/gofrs/uuid"
)

// To update the embedded AAGUID data, run:
//   go generate ./internal/utilities/...

//go:generate sh -c "curl -sL https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/combined_aaguid.json | jq 'map_values(.name)' > aaguids.json"

//go:embed aaguids.json
var aaguidsJSON []byte

// aaguidNames maps well-known AAGUIDs to human-readable authenticator names.
// Sourced from https://github.com/passkeydeveloper/passkey-authenticator-aaguids
var aaguidNames map[string]string

func init() {
	if err := json.Unmarshal(aaguidsJSON, &aaguidNames); err != nil {
		panic("failed to parse embedded aaguids.json: " + err.Error())
	}
}

// PasskeyFriendlyName returns a human-readable name for a passkey credential.
// It looks up the raw AAGUID bytes in a well-known database, falling back to "Passkey".
func PasskeyFriendlyName(aaguid []byte) string {
	if len(aaguid) > 0 {
		parsed, err := uuid.FromBytes(aaguid)
		if err == nil && parsed != (uuid.UUID{}) {
			if name, ok := aaguidNames[parsed.String()]; ok {
				return name
			}
		}
	}

	return "Passkey"
}
