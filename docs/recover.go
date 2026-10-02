//lint:file-ignore U1000 ignore go-swagger template
package docs

import "github.com/supabase/auth/internal/api"

// swagger:route POST /recover recovery recovery
// Sends a password recovery email link to the user's email.
// responses:
//   200: recoveryResponse

// swagger:parameters recovery
type recoveryParamsWrapper struct {
	// in:body
	Body api.RecoverParams
}

// swagger:response recoveryResponse
type recoveryResponseWrapper struct{}
