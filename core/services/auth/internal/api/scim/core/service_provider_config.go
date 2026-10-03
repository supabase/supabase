package core

type SupportedFeature struct {
	Supported bool `json:"supported"`
}

type BulkFeature struct {
	Supported      bool `json:"supported"`
	MaxOperations  int  `json:"maxOperations"`
	MaxPayloadSize int  `json:"maxPayloadSize"`
}

type FilterFeature struct {
	Supported  bool `json:"supported"`
	MaxResults int  `json:"maxResults"`
}

type AuthenticationSchemeType string

const (
	AuthenticationSchemeOAuthBearerToken AuthenticationSchemeType = "oauthbearertoken"
)

// AuthenticationScheme is the authentication scheme of RFC 7643, Section 5.
type AuthenticationScheme struct {
	Type        AuthenticationSchemeType `json:"type"`
	Name        string                   `json:"name"`
	Description string                   `json:"description"`
	SpecURI     string                   `json:"specUri,omitempty"`
	Primary     bool                     `json:"primary"`
}

func NewOAuthBearerToken() *AuthenticationScheme {
	return &AuthenticationScheme{
		Type:        AuthenticationSchemeOAuthBearerToken,
		Name:        "OAuth Bearer Token",
		Description: "Authentication scheme using the OAuth Bearer Token Standard",
		SpecURI:     "http://www.rfc-editor.org/info/rfc6750",
	}
}

func (scheme *AuthenticationScheme) AsPrimary() *AuthenticationScheme {
	scheme.Primary = true
	return scheme
}

// ServiceProviderConfig is the schema defined in RFC 7643, Section 5.
type ServiceProviderConfig struct {
	Schemas               []SchemaURI             `json:"schemas"`
	Patch                 SupportedFeature        `json:"patch"`
	Bulk                  BulkFeature             `json:"bulk"`
	Filter                FilterFeature           `json:"filter"`
	ChangePassword        SupportedFeature        `json:"changePassword"`
	Sort                  SupportedFeature        `json:"sort"`
	ETag                  SupportedFeature        `json:"etag"`
	AuthenticationSchemes []*AuthenticationScheme `json:"authenticationSchemes"`
	Meta                  Meta                    `json:"meta"`
}

func NewServiceProviderConfig(baseURL string, schemes ...*AuthenticationScheme) *ServiceProviderConfig {
	if schemes == nil {
		schemes = []*AuthenticationScheme{}
	}

	return &ServiceProviderConfig{
		Schemas:               []SchemaURI{SchemaServiceProviderConfig},
		AuthenticationSchemes: schemes,
		Meta:                  NewMeta(baseURL, ResourceTypeServiceProviderConfig, EndpointServiceProviderConfig),
	}
}
