//lint:file-ignore U1000 ignore go-swagger template
package docs

import "github.com/supabase/auth/internal/api"

// swagger:route GET /health health health
// The healthcheck endpoint for gotrue. Returns the current gotrue version.
// responses:
//   200: healthCheckResponse

// swagger:response healthCheckResponse
type healthCheckResponseWrapper struct {
	// in:body
	Body api.HealthCheckResponse
}
