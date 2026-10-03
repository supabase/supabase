//lint:file-ignore U1000 ignore go-swagger template
package docs

import (
	"github.com/supabase/auth/internal/api"
)

// swagger:route POST /signup signup signup
// Password-based signup with either email or phone.
// responses:
//   200: userResponse

// swagger:parameters signup
type signupParamsWrapper struct {
	// in:body
	Body api.SignupParams
}
