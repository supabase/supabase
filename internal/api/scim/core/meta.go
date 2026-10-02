package core

// Meta is the resource metadata common attribute defined in RFC 7643, Section 3.1.
type Meta struct {
	ResourceType ResourceTypeName `json:"resourceType"`
	Location     string           `json:"location,omitempty"`
}

func NewMeta(baseURL string, resourceType ResourceTypeName, endpoint string) Meta {
	return Meta{
		ResourceType: resourceType,
		Location:     baseURL + endpoint,
	}
}
