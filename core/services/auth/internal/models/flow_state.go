package models

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/security"
	"github.com/supabase/auth/internal/storage"

	"github.com/gofrs/uuid"
)

type FlowState struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	UserID               *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	AuthCode             *string    `json:"auth_code,omitempty" db:"auth_code"`
	AuthenticationMethod string     `json:"authentication_method" db:"authentication_method"`
	CodeChallenge        *string    `json:"code_challenge,omitempty" db:"code_challenge"`
	CodeChallengeMethod  *string    `json:"code_challenge_method,omitempty" db:"code_challenge_method"`
	ProviderType         string     `json:"provider_type" db:"provider_type"`
	ProviderAccessToken  string     `json:"provider_access_token" db:"provider_access_token"`
	ProviderRefreshToken string     `json:"provider_refresh_token" db:"provider_refresh_token"`
	AuthCodeIssuedAt     *time.Time `json:"auth_code_issued_at" db:"auth_code_issued_at"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`

	// OAuth context fields (previously stored in JWT state parameter)
	InviteToken        *string    `json:"invite_token,omitempty" db:"invite_token"`
	Referrer           *string    `json:"referrer,omitempty" db:"referrer"`
	OAuthClientStateID *uuid.UUID `json:"oauth_client_state_id,omitempty" db:"oauth_client_state_id"`
	LinkingTargetID    *uuid.UUID `json:"linking_target_id,omitempty" db:"linking_target_id"`
	EmailOptional      bool       `json:"email_optional" db:"email_optional"`
}

// FlowStateParams contains all parameters for creating a flow state
type FlowStateParams struct {
	ProviderType         string
	AuthenticationMethod AuthenticationMethod
	CodeChallenge        string // empty for implicit flow
	CodeChallengeMethod  string // empty for implicit flow
	UserID               *uuid.UUID
	InviteToken          string
	Referrer             string
	OAuthClientStateID   *uuid.UUID
	LinkingTargetID      *uuid.UUID
	EmailOptional        bool
}

type CodeChallengeMethod int

const (
	SHA256 CodeChallengeMethod = iota
	Plain
)

func (codeChallengeMethod CodeChallengeMethod) String() string {
	switch codeChallengeMethod {
	case SHA256:
		return "s256"
	case Plain:
		return "plain"
	}
	return ""
}

func ParseCodeChallengeMethod(codeChallengeMethod string) (CodeChallengeMethod, error) {
	switch strings.ToLower(codeChallengeMethod) {
	case "s256":
		return SHA256, nil
	case "plain":
		return Plain, nil
	}
	return 0, fmt.Errorf("unsupported code_challenge method %q", codeChallengeMethod)
}

type FlowType int

const (
	PKCEFlow FlowType = iota
	ImplicitFlow
)

func (flowType FlowType) String() string {
	switch flowType {
	case PKCEFlow:
		return "pkce"
	case ImplicitFlow:
		return "implicit"
	}
	return ""
}

func (FlowState) TableName() string {
	tableName := "flow_state"
	return tableName
}

// NewFlowState creates a flow state for both PKCE and implicit flows.
// PKCE fields (AuthCode, CodeChallenge, CodeChallengeMethod) are only set
// if CodeChallenge is provided in params.
// Returns an error if CodeChallenge is provided but CodeChallengeMethod is invalid.
func NewFlowState(params FlowStateParams) (*FlowState, error) {
	id := uuid.Must(uuid.NewV4())

	flowState := &FlowState{
		ID:                   id,
		ProviderType:         params.ProviderType,
		AuthenticationMethod: params.AuthenticationMethod.String(),
		UserID:               params.UserID,
		EmailOptional:        params.EmailOptional,
		OAuthClientStateID:   params.OAuthClientStateID,
		LinkingTargetID:      params.LinkingTargetID,
	}

	// Set PKCE fields only if code_challenge is provided
	if params.CodeChallenge != "" {
		codeChallengeMethod, err := ParseCodeChallengeMethod(params.CodeChallengeMethod)
		if err != nil {
			return nil, err
		}
		authCode := uuid.Must(uuid.NewV4()).String()
		ccMethod := codeChallengeMethod.String()
		flowState.AuthCode = &authCode
		flowState.CodeChallenge = &params.CodeChallenge
		flowState.CodeChallengeMethod = &ccMethod
	}

	// Set optional context fields
	if params.InviteToken != "" {
		flowState.InviteToken = &params.InviteToken
	}
	if params.Referrer != "" {
		flowState.Referrer = &params.Referrer
	}

	return flowState, nil
}

// IsPKCE returns true if this flow state represents a PKCE flow
func (f *FlowState) IsPKCE() bool {
	return f.CodeChallenge != nil && *f.CodeChallenge != ""
}

func FindFlowStateByAuthCode(tx *storage.Connection, authCode string) (*FlowState, error) {
	obj := &FlowState{}
	if err := tx.Eager().Q().Where("auth_code = ?", authCode).First(obj); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, FlowStateNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding flow state")
	}

	return obj, nil
}

func FindFlowStateByID(tx *storage.Connection, id string) (*FlowState, error) {
	obj := &FlowState{}
	if err := tx.Eager().Q().Where("id = ?", id).First(obj); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, FlowStateNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding flow state")
	}
	return obj, nil
}

// FindFlowStateByIDForUpdate finds a flow state by ID and locks the row with
// FOR UPDATE SKIP LOCKED to prevent concurrent modifications. If the row is
// already locked by another transaction, SKIP LOCKED causes the query to
// return no rows instead of blocking, which surfaces as FlowStateNotFoundError.
// The lock is held until the transaction commits or rolls back.
func FindFlowStateByIDForUpdate(tx *storage.Connection, id string) (*FlowState, error) {
	obj := &FlowState{}
	// Pop does not provide a way to execute FOR UPDATE queries,
	// so we use a raw query to lock the row first.
	if err := tx.RawQuery(
		fmt.Sprintf("SELECT * FROM %q WHERE id = ? LIMIT 1 FOR UPDATE SKIP LOCKED", obj.TableName()),
		id,
	).First(obj); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, FlowStateNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding flow state")
	}
	return obj, nil
}

func FindFlowStateByUserID(tx *storage.Connection, id string, authenticationMethod AuthenticationMethod) (*FlowState, error) {
	obj := &FlowState{}
	if err := tx.Eager().Q().Where("user_id = ? and authentication_method = ?", id, authenticationMethod).Last(obj); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, FlowStateNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding flow state")
	}

	return obj, nil
}

func (f *FlowState) VerifyPKCE(codeVerifier string) error {
	if !f.IsPKCE() {
		return errors.New("PKCE verification not applicable for implicit flow")
	}
	return security.VerifyPKCEChallenge(*f.CodeChallenge, *f.CodeChallengeMethod, codeVerifier)
}

func (f *FlowState) IsExpired(expiryDuration time.Duration) bool {
	if f.AuthCodeIssuedAt != nil && f.AuthenticationMethod == MagicLink.String() {
		return time.Now().After(f.AuthCodeIssuedAt.Add(expiryDuration))
	}
	return time.Now().After(f.CreatedAt.Add(expiryDuration))
}

func (f *FlowState) RecordAuthCodeIssuedAtTime(tx *storage.Connection) error {
	issueTime := time.Now()
	f.AuthCodeIssuedAt = &issueTime
	if err := tx.Update(f); err != nil {
		return err
	}
	return nil
}
