//lint:file-ignore U1000 ignore go-swagger template
package docs

// swagger:route GET /authorize oauth authorize
// Redirects the user to the 3rd-party OAuth provider to start the OAuth1.0 or OAuth2.0 authentication process.
// parameters:
// + name: redirect_to
//   in: query
//   description: The redirect url to return the user to after the `/callback` endpoint has completed.
//   required: false
// responses:
//   302: authorizeResponse

// Redirects user to the 3rd-party OAuth provider
// swagger:response authorizeResponse
type authorizeResponseWrapper struct{}

// swagger:route GET /callback oauth callback
// Receives the redirect from an external provider during the OAuth authentication process. Starts the process of creating an access and refresh token.
// responses:
//   302: callbackResponse

// Redirects user to the redirect url specified in `/authorize`. If no `redirect_url` is provided, the user will be redirected to the `SITE_URL`.
// swagger:response callbackResponse
type callbackResponseWrapper struct{}
