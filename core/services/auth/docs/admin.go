//lint:file-ignore U1000 ignore go-swagger template
package docs

import (
	"github.com/supabase/auth/internal/api"
)

// swagger:route GET /admin/users admin admin-list-users
// List all users.
// security:
//   - bearer:
// responses:
//   200: adminListUserResponse
// 	 401: unauthorizedError

// The list of users.
// swagger:response adminListUserResponse
type adminListUserResponseWrapper struct {
	// in:body
	Body api.AdminListUsersResponse
}

// swagger:route POST /admin/users admin admin-create-user
// Returns the created user.
// security:
//   - bearer:
// responses:
//   200: userResponse
// 	 401: unauthorizedError

// The user to be created.
// swagger:parameters admin-create-user
type adminUserParamsWrapper struct {
	// in:body
	Body api.AdminUserParams
}

// swagger:route GET /admin/user/{user_id} admin admin-get-user
// Get a user.
// security:
//   - bearer:
// parameters:
// + name: user_id
//   in: path
//   description: The user's id
//   required: true
// responses:
//   200: userResponse
// 	 401: unauthorizedError

// The user specified.
// swagger:response userResponse

// swagger:route PUT /admin/user/{user_id} admin admin-update-user
// Update a user.
// security:
//   - bearer:
// parameters:
// + name: user_id
//   in: path
//   description: The user's id
//   required: true
// responses:
//   200: userResponse
// 	 401: unauthorizedError

// The updated user.
// swagger:response userResponse

// swagger:route DELETE /admin/user/{user_id} admin admin-delete-user
// Deletes a user.
// security:
//   - bearer:
// parameters:
// + name: user_id
//   in: path
//   description: The user's id
//   required: true
// responses:
//   200: deleteUserResponse
// 	 401: unauthorizedError

// The updated user.
// swagger:response deleteUserResponse
type deleteUserResponseWrapper struct{}

// swagger:route POST /admin/generate_link admin admin-generate-link
// Generates an email action link.
// security:
//   - bearer:
// responses:
//   200: generateLinkResponse
// 	 401: unauthorizedError

// swagger:parameters admin-generate-link
type generateLinkParams struct {
	// in:body
	Body api.GenerateLinkParams
}

// The response object for generate link.
// swagger:response generateLinkResponse
type generateLinkResponseWrapper struct {
	// in:body
	Body api.GenerateLinkResponse
}
