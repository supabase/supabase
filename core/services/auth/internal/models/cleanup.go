package models

import (
	"context"
	"fmt"
	"sync/atomic"

	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"

	"go.opentelemetry.io/otel/attribute"

	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
)

type Cleaner interface {
	Clean(*storage.Connection) (int, error)
}

type Cleanup struct {
	cleanupStatements []string

	// cleanupNext holds an atomically incrementing value that determines which of
	// the cleanupStatements will be run next.
	cleanupNext uint32

	// cleanupAffectedRows tracks an OpenTelemetry metric on the total number of
	// cleaned up rows.
	cleanupAffectedRows atomic.Int64
}

func NewCleanup(config *conf.GlobalConfiguration) *Cleanup {
	tableUsers := User{}.TableName()
	tableRefreshTokens := RefreshToken{}.TableName()
	tableSessions := Session{}.TableName()
	tableRelayStates := SAMLRelayState{}.TableName()
	tableFlowStates := FlowState{}.TableName()
	tableMFAChallenges := Challenge{}.TableName()
	tableMFAFactors := Factor{}.TableName()
	tableOAuthClientStates := OAuthClientState{}.TableName()
	tableWebAuthnChallenges := WebAuthnChallenge{}.TableName()

	c := &Cleanup{}

	// These statements intentionally use SELECT ... FOR UPDATE SKIP LOCKED
	// as this makes sure that only rows that are not being used in another
	// transaction are deleted. These deletes are thus very quick and
	// efficient, as they don't wait on other transactions.
	c.cleanupStatements = append(c.cleanupStatements,
		fmt.Sprintf("delete from %q where id in (select id from %q where revoked is true and updated_at < now() - interval '24 hours' limit 100 for update skip locked);", tableRefreshTokens, tableRefreshTokens),
		fmt.Sprintf("update %q set revoked = true, updated_at = now() where id in (select %q.id from %q join %q on %q.session_id = %q.id where %q.not_after < now() - interval '24 hours' and %q.revoked is false limit 100 for update skip locked);", tableRefreshTokens, tableRefreshTokens, tableRefreshTokens, tableSessions, tableRefreshTokens, tableSessions, tableSessions, tableRefreshTokens),
		// sessions are deleted after 72 hours to allow refresh tokens
		// to be deleted piecemeal; 10 at once so that cascades don't
		// overwork the database
		fmt.Sprintf("delete from %q where id in (select id from %q where not_after < now() - interval '72 hours' limit 10 for update skip locked);", tableSessions, tableSessions),
		fmt.Sprintf("delete from %q where id in (select id from %q where created_at < now() - interval '24 hours' limit 100 for update skip locked);", tableRelayStates, tableRelayStates),
		fmt.Sprintf("delete from %q where id in (select id from %q where created_at < now() - interval '24 hours' limit 100 for update skip locked);", tableFlowStates, tableFlowStates),
		fmt.Sprintf("delete from %q where id in (select id from %q where created_at < now() - interval '24 hours' limit 100 for update skip locked);", tableOAuthClientStates, tableOAuthClientStates),
		fmt.Sprintf("delete from %q where id in (select id from %q where created_at < now() - interval '24 hours' limit 100 for update skip locked);", tableMFAChallenges, tableMFAChallenges),
		fmt.Sprintf("delete from %q where id in (select id from %q where created_at < now() - interval '24 hours' and status = 'unverified' limit 100 for update skip locked);", tableMFAFactors, tableMFAFactors),
		fmt.Sprintf("delete from %q where id in (select id from %q where expires_at < now() limit 100 for update skip locked);", tableWebAuthnChallenges, tableWebAuthnChallenges),
	)

	if config.External.AnonymousUsers.Enabled {
		// delete anonymous users older than 30 days
		c.cleanupStatements = append(c.cleanupStatements,
			fmt.Sprintf("delete from %q where id in (select id from %q where created_at < now() - interval '30 days' and is_anonymous is true limit 100 for update skip locked);", tableUsers, tableUsers),
		)
	}

	if config.Sessions.Timebox != nil {
		timeboxSeconds := int((*config.Sessions.Timebox).Seconds())

		c.cleanupStatements = append(c.cleanupStatements, fmt.Sprintf("delete from %q where id in (select id from %q where created_at + interval '%d seconds' < now() - interval '24 hours' limit 100 for update skip locked);", tableSessions, tableSessions, timeboxSeconds))
	}

	if config.Sessions.InactivityTimeout != nil {
		inactivitySeconds := int((*config.Sessions.InactivityTimeout).Seconds())

		// delete sessions with a refreshed_at column
		c.cleanupStatements = append(c.cleanupStatements, fmt.Sprintf("delete from %q where id in (select id from %q where refreshed_at is not null and refreshed_at + interval '%d seconds' < now() - interval '24 hours' limit 100 for update skip locked);", tableSessions, tableSessions, inactivitySeconds))

		// delete sessions without a refreshed_at column by looking for
		// unrevoked refresh_tokens
		c.cleanupStatements = append(c.cleanupStatements, fmt.Sprintf("delete from %q where id in (select %q.id as id from %q, %q where %q.session_id = %q.id and %q.refreshed_at is null and %q.revoked is false and %q.updated_at + interval '%d seconds' < now() - interval '24 hours' limit 100 for update skip locked)", tableSessions, tableSessions, tableSessions, tableRefreshTokens, tableRefreshTokens, tableSessions, tableSessions, tableRefreshTokens, tableRefreshTokens, inactivitySeconds))
	}

	meter := otel.Meter("gotrue")

	_, err := meter.Int64ObservableCounter(
		"gotrue_cleanup_affected_rows",
		metric.WithDescription("Number of affected rows from cleaning up stale entities"),
		metric.WithInt64Callback(func(_ context.Context, o metric.Int64Observer) error {
			o.Observe(c.cleanupAffectedRows.Load())
			return nil
		}),
	)

	if err != nil {
		logrus.WithError(err).Error("unable to get gotrue.gotrue_cleanup_rows counter metric")
	}

	return c
}

// Cleanup removes stale entities in the database. You can call it on each
// request or as a periodic background job. It does quick lockless updates or
// deletes, has an execution timeout and acquire timeout so that cleanups do
// not affect performance of other database jobs. Note that calling this does
// not clean up the whole database, but does a small piecemeal clean up each
// time when called.
func (c *Cleanup) Clean(db *storage.Connection) (int, error) {
	ctx, span := observability.Tracer("gotrue").Start(db.Context(), "database-cleanup")
	defer span.End()

	affectedRows := 0
	defer span.SetAttributes(attribute.Int64("gotrue.cleanup.affected_rows", int64(affectedRows)))

	if err := db.WithContext(ctx).Transaction(func(tx *storage.Connection) error {
		nextIndex := atomic.AddUint32(&c.cleanupNext, 1) % uint32(len(c.cleanupStatements)) // #nosec G115
		statement := c.cleanupStatements[nextIndex]

		count, terr := tx.RawQuery(statement).ExecWithCount()
		if terr != nil {
			return terr
		}

		affectedRows += count

		return nil
	}); err != nil {
		return affectedRows, err
	}
	c.cleanupAffectedRows.Add(int64(affectedRows))

	return affectedRows, nil
}
