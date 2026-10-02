package models

import (
	"bytes"
	"fmt"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"

	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
	"github.com/supabase/auth/internal/utilities"
)

type RecoveryCodeTestSuite struct {
	suite.Suite
	db     *storage.Connection
	user   *User
	factor *Factor
}

func TestRecoveryCode(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)
	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)
	ts := &RecoveryCodeTestSuite{
		db: conn,
	}
	defer ts.db.Close()
	suite.Run(t, ts)
}

func (ts *RecoveryCodeTestSuite) SetupTest() {
	TruncateAll(ts.db)
	user, err := NewUser("", "recovery-codes@example.com", "secret", "test", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))
	ts.user = user

	factor := NewRecoveryCodeFactor(user, "")
	require.NoError(ts.T(), ts.db.Create(factor))
	ts.factor = factor
}

func (ts *RecoveryCodeTestSuite) createSet(hashes ...string) *RecoveryCodeSet {
	set, err := CreateRecoveryCodeSet(ts.db, ts.factor, hashes)
	require.NoError(ts.T(), err)
	return set
}

func (ts *RecoveryCodeTestSuite) reloadSet(id uuid.UUID) *RecoveryCodeSet {
	set := &RecoveryCodeSet{}
	require.NoError(ts.T(), ts.db.Find(set, id))
	return set
}

func (ts *RecoveryCodeTestSuite) TestCreateRecoveryCodeSet() {
	set := ts.createSet("hash-1", "hash-2", "hash-3")

	require.Equal(ts.T(), ts.user.ID, set.UserID)
	require.Equal(ts.T(), ts.factor.ID, set.MFAFactorID)
	require.Equal(ts.T(), 0, set.FailedVerificationCount)
	require.Nil(ts.T(), set.VerificationLockedUntil)

	found, err := FindRecoveryCodeSetByUser(ts.db, ts.user.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), set.ID, found.ID)

	codes, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), codes, 3)
	hashes := make([]string, 0, len(codes))
	for _, code := range codes {
		require.Nil(ts.T(), code.ConsumedAt)
		require.False(ts.T(), code.CreatedAt.IsZero())
		hashes = append(hashes, code.CodeHash)
	}
	require.ElementsMatch(ts.T(), []string{"hash-1", "hash-2", "hash-3"}, hashes)

	total, remaining, err := CountRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), 3, total)
	require.Equal(ts.T(), 3, remaining)
}

func (ts *RecoveryCodeTestSuite) TestRealHashRoundTrip() {
	code := crypto.GenerateRecoveryCode(16)
	hash, err := crypto.GenerateRecoveryCodeHash(code)
	require.NoError(ts.T(), err)
	set := ts.createSet(hash)

	codes, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), codes, 1)
	require.NoError(ts.T(), crypto.CompareHashAndRecoveryCode(codes[0].CodeHash, code))
	require.ErrorIs(ts.T(),
		crypto.CompareHashAndRecoveryCode(codes[0].CodeHash, "wrongcode2345678"),
		crypto.ErrRecoveryCodeMismatchedHashAndCode)
}

func (ts *RecoveryCodeTestSuite) TestCreateRecoveryCodeSetDuplicateUser() {
	ts.createSet("hash-1")

	otherFactor := NewRecoveryCodeFactor(ts.user, "Second recovery factor")
	require.NoError(ts.T(), ts.db.Create(otherFactor))

	_, err := CreateRecoveryCodeSet(ts.db, otherFactor, []string{"hash-2"})
	require.Error(ts.T(), err)
	pgErr := utilities.NewPostgresError(err)
	require.NotNil(ts.T(), pgErr)
	require.True(ts.T(), pgErr.IsUniqueConstraintViolated())
}

func (ts *RecoveryCodeTestSuite) TestFindRecoveryCodeSetByUserNotFound() {
	_, err := FindRecoveryCodeSetByUser(ts.db, uuid.Must(uuid.NewV4()))
	require.ErrorAs(ts.T(), err, &RecoveryCodeSetNotFoundError{})
	require.True(ts.T(), IsNotFoundError(err))
}

func (ts *RecoveryCodeTestSuite) TestFindRecoveryCodeSetForUpdate() {
	set := ts.createSet("hash-1")

	require.NoError(ts.T(), ts.db.Transaction(func(tx *storage.Connection) error {
		locked, err := FindRecoveryCodeSetForUpdate(tx, ts.user.ID)
		require.NoError(ts.T(), err)
		require.Equal(ts.T(), set.ID, locked.ID)
		return nil
	}))

	require.NoError(ts.T(), ts.db.Transaction(func(tx *storage.Connection) error {
		_, err := FindRecoveryCodeSetForUpdate(tx, uuid.Must(uuid.NewV4()))
		require.ErrorAs(ts.T(), err, &RecoveryCodeSetNotFoundError{})
		require.True(ts.T(), IsNotFoundError(err))
		return nil
	}))
}

