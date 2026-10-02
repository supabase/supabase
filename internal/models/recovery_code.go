package models

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/storage"
)

// RecoveryCodeSet maps to the mfa_recovery_code_sets table: one row per user,
// tied 1:1 to the user's recovery-code factor.
type RecoveryCodeSet struct {
	ID                      uuid.UUID  `json:"-" db:"id"`
	UserID                  uuid.UUID  `json:"-" db:"user_id"`
	MFAFactorID             uuid.UUID  `json:"-" db:"mfa_factor_id"`
	FailedVerificationCount int        `json:"-" db:"failed_verification_count"`
	VerificationLockedUntil *time.Time `json:"-" db:"verification_locked_until"`
	CreatedAt               time.Time  `json:"-" db:"created_at"`
	UpdatedAt               time.Time  `json:"-" db:"updated_at"`
}

func (RecoveryCodeSet) TableName() string {
	return "mfa_recovery_code_sets"
}

// RecoveryCodeEntry maps to the mfa_recovery_codes table: one row per single-use code.
type RecoveryCodeEntry struct {
	ID                   uuid.UUID  `json:"-" db:"id"`
	MFARecoveryCodeSetID uuid.UUID  `json:"-" db:"mfa_recovery_code_set_id"`
	CodeHash             string     `json:"-" db:"code_hash"`
	ConsumedAt           *time.Time `json:"-" db:"consumed_at"`
	CreatedAt            time.Time  `json:"-" db:"created_at"`
}

func (RecoveryCodeEntry) TableName() string {
	return "mfa_recovery_codes"
}

// CreateRecoveryCodeSet inserts the set row plus one code row per hash inside the caller's transaction.
func CreateRecoveryCodeSet(tx *storage.Connection, factor *Factor, codeHashes []string) (*RecoveryCodeSet, error) {
	set := &RecoveryCodeSet{
		ID:          uuid.Must(uuid.NewV4()),
		UserID:      factor.UserID,
		MFAFactorID: factor.ID,
	}

	if err := tx.Create(set); err != nil {
		return nil, errors.Wrap(err, "error creating recovery code set")
	}

	if err := insertRecoveryCodes(tx, set.ID, codeHashes); err != nil {
		return nil, err
	}

	return set, nil
}

func insertRecoveryCodes(tx *storage.Connection, mfaRecoveryCodeSetID uuid.UUID, hashes []string) error {
	for _, hash := range hashes {
		code := &RecoveryCodeEntry{
			ID:                   uuid.Must(uuid.NewV4()),
			MFARecoveryCodeSetID: mfaRecoveryCodeSetID,
			CodeHash:             hash,
		}

		if err := tx.Create(code); err != nil {
			return errors.Wrap(err, "error creating recovery code")
		}
	}

	return nil
}

// FindRecoveryCodeSetByUser returns the user's recovery-code set.
func FindRecoveryCodeSetByUser(tx *storage.Connection, userID uuid.UUID) (*RecoveryCodeSet, error) {
	set := &RecoveryCodeSet{}

	if err := tx.Q().Where("user_id = ?", userID).First(set); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, RecoveryCodeSetNotFoundError{}
		}

		return nil, errors.Wrap(err, "error finding recovery code set")
	}

	return set, nil
}

// FindRecoveryCodeSetForUpdate takes a blocking row lock on the user's set.
// We don't use SKIP LOCKED to ensure concurrent verifications serialize on the user's set.
func FindRecoveryCodeSetForUpdate(tx *storage.Connection, userID uuid.UUID) (*RecoveryCodeSet, error) {
	set := &RecoveryCodeSet{}
	err := tx.RawQuery(
		fmt.Sprintf("SELECT * FROM %q WHERE user_id = ? LIMIT 1 FOR UPDATE", set.TableName()),
		userID,
	).First(set)

	if err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, RecoveryCodeSetNotFoundError{}
		}

		return nil, errors.Wrap(err, "error locking recovery code set")
	}

	return set, nil
}

// FindUnusedRecoveryCodes returns the set's unconsumed codes in a deterministic order.
func FindUnusedRecoveryCodes(tx *storage.Connection, mfaRecoveryCodeSetID uuid.UUID) ([]RecoveryCodeEntry, error) {
	var codes []RecoveryCodeEntry
	err := tx.Q().
		Where("mfa_recovery_code_set_id = ? AND consumed_at IS NULL", mfaRecoveryCodeSetID).
		Order("created_at asc, id asc"). // id breaks created_at ties within an insert batch
		All(&codes)

	if err != nil {
		return nil, errors.Wrap(err, "error finding unused recovery codes")
	}

	return codes, nil
}

