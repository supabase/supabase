package models

import (
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/storage"
)

type Pagination struct {
	Page    uint64
	PerPage uint64
	Count   uint64
}

func (p *Pagination) Offset() uint64 {
	return (p.Page - 1) * p.PerPage
}

// KeysetCursor is the position of a row within a keyset-paginated result set.
// It captures the ordering columns of the last row returned so the next page
// can resume from just after it. The (CreatedAt, ID) tuple is used because
// created_at is not unique, so ID acts as a stable tiebreaker.
type KeysetCursor struct {
	CreatedAt time.Time `json:"created_at"`
	ID        uuid.UUID `json:"id"`
}

// KeysetPagination describes a single keyset (cursor-based) page request.
// After == nil requests the first page.
type KeysetPagination struct {
	Limit uint64
	After *KeysetCursor
}

type SortDirection string

const Ascending SortDirection = "ASC"
const Descending SortDirection = "DESC"
const CreatedAt = "created_at"

type SortParams struct {
	Fields []SortField
}

type SortField struct {
	Name string
	Dir  SortDirection
}

// TruncateAll deletes all data from the database, as managed by GoTrue. Not
// intended for use outside of tests.
func TruncateAll(conn *storage.Connection) error {
	return conn.Transaction(func(tx *storage.Connection) error {
		tables := []string{
			(&pop.Model{Value: User{}}).TableName(),
			(&pop.Model{Value: Identity{}}).TableName(),
			(&pop.Model{Value: RefreshToken{}}).TableName(),
			(&pop.Model{Value: AuditLogEntry{}}).TableName(),
			(&pop.Model{Value: Session{}}).TableName(),
			(&pop.Model{Value: Factor{}}).TableName(),
			(&pop.Model{Value: RecoveryCodeSet{}}).TableName(),
			(&pop.Model{Value: RecoveryCodeEntry{}}).TableName(),
			(&pop.Model{Value: Challenge{}}).TableName(),
			(&pop.Model{Value: AMRClaim{}}).TableName(),
			(&pop.Model{Value: SSOProvider{}}).TableName(),
			(&pop.Model{Value: SSODomain{}}).TableName(),
			(&pop.Model{Value: SAMLProvider{}}).TableName(),
			(&pop.Model{Value: SAMLRelayState{}}).TableName(),
			(&pop.Model{Value: FlowState{}}).TableName(),
			(&pop.Model{Value: OneTimeToken{}}).TableName(),
			(&pop.Model{Value: OAuthServerClient{}}).TableName(),
			(&pop.Model{Value: CustomOAuthProvider{}}).TableName(),
			(&pop.Model{Value: WebAuthnCredential{}}).TableName(),
			(&pop.Model{Value: WebAuthnChallenge{}}).TableName(),
		}

		for _, tableName := range tables {
			if err := tx.RawQuery("DELETE FROM " + tableName + " CASCADE").Exec(); err != nil {
				return err
			}
		}

		return nil
	})
}
