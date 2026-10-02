package protocol

const SchemaListResponse = "urn:ietf:params:scim:api:messages:2.0:ListResponse"

type ListResponse[T any] struct {
	Schemas      []string `json:"schemas"`
	TotalResults int      `json:"totalResults"`
	StartIndex   int      `json:"startIndex"`
	ItemsPerPage int      `json:"itemsPerPage"`
	Resources    []T      `json:"Resources"`
}

func NewListResponse[T any](resources []T) *ListResponse[T] {
	if resources == nil {
		resources = []T{}
	}
	n := len(resources)
	return &ListResponse[T]{
		Schemas:      []string{SchemaListResponse},
		TotalResults: n,
		StartIndex:   1,
		ItemsPerPage: n,
		Resources:    resources,
	}
}