func (ts *RecoveryCodeTestSuite) TestForUpdateSerializesConcurrentFailures() {
	set := ts.createSet("hash-1")
	now := time.Now()

	// Two concurrent transactions both lock the row and register a failure.
	// The blocking FOR UPDATE must serialize them.
	// with no lock one increment would be lost (both would read 0 and write 1).
	errs := make(chan error, 2)
	registerFailure := func(hold time.Duration) {
		errs <- ts.db.Transaction(func(tx *storage.Connection) error {
			locked, err := FindRecoveryCodeSetForUpdate(tx, ts.user.ID)
			if err != nil {
				return err
			}
			time.Sleep(hold)
			return locked.RegisterFailure(tx, now, 10, 15*time.Minute)
		})
	}
	go registerFailure(100 * time.Millisecond)
	go registerFailure(0)
	for range 2 {
		require.NoError(ts.T(), <-errs)
	}

	reloaded := ts.reloadSet(set.ID)
	require.Equal(ts.T(), 2, reloaded.FailedVerificationCount)
}

func (ts *RecoveryCodeTestSuite) TestCountRecoveryCodes() {
	set := ts.createSet("hash-1", "hash-2", "hash-3", "hash-4")

	codes, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), codes[0].MarkConsumed(ts.db))

	total, remaining, err := CountRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), 4, total)
	require.Equal(ts.T(), 3, remaining)

	total, remaining, err = CountRecoveryCodes(ts.db, uuid.Must(uuid.NewV4()))
	require.NoError(ts.T(), err)
	require.Zero(ts.T(), total)
	require.Zero(ts.T(), remaining)
}

func (ts *RecoveryCodeTestSuite) TestMarkConsumed() {
	set := ts.createSet("hash-1", "hash-2")

	codes, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	code := codes[0]

	require.NoError(ts.T(), code.MarkConsumed(ts.db))
	require.NotNil(ts.T(), code.ConsumedAt)

	reloaded := &RecoveryCodeEntry{}
	require.NoError(ts.T(), ts.db.Find(reloaded, code.ID))
	require.NotNil(ts.T(), reloaded.ConsumedAt)
	require.WithinDuration(ts.T(), *code.ConsumedAt, *reloaded.ConsumedAt, time.Microsecond)

	unused, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), unused, 1)
	require.NotEqual(ts.T(), code.ID, unused[0].ID)
}

func (ts *RecoveryCodeTestSuite) TestMarkConsumedTwice() {
	set := ts.createSet("hash-1")

	codes, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	code := codes[0]

	// A second request holding its own copy of the same unconsumed row.
	staleCopies, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	staleCopy := staleCopies[0]

	require.NoError(ts.T(), code.MarkConsumed(ts.db))

	err = code.MarkConsumed(ts.db)
	require.ErrorIs(ts.T(), err, RecoveryCodeAlreadyConsumedError{})
	require.False(ts.T(), IsNotFoundError(err))

	err = staleCopy.MarkConsumed(ts.db)
	require.ErrorIs(ts.T(), err, RecoveryCodeAlreadyConsumedError{})
	require.Nil(ts.T(), staleCopy.ConsumedAt)
}

func (ts *RecoveryCodeTestSuite) TestIsLocked() {
	now := time.Now()
	set := &RecoveryCodeSet{}
	require.False(ts.T(), set.IsLocked(now))

	until := now.Add(time.Minute)
	set.VerificationLockedUntil = &until
	require.True(ts.T(), set.IsLocked(now))
	// The boundary is exclusive: the first attempt at or after expiry is processed.
	require.False(ts.T(), set.IsLocked(until))
	require.False(ts.T(), set.IsLocked(until.Add(time.Second)))
}

