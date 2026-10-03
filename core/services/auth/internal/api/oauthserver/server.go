package oauthserver

import (
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/tokens"
)

// Server represents the OAuth 2.1 server functionality
type Server struct {
	config       *conf.GlobalConfiguration
	db           *storage.Connection
	tokenService *tokens.Service
}

// NewServer creates a new OAuth server instance
func NewServer(config *conf.GlobalConfiguration, db *storage.Connection, tokenService *tokens.Service) *Server {
	return &Server{
		config:       config,
		db:           db,
		tokenService: tokenService,
	}
}
