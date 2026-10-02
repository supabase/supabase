package models

import "errors"

// sentinel error for all not found errors.
var errNotFound = errors.New("not found")

// sentinel error for unique constraint violations.
var errUniqueConstraintViolated = errors.New("unique constraint violated")

// IsNotFoundError returns whether an error represents a "not found" error.
func IsNotFoundError(err error) bool {
	return errors.Is(err, errNotFound)
}

type SessionNotFoundError struct{}

func (e SessionNotFoundError) Error() string {
	return "Session not found"
}

func (e SessionNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// UserNotFoundError represents when a user is not found.
type UserNotFoundError struct{}

func (e UserNotFoundError) Error() string {
	return "User not found"
}

func (e UserNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// IdentityNotFoundError represents when an identity is not found.
type IdentityNotFoundError struct{}

func (e IdentityNotFoundError) Error() string {
	return "Identity not found"
}

func (e IdentityNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// ConfirmationOrRecoveryTokenNotFoundError represents when a confirmation or recovery token is not found.
type ConfirmationOrRecoveryTokenNotFoundError struct{}

func (e ConfirmationOrRecoveryTokenNotFoundError) Error() string {
	return "Confirmation or Recovery Token not found"
}

func (e ConfirmationOrRecoveryTokenNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// ConfirmationTokenNotFoundError represents when a confirmation token is not found.
type ConfirmationTokenNotFoundError struct{}

func (e ConfirmationTokenNotFoundError) Error() string {
	return "Confirmation Token not found"
}

func (e ConfirmationTokenNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// RefreshTokenNotFoundError represents when a refresh token is not found.
type RefreshTokenNotFoundError struct{}

func (e RefreshTokenNotFoundError) Error() string {
	return "Refresh Token not found"
}

func (e RefreshTokenNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// FactorNotFoundError represents when a user is not found.
type FactorNotFoundError struct{}

func (e FactorNotFoundError) Error() string {
	return "Factor not found"
}

func (e FactorNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// ChallengeNotFoundError represents when a user is not found.
type ChallengeNotFoundError struct{}

func (e ChallengeNotFoundError) Error() string {
	return "Challenge not found"
}

func (e ChallengeNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// SSOProviderNotFoundError represents an error when a SSO Provider can't be
// found.
type SSOProviderNotFoundError struct{}

func (e SSOProviderNotFoundError) Error() string {
	return "SSO Identity Provider not found"
}

func (e SSOProviderNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// SAMLRelayStateNotFoundError represents an error when a SAML relay state
// can't be found.
type SAMLRelayStateNotFoundError struct{}

func (e SAMLRelayStateNotFoundError) Error() string {
	return "SAML RelayState not found"
}

func (e SAMLRelayStateNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// FlowStateNotFoundError represents an error when an FlowState can't be
// found.
type FlowStateNotFoundError struct{}

func (e FlowStateNotFoundError) Error() string {
	return "Flow State not found"
}

func (e FlowStateNotFoundError) Is(target error) bool {
	return target == errNotFound
}

func IsUniqueConstraintViolatedError(err error) bool {
	return errors.Is(err, errUniqueConstraintViolated)
}

type UserEmailUniqueConflictError struct{}

func (e UserEmailUniqueConflictError) Error() string {
	return "User email unique constraint violated"
}

func (e UserEmailUniqueConflictError) Is(target error) bool {
	return target == errUniqueConstraintViolated
}

type OAuthClientStateNotFoundError struct{}

func (e OAuthClientStateNotFoundError) Error() string {
	return "OAuth state not found"
}

func (e OAuthClientStateNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// CustomOAuthProviderNotFoundError represents an error when a custom OAuth/OIDC provider can't be found
type CustomOAuthProviderNotFoundError struct{}

func (e CustomOAuthProviderNotFoundError) Error() string {
	return "Custom OAuth provider not found"
}

func (e CustomOAuthProviderNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// WebAuthnCredentialNotFoundError represents when a WebAuthn credential can't be found.
type WebAuthnCredentialNotFoundError struct{}

func (e WebAuthnCredentialNotFoundError) Error() string {
	return "WebAuthn credential not found"
}

func (e WebAuthnCredentialNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// WebAuthnChallengeNotFoundError represents when a WebAuthn challenge can't be found.
type WebAuthnChallengeNotFoundError struct{}

func (e WebAuthnChallengeNotFoundError) Error() string {
	return "WebAuthn challenge not found"
}

func (e WebAuthnChallengeNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// RecoveryCodeSetNotFoundError represents when a recovery code set is not found.
type RecoveryCodeSetNotFoundError struct{}

func (e RecoveryCodeSetNotFoundError) Error() string {
	return "Recovery code set not found"
}

func (e RecoveryCodeSetNotFoundError) Is(target error) bool {
	return target == errNotFound
}

// RecoveryCodeAlreadyConsumedError is returned by MarkConsumed when the code
// row was already consumed or deleted.
type RecoveryCodeAlreadyConsumedError struct{}

func (e RecoveryCodeAlreadyConsumedError) Error() string {
	return "Recovery code already consumed"
}
