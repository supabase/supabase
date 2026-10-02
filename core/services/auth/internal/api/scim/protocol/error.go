package protocol

import (
	"strconv"
)

const SchemaError = "urn:ietf:params:scim:api:messages:2.0:Error"

// Error is the error message form defined in RFC 7644, Section 3.12.
type Error struct {
	Schemas  []string `json:"schemas"`
	ScimType string   `json:"scimType,omitempty"`
	Detail   string   `json:"detail,omitempty"`
	Status   string   `json:"status"`
}

func NewError(status int, scimType string, detail string) *Error {
	return &Error{
		Schemas:  []string{SchemaError},
		ScimType: scimType,
		Detail:   detail,
		Status:   strconv.Itoa(status),
	}
}
