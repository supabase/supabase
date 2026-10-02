package models

import (
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/storage"
)

type AMRClaim struct {
	ID                   uuid.UUID `json:"id" db:"id"`
	SessionID            uuid.UUID `json:"session_id" db:"session_id"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
	AuthenticationMethod *string   `json:"authentication_method" db:"authentication_method"`
}

func (AMRClaim) TableName() string {
	tableName := "mfa_amr_claims"
	return tableName
}

func (cl *AMRClaim) IsAAL2Claim() bool {
	return *cl.AuthenticationMethod == TOTPSignIn.String() || *cl.AuthenticationMethod == MFAPhone.String() || *cl.AuthenticationMethod == MFAWebAuthn.String() || *cl.AuthenticationMethod == MFARecoveryCode.String()
}

func AddClaimToSession(tx *storage.Connection, sessionId uuid.UUID, authenticationMethod AuthenticationMethod) error {
	id := uuid.Must(uuid.NewV4())

	currentTime := time.Now()
	return tx.RawQuery("INSERT INTO "+(&pop.Model{Value: AMRClaim{}}).TableName()+
		`(id, session_id, created_at, updated_at, authentication_method) values (?, ?, ?, ?, ?)
			ON CONFLICT ON CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey
			DO UPDATE SET updated_at = ?;`, id, sessionId, currentTime, currentTime, authenticationMethod.String(), currentTime).Exec()
}

func (a *AMRClaim) GetAuthenticationMethod() string {
	if a.AuthenticationMethod == nil {
		return ""
	}
	return *(a.AuthenticationMethod)
}
