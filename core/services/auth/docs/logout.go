//lint:file-ignore U1000 ignore go-swagger template
package docs

// swagger:route POST /logout logout logout
// Logs out the user.
// security:
//   - bearer:
// responses:
//   204: logoutResponse

// swagger:response logoutResponse
type logoutResponseWrapper struct{}
