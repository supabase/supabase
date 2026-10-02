//lint:file-ignore U1000 ignore go-swagger template
package docs

import (
	"github.com/supabase/auth/internal/api"
)

// swagger:route POST /token?grant_type=password token token-password
// Signs in a user with a password.
// responses:
//   200: tokenResponse

// swagger:parameters token-password
type tokenPasswordGrantParamsWrapper struct {
	// in:body
	Body api.PasswordGrantParams
}

// swagger:route POST /token?grant_type=refresh_token token token-refresh
// Refreshes a user's refresh token.
// responses:
//   200: tokenResponse

// swagger:parameters token-refresh
type tokenRefreshTokenGrantParamsWrapper struct {
	// in:body
	Body api.RefreshTokenGrantParams
}

// swagger:response tokenResponse
type tokenResponseWrapper struct {
	// in:body
	Body api.AccessTokenResponse
}
