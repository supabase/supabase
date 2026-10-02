package shared

import (
	"context"

	"github.com/supabase/auth/internal/ctxkey"
	"github.com/supabase/auth/internal/models"
)

var (
	UserKey              = ctxkey.New[*models.User]("user")
	SessionKey           = ctxkey.New[*models.Session]("session")
	OAuthServerClientKey = ctxkey.New[*models.OAuthServerClient]("oauth_server_client")
)

// GetUser reads the user from the context - shared implementation
func GetUser(ctx context.Context) *models.User {
	return UserKey.Value(ctx)
}

// WithUser adds the user to the context - shared implementation
func WithUser(ctx context.Context, u *models.User) context.Context {
	return UserKey.WithValue(ctx, u)
}

// GetSession reads the session from the context - shared implementation
func GetSession(ctx context.Context) *models.Session {
	return SessionKey.Value(ctx)
}

// WithSession adds the session to the context - shared implementation
func WithSession(ctx context.Context, s *models.Session) context.Context {
	return SessionKey.WithValue(ctx, s)
}

// WithOAuthServerClient adds an OAuth server client to the context
func WithOAuthServerClient(ctx context.Context, client *models.OAuthServerClient) context.Context {
	return OAuthServerClientKey.WithValue(ctx, client)
}

// GetOAuthServerClient retrieves an OAuth server client from the context
func GetOAuthServerClient(ctx context.Context) *models.OAuthServerClient {
	return OAuthServerClientKey.Value(ctx)
}