// CountRecoveryCodes returns the total and unconsumed code counts for a set.
func CountRecoveryCodes(tx *storage.Connection, mfaRecoveryCodeSetID uuid.UUID) (int, int, error) {
	counts := struct {
		Total     int `db:"total"`
		Remaining int `db:"remaining"`
	}{}
	err := tx.RawQuery(
		"SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE consumed_at IS NULL) AS remaining FROM "+
			(RecoveryCodeEntry{}).TableName()+" WHERE mfa_recovery_code_set_id = ?",
		mfaRecoveryCodeSetID,
	).First(&counts)

	if err != nil {
		return 0, 0, errors.Wrap(err, "error counting recovery codes")
	}

	return counts.Total, counts.Remaining, nil
}

// MarkConsumed sets consumed_at ensuring a code can only be consumed once.
func (rc *RecoveryCodeEntry) MarkConsumed(tx *storage.Connection) error {
	now := time.Now()
	count, err := tx.RawQuery(
		"UPDATE "+rc.TableName()+" SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL",
		now, rc.ID,
	).ExecWithCount()

	if err != nil {
		return errors.Wrap(err, "error consuming recovery code")
	}

	if count == 0 {
		return RecoveryCodeAlreadyConsumedError{}
	}

	rc.ConsumedAt = &now

	return nil
}

// IsLocked reports whether verification is locked at the given instant.
func (s *RecoveryCodeSet) IsLocked(now time.Time) bool {
	return s.VerificationLockedUntil != nil && now.Before(*s.VerificationLockedUntil)
}

// RegisterFailure increments the failure counter and trips the lockout when the counter reaches maxAttempts.
// The caller must hold the row lock using FindRecoveryCodeSetForUpdate so concurrent increments are never lost.
func (s *RecoveryCodeSet) RegisterFailure(tx *storage.Connection, now time.Time, maxAttempts int, lockoutDuration time.Duration) error {
	s.FailedVerificationCount++

	if s.FailedVerificationCount >= maxAttempts {
		lockedUntil := now.Add(lockoutDuration)
		s.VerificationLockedUntil = &lockedUntil
	}

	if err := tx.UpdateOnly(s, "failed_verification_count", "verification_locked_until", "updated_at"); err != nil {
		return errors.Wrap(err, "error registering recovery code verification failure")
	}

	return nil
}

// ResetLockout zeroes the failure counter and clears the lock (on successful verification or regeneration).
func (s *RecoveryCodeSet) ResetLockout(tx *storage.Connection) error {
	s.FailedVerificationCount = 0
	s.VerificationLockedUntil = nil

	if err := tx.UpdateOnly(s, "failed_verification_count", "verification_locked_until", "updated_at"); err != nil {
		return errors.Wrap(err, "error resetting recovery code lockout")
	}

	return nil
}

// ClearExpiredLockout resets the lockout state if a lock exists and has expired.
func (s *RecoveryCodeSet) ClearExpiredLockout(tx *storage.Connection, now time.Time) error {
	if s.VerificationLockedUntil == nil || now.Before(*s.VerificationLockedUntil) {
		return nil
	}

	return s.ResetLockout(tx)
}

// ReplaceRecoveryCodes deletes all code rows for the set, inserts the new
// batch, and resets the lockout state, all inside the caller's transaction.
func ReplaceRecoveryCodes(tx *storage.Connection, mfaRecoveryCodeSetID uuid.UUID, newHashes []string) error {
	// Lock the parent set before updating the recovery codes to serialize concurrent regenerations.
	set := &RecoveryCodeSet{}
	err := tx.RawQuery(
		fmt.Sprintf("SELECT * FROM %q WHERE id = ? LIMIT 1 FOR UPDATE", set.TableName()),
		mfaRecoveryCodeSetID,
	).First(set)
	if err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return RecoveryCodeSetNotFoundError{}
		}

		return errors.Wrap(err, "error locking recovery code set")
	}

	err = tx.RawQuery(
		"DELETE FROM "+(RecoveryCodeEntry{}).TableName()+" WHERE mfa_recovery_code_set_id = ?",
		mfaRecoveryCodeSetID,
	).Exec()
	if err != nil {
		return errors.Wrap(err, "error deleting recovery codes")
	}

	if err := insertRecoveryCodes(tx, mfaRecoveryCodeSetID, newHashes); err != nil {
		return err
	}

	count, err := tx.RawQuery(
		"UPDATE "+(RecoveryCodeSet{}).TableName()+
			" SET failed_verification_count = 0, verification_locked_until = NULL, updated_at = ? WHERE id = ?",
		time.Now(), mfaRecoveryCodeSetID,
	).ExecWithCount()
	if err != nil {
		return errors.Wrap(err, "error resetting recovery code set state")
	}
	if count == 0 {
		return RecoveryCodeSetNotFoundError{}
	}

	return nil
}
