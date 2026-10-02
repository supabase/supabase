package scim

import (
	"net/http"
	"strings"

	"github.com/supabase/auth/internal/api/scim/core"
	"github.com/supabase/auth/internal/api/scim/protocol"
	"github.com/supabase/auth/internal/conf"
)

const BasePath = "/scim/v2"

type Server struct {
	serviceProviderConfig *core.ServiceProviderConfig
}

func NewServer(config *conf.GlobalConfiguration) *Server {
	return &Server{
		serviceProviderConfig: core.NewServiceProviderConfig(
			strings.TrimRight(config.API.ExternalURL, "/")+BasePath,
			core.NewOAuthBearerToken().AsPrimary(),
		),
	}
}

func (srv *Server) ServiceProviderConfig(w http.ResponseWriter, r *http.Request) error {
	return protocol.Send(w, http.StatusOK, srv.serviceProviderConfig)
}

func (srv *Server) ResourceTypes(w http.ResponseWriter, r *http.Request) error {
	return list(w, r, []any{})
}

func (srv *Server) Schemas(w http.ResponseWriter, r *http.Request) error {
	return list(w, r, []any{})
}

func (srv *Server) NotFound(w http.ResponseWriter, r *http.Request) error {
	return protocol.SendError(w, http.StatusNotFound, "", "Endpoint or resource does not exist")
}

func list[T any](w http.ResponseWriter, r *http.Request, resources []T) error {
	if r.URL.Query().Has("filter") {
		return protocol.SendError(w, http.StatusForbidden, "", "Filtering is not supported on this endpoint")
	}
	return protocol.Send(w, http.StatusOK, protocol.NewListResponse(resources))
}
