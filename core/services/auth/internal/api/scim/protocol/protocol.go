// Package protocol implements the SCIM 2.0 protocol defined in RFC 7644.
package protocol

import (
	"net/http"

	"github.com/supabase/auth/internal/api/shared"
)

const MediaType = "application/scim+json"

func Send(w http.ResponseWriter, status int, obj any) error {
	return shared.JSON(w).ContentType(MediaType).Status(status).Send(obj)
}

func SendError(w http.ResponseWriter, status int, scimType string, detail string) error {
	return Send(w, status, NewError(status, scimType, detail))
}
