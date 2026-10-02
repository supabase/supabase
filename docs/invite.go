//lint:file-ignore U1000 ignore go-swagger template
package docs

import "github.com/supabase/auth/internal/api"

// swagger:route POST /invite invite invite
// Sends an invite link to the user.
// responses:
//   200: inviteResponse

// swagger:parameters invite
type inviteParamsWrapper struct {
	// in:body
	Body api.InviteParams
}

// swagger:response inviteResponse
type inviteResponseWrapper struct{}
