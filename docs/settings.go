//lint:file-ignore U1000 ignore go-swagger template
package docs

import "github.com/supabase/auth/internal/api"

// swagger:route GET /settings settings settings
// Returns the configuration settings for the gotrue server.
// responses:
//   200: settingsResponse

// swagger:response settingsResponse
type settingsResponseWrapper struct {
	// in:body
	Body api.Settings
}
