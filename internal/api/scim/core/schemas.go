package core

// The schema URIs of RFC 7643
const (
	schemaRoot = "urn:ietf:params:scim:schemas"
	schemaCore = schemaRoot + ":core:2.0"

	SchemaServiceProviderConfig SchemaURI = schemaCore + ":ServiceProviderConfig"
)

const (
	ResourceTypeServiceProviderConfig ResourceTypeName = "ServiceProviderConfig"
)
