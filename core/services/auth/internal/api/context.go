package api

import (
	"context"
	"net/url"

	"github.com/gofrs/uuid"
	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/supabase/auth/internal/api/shared"
	"github.com/supabase/auth/internal/ctxkey"
	"github.com/supabase/auth/internal/models"
)

var (
	externalProviderTypeKey          = ctxkey.New[string]("external_provider_type")
	externalProviderEmailOptionalKey = ctxkey.New[bool]("external_provider_allow_no_email")

	tokenKey            = ctxkey.New[*jwt.Token]("jwt")
	inviteTokenKey      = ctxkey.New[string]("invite_token")
	signatureKey        = ctxkey.New[string]("signature")
	targetUserKey       = ctxkey.New[*models.User]("target_user")
	factorKey           = ctxkey.New[*models.Factor]("factor")
	sessionKey          = ctxkey.New[*models.Session]("session")
	externalReferrerKey = ctxkey.New[string]("external_referrer")
	adminUserKey        = ctxkey.New[*models.User]("admin_user")
	oauthTokenKey       = ctxkey.New[string]("oauth_token") // for OAuth1.0, also known as request token
	oauthVerifierKey    = ctxkey.New[string]("oauth_verifier")
	ssoProviderKey      = ctxkey.New[*models.SSOProvider]("sso_provider")
	externalHostKey     = ctxkey.New[*url.URL]("external_host")
	oauthClientStateKey = ctxkey.New[uuid.UUID]("oauth_client_state_id")
	flowStateContextKey = ctxkey.New[*models.FlowState]("flow_state")
)

// withToken adds the JWT token to the context.
func withToken(ctx context.Context, token *jwt.Token) context.Context {
	return tokenKey.WithValue(ctx, token)
}

// getToken reads the JWT token from the context.
func getToken(ctx context.Context) *jwt.Token {
	return tokenKey.Value(ctx)
}

func getClaims(ctx context.Context) *AccessTokenClaims {
	token := getToken(ctx)
	if token == nil {
		return nil
	}
	return token.Claims.(*AccessTokenClaims)
}

// withUser adds the user to the context.
func withUser(ctx context.Context, u *models.User) context.Context {
	return shared.WithUser(ctx, u)
}

// withTargetUser adds the target user for linking to the context.
func withTargetUser(ctx context.Context, u *models.User) context.Context {
	return targetUserKey.WithValue(ctx, u)
}

// with Factor adds the factor id to the context.
func withFactor(ctx context.Context, f *models.Factor) context.Context {
	return factorKey.WithValue(ctx, f)
}

// getUser reads the user from the context.
func getUser(ctx context.Context) *models.User {
	return shared.GetUser(ctx)
}

// getTargetUser reads the user from the context.
func getTargetUser(ctx context.Context) *models.User {
	return targetUserKey.Value(ctx)
}

// getFactor reads the factor id from the context
func getFactor(ctx context.Context) *models.Factor {
	return factorKey.Value(ctx)
}

// withSession adds the session to the context.
func withSession(ctx context.Context, s *models.Session) context.Context {
	return sessionKey.WithValue(ctx, s)
}

// getSession reads the session from the context.
func getSession(ctx context.Context) *models.Session {
	return sessionKey.Value(ctx)
}

// withSignature adds the provided request ID to the context.
func withSignature(ctx context.Context, id string) context.Context {
	return signatureKey.WithValue(ctx, id)
}

func withInviteToken(ctx context.Context, token string) context.Context {
	return inviteTokenKey.WithValue(ctx, token)
}

func withOAuthClientStateID(ctx context.Context, oauthClientStateID uuid.UUID) context.Context {
	return oauthClientStateKey.WithValue(ctx, oauthClientStateID)
}

func getOAuthClientStateID(ctx context.Context) uuid.UUID {
	return oauthClientStateKey.Value(ctx)
}

// withFlowState stores the entire FlowState object in the context
func withFlowState(ctx context.Context, flowState *models.FlowState) context.Context {
	return flowStateContextKey.WithValue(ctx, flowState)
}

// getFlowState retrieves the FlowState object from the context
func getFlowState(ctx context.Context) *models.FlowState {
	return flowStateContextKey.Value(ctx)
}

func getInviteToken(ctx context.Context) string {
	return inviteTokenKey.Value(ctx)
}

// withExternalProviderType adds the provided request ID to the context.
func withExternalProviderType(ctx context.Context, id string, emailOptional bool) context.Context {
	return externalProviderEmailOptionalKey.WithValue(externalProviderTypeKey.WithValue(ctx, id), emailOptional)
}

// getExternalProviderType returns the provider type and whether user data without email address should be allowed.
func getExternalProviderType(ctx context.Context) (string, bool) {
	id, okID := externalProviderTypeKey.Lookup(ctx)
	if !okID {
		return "", false
	}

	emailOptional, okEmailOptional := externalProviderEmailOptionalKey.Lookup(ctx)
	if !okEmailOptional {
		return "", false
	}

	return id, emailOptional
}

func withExternalReferrer(ctx context.Context, token string) context.Context {
	return externalReferrerKey.WithValue(ctx, token)
}

func getExternalReferrer(ctx context.Context) string {
	return externalReferrerKey.Value(ctx)
}

// withAdminUser adds the admin user to the context.
func withAdminUser(ctx context.Context, u *models.User) context.Context {
	return adminUserKey.WithValue(ctx, u)
}

// getAdminUser reads the admin user from the context.
func getAdminUser(ctx context.Context) *models.User {
	return adminUserKey.Value(ctx)
}

// withRequestToken adds the request token to the context
func withRequestToken(ctx context.Context, token string) context.Context {
	return oauthTokenKey.WithValue(ctx, token)
}

func getRequestToken(ctx context.Context) string {
	return oauthTokenKey.Value(ctx)
}

func withOAuthVerifier(ctx context.Context, token string) context.Context {
	return oauthVerifierKey.WithValue(ctx, token)
}

func getOAuthVerifier(ctx context.Context) string {
	return oauthVerifierKey.Value(ctx)
}

func withSSOProvider(ctx context.Context, provider *models.SSOProvider) context.Context {
	return ssoProviderKey.WithValue(ctx, provider)
}

func getSSOProvider(ctx context.Context) *models.SSOProvider {
	return ssoProviderKey.Value(ctx)
}

func withExternalHost(ctx context.Context, u *url.URL) context.Context {
	return externalHostKey.WithValue(ctx, u)
}

func getExternalHost(ctx context.Context) *url.URL {
	return externalHostKey.Value(ctx)
}