func (ts *RecoveryCodeTestSuite) TestRegisterFailureIncrementAndTrip() {
	set := ts.createSet("hash-1")
	now := time.Now()
	const maxAttempts = 3
	lockout := 15 * time.Minute

	for i := 1; i <= 2; i++ {
		require.NoError(ts.T(), set.RegisterFailure(ts.db, now, maxAttempts, lockout))
		require.Equal(ts.T(), i, set.FailedVerificationCount)
		require.False(ts.T(), set.IsLocked(now))
	}
	reloaded := ts.reloadSet(set.ID)
	require.Equal(ts.T(), 2, reloaded.FailedVerificationCount)
	require.Nil(ts.T(), reloaded.VerificationLockedUntil)

	require.NoError(ts.T(), set.RegisterFailure(ts.db, now, maxAttempts, lockout))
	require.Equal(ts.T(), 3, set.FailedVerificationCount)
	require.True(ts.T(), set.IsLocked(now))
	require.False(ts.T(), set.IsLocked(now.Add(lockout)))

	reloaded = ts.reloadSet(set.ID)
	require.Equal(ts.T(), 3, reloaded.FailedVerificationCount)
	require.NotNil(ts.T(), reloaded.VerificationLockedUntil)
	require.WithinDuration(ts.T(), now.Add(lockout), *reloaded.VerificationLockedUntil, time.Microsecond)

	// a failure past the threshold keeps the set locked even if
	// maxAttempts was lowered between requests.
	require.NoError(ts.T(), set.RegisterFailure(ts.db, now, maxAttempts, lockout))
	require.Equal(ts.T(), 4, set.FailedVerificationCount)
	require.True(ts.T(), set.IsLocked(now))
}

func (ts *RecoveryCodeTestSuite) TestClearExpiredLockout() {
	set := ts.createSet("hash-1")
	now := time.Now()
	const maxAttempts = 5
	lockout := 15 * time.Minute

	// Not locked: no-op that must not zero an in-progress counter.
	require.NoError(ts.T(), set.RegisterFailure(ts.db, now, maxAttempts, lockout))
	require.NoError(ts.T(), set.ClearExpiredLockout(ts.db, now))
	require.Equal(ts.T(), 1, set.FailedVerificationCount)

	for range maxAttempts - 1 {
		require.NoError(ts.T(), set.RegisterFailure(ts.db, now, maxAttempts, lockout))
	}
	require.True(ts.T(), set.IsLocked(now))

	// Locked but not yet expired: no-op.
	require.NoError(ts.T(), set.ClearExpiredLockout(ts.db, now.Add(lockout-time.Minute)))
	require.True(ts.T(), set.IsLocked(now))
	require.Equal(ts.T(), maxAttempts, set.FailedVerificationCount)

	// At exactly the expiry instant: cleared.
	require.NoError(ts.T(), set.ClearExpiredLockout(ts.db, now.Add(lockout)))
	require.Equal(ts.T(), 0, set.FailedVerificationCount)
	require.Nil(ts.T(), set.VerificationLockedUntil)

	reloaded := ts.reloadSet(set.ID)
	require.Equal(ts.T(), 0, reloaded.FailedVerificationCount)
	require.Nil(ts.T(), reloaded.VerificationLockedUntil)
}

func (ts *RecoveryCodeTestSuite) TestResetLockout() {
	set := ts.createSet("hash-1")
	now := time.Now()
	for range 3 {
		require.NoError(ts.T(), set.RegisterFailure(ts.db, now, 3, 15*time.Minute))
	}
	require.True(ts.T(), set.IsLocked(now))

	require.NoError(ts.T(), set.ResetLockout(ts.db))
	require.Equal(ts.T(), 0, set.FailedVerificationCount)
	require.Nil(ts.T(), set.VerificationLockedUntil)

	reloaded := ts.reloadSet(set.ID)
	require.Equal(ts.T(), 0, reloaded.FailedVerificationCount)
	require.Nil(ts.T(), reloaded.VerificationLockedUntil)
}

func (ts *RecoveryCodeTestSuite) TestReplaceRecoveryCodes() {
	set := ts.createSet("hash-1", "hash-2", "hash-3")
	now := time.Now()

	codes, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	consumed := codes[0]
	require.NoError(ts.T(), consumed.MarkConsumed(ts.db))
	for range 3 {
		require.NoError(ts.T(), set.RegisterFailure(ts.db, now, 3, 15*time.Minute))
	}
	require.True(ts.T(), set.IsLocked(now))

	// One new hash deliberately equals a consumed old one: delete-before-insert
	// means no (set_id, code_hash) unique violation.
	require.NoError(ts.T(), ReplaceRecoveryCodes(ts.db, set.ID, []string{consumed.CodeHash, "hash-new"}))

	unused, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), unused, 2)
	require.ElementsMatch(ts.T(),
		[]string{consumed.CodeHash, "hash-new"},
		[]string{unused[0].CodeHash, unused[1].CodeHash})
	require.NotEqual(ts.T(), consumed.ID, unused[0].ID)
	require.NotEqual(ts.T(), consumed.ID, unused[1].ID)

	total, remaining, err := CountRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), 2, total)
	require.Equal(ts.T(), 2, remaining)

	reloaded := ts.reloadSet(set.ID)
	require.Equal(ts.T(), 0, reloaded.FailedVerificationCount)
	require.Nil(ts.T(), reloaded.VerificationLockedUntil)

	err = ReplaceRecoveryCodes(ts.db, uuid.Must(uuid.NewV4()), nil)
	require.ErrorAs(ts.T(), err, &RecoveryCodeSetNotFoundError{})
}

func (ts *RecoveryCodeTestSuite) TestReplaceRecoveryCodesSerializesConcurrentReplacements() {
	set := ts.createSet("hash-old")
	firstReplaced := make(chan struct{})
	releaseFirst := make(chan struct{})
	errs := make(chan error, 2)

	go func() {
		errs <- ts.db.Transaction(func(tx *storage.Connection) error {
			if err := ReplaceRecoveryCodes(tx, set.ID, []string{"hash-a"}); err != nil {
				return err
			}
			close(firstReplaced)
			<-releaseFirst
			return nil
		})
	}()
	<-firstReplaced

	secondStarted := make(chan struct{})
	go func() {
		errs <- ts.db.Transaction(func(tx *storage.Connection) error {
			close(secondStarted)
			return ReplaceRecoveryCodes(tx, set.ID, []string{"hash-b"})
		})
	}()
	<-secondStarted
	// Give the second transaction time to reach the lock held by the first.
	time.Sleep(100 * time.Millisecond)
	close(releaseFirst)

	for range 2 {
		require.NoError(ts.T(), <-errs)
	}

	unused, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), unused, 1)
	require.Equal(ts.T(), "hash-b", unused[0].CodeHash)
}

func (ts *RecoveryCodeTestSuite) TestFindUnusedRecoveryCodesOrdering() {
	hashes := make([]string, 10)
	for i := range hashes {
		hashes[i] = fmt.Sprintf("hash-%d", i)
	}
	set := ts.createSet(hashes...)

	first, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), first, 10)
	second, err := FindUnusedRecoveryCodes(ts.db, set.ID)
	require.NoError(ts.T(), err)

	for i := range first {
		require.Equal(ts.T(), first[i].ID, second[i].ID)
		if i == 0 {
			continue
		}
		prev, cur := first[i-1], first[i]
		require.False(ts.T(), cur.CreatedAt.Before(prev.CreatedAt))
		if cur.CreatedAt.Equal(prev.CreatedAt) {
			require.True(ts.T(), bytes.Compare(prev.ID.Bytes(), cur.ID.Bytes()) < 0)
		}
	}
}

func (ts *RecoveryCodeTestSuite) TestLockoutLifecycle() {
	set := ts.createSet("hash-1")
	t0 := time.Now()
	const maxAttempts = 5
	lockout := 15 * time.Minute

	// 5 wrong codes trip the lockout.
	for range maxAttempts {
		require.NoError(ts.T(), set.ClearExpiredLockout(ts.db, t0))
		require.NoError(ts.T(), set.RegisterFailure(ts.db, t0, maxAttempts, lockout))
	}
	require.True(ts.T(), set.IsLocked(t0.Add(time.Minute)))

	// First attempt at expiry: lock cleared, counter restarts from zero.
	t1 := t0.Add(lockout)
	require.False(ts.T(), set.IsLocked(t1))
	require.NoError(ts.T(), set.ClearExpiredLockout(ts.db, t1))
	require.NoError(ts.T(), set.RegisterFailure(ts.db, t1, maxAttempts, lockout))
	require.Equal(ts.T(), 1, set.FailedVerificationCount)
	require.False(ts.T(), set.IsLocked(t1))

	reloaded := ts.reloadSet(set.ID)
	require.Equal(ts.T(), 1, reloaded.FailedVerificationCount)
	require.Nil(ts.T(), reloaded.VerificationLockedUntil)
}

func (ts *RecoveryCodeTestSuite) TestCascadeDelete() {
	set := ts.createSet("hash-1", "hash-2")

	require.NoError(ts.T(), ts.db.Destroy(ts.user))

	setCount, err := ts.db.Q().Where("id = ?", set.ID).Count(&RecoveryCodeSet{})
	require.NoError(ts.T(), err)
	require.Zero(ts.T(), setCount)

	codeCount, err := ts.db.Q().Where("mfa_recovery_code_set_id = ?", set.ID).Count(&RecoveryCodeEntry{})
	require.NoError(ts.T(), err)
	require.Zero(ts.T(), codeCount)
}
