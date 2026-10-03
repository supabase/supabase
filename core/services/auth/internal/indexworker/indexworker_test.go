package indexworker

import (
	"cmp"
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/gobuffalo/pop/v6"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
)

type IndexWorkerTestSuite struct {
	suite.Suite
	config                       *conf.GlobalConfiguration
	db                           *storage.Connection
	popDB                        *pop.Connection
	namespace                    string
	logger                       *logrus.Entry
	maxUsersThreshold            int64
	ensureUserSearchIndexesExist bool
	isOrioleDB                   bool
}

func (ts *IndexWorkerTestSuite) SetupSuite() {
	// Load test configuration
	config, err := confload.LoadGlobal("../../hack/test.env")
	require.NoError(ts.T(), err)
	ts.config = config
	ts.maxUsersThreshold = config.IndexWorker.MaxUsersThreshold
	ts.ensureUserSearchIndexesExist = config.IndexWorker.EnsureUserSearchIndexesExist
	ts.namespace = config.DB.Namespace
	ts.logger = logrus.NewEntry(logrus.New())
	ts.logger.Logger.SetLevel(logrus.DebugLevel)

	// Setup database connection
	conn, err := storage.Dial(config)
	require.NoError(ts.T(), err)
	ts.db = conn

	// Setup pop connection for internal functions
	deets := &pop.ConnectionDetails{
		Dialect: config.DB.Driver,
		URL:     config.DB.URL,
	}
	deets.Options = map[string]string{
		"Namespace": config.DB.Namespace,
	}
	popConn, err := pop.NewConnection(deets)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), popConn.Open())
	ts.popDB = popConn

	// Detect if the users table uses OrioleDB
	isOrioleDB, err := isOrioleDBTable(popConn, config.DB.Namespace, "users")
	if err != nil {
		ts.T().Logf("Failed to detect OrioleDB, assuming standard PostgreSQL: %v", err)
	} else {
		ts.isOrioleDB = isOrioleDB
	}

	// Ensure we have a clean state for testing
	ts.cleanupIndexes()
}

func (ts *IndexWorkerTestSuite) TearDownSuite() {
	if ts.db != nil {
		ts.cleanupIndexes()
		ts.db.Close()
	}
	if ts.popDB != nil {
		ts.popDB.Close()
	}
}

func (ts *IndexWorkerTestSuite) SetupTest() {
	models.TruncateAll(ts.db)
	ts.cleanupIndexes()
	ts.config.IndexWorker.MaxUsersThreshold = ts.maxUsersThreshold
	ts.config.IndexWorker.EnsureUserSearchIndexesExist = ts.ensureUserSearchIndexesExist
}

func (ts *IndexWorkerTestSuite) cleanupIndexes() {
	indexes := getUsersIndexes(ts.namespace)
	for _, idx := range indexes {
		// Drop any existing indexes (valid or invalid)
		dropQuery := fmt.Sprintf("DROP INDEX IF EXISTS %q.%s", ts.namespace, idx.name)
		_ = ts.db.RawQuery(dropQuery).Exec()
	}
}

func (ts *IndexWorkerTestSuite) TestCreateIndexesHappyPath() {
	if ts.isOrioleDB {
		ts.T().Skip("OrioleDB does not support CREATE INDEX CONCURRENTLY")
	}
	ctx := context.Background()

	err := CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err)

	indexes := getUsersIndexes(ts.namespace)
	existingIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), len(indexes), len(existingIndexes), "All indexes should be created")
	for _, idx := range existingIndexes {
		assert.True(ts.T(), idx.IsValid, "Index %s should be valid", idx.IndexName)
		assert.True(ts.T(), idx.IsReady, "Index %s should be ready", idx.IndexName)
	}
}

func (ts *IndexWorkerTestSuite) TestGetIndexStatuses() {
	// Create a test index manually
	testIndexName := "test_idx_users_email"
	createQuery := fmt.Sprintf(`CREATE INDEX %s ON %q.users (email)`, testIndexName, ts.namespace)
	err := ts.db.RawQuery(createQuery).Exec()
	require.NoError(ts.T(), err)
	defer func() {
		dropQuery := fmt.Sprintf("DROP INDEX IF EXISTS %q.%s", ts.namespace, testIndexName)
		_ = ts.db.RawQuery(dropQuery).Exec()
	}()

	// existing index should be reported as valid and ready
	statuses, err := getIndexStatuses(ts.popDB, ts.namespace, []string{testIndexName})
	require.NoError(ts.T(), err)
	require.Len(ts.T(), statuses, 1)
	assert.Equal(ts.T(), testIndexName, statuses[0].IndexName)
	assert.True(ts.T(), statuses[0].IsValid)
	assert.True(ts.T(), statuses[0].IsReady)

	// non-existent index should return empty result
	statuses, err = getIndexStatuses(ts.popDB, ts.namespace, []string{"non_existent_index"})
	require.NoError(ts.T(), err)
	assert.Empty(ts.T(), statuses, "Non-existent index should return empty result")
}

func (ts *IndexWorkerTestSuite) TestIdempotency() {
	if ts.isOrioleDB {
		ts.T().Skip("OrioleDB does not support CREATE INDEX CONCURRENTLY")
	}
	ctx := context.Background()

	// First run - create all indexes
	err := CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err)

	// Get the state after first run
	indexes := getUsersIndexes(ts.namespace)
	firstRunIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), len(indexes), len(firstRunIndexes))

	// Record creation times (we'll use OID as a proxy for creation order/time)
	firstRunOIDs := make(map[string]string)
	for _, idx := range firstRunIndexes {
		var oid string
		query := fmt.Sprintf(`
			SELECT c.oid::text
			FROM pg_class c
			JOIN pg_namespace n ON n.oid = c.relnamespace
			WHERE n.nspname = '%s' AND c.relname = '%s'
		`, ts.namespace, idx.IndexName)
		err := ts.db.RawQuery(query).First(&oid)
		require.NoError(ts.T(), err)
		firstRunOIDs[idx.IndexName] = oid
	}

	// Second run - should skip creation (returns nil when indexes already exist)
	err = CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err)

	// Get the state after second run
	secondRunIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), len(indexes), len(secondRunIndexes))

	// Verify OIDs haven't changed (indexes weren't recreated)
	for _, idx := range secondRunIndexes {
		var oid string
		query := fmt.Sprintf(`
			SELECT c.oid::text
			FROM pg_class c
			JOIN pg_namespace n ON n.oid = c.relnamespace
			WHERE n.nspname = '%s' AND c.relname = '%s'
		`, ts.namespace, idx.IndexName)
		err := ts.db.RawQuery(query).First(&oid)
		require.NoError(ts.T(), err)

		originalOID, exists := firstRunOIDs[idx.IndexName]
		require.True(ts.T(), exists, "Index %s should have existed in first run", idx.IndexName)
		assert.Equal(ts.T(), originalOID, oid, "Index %s OID should not change (not recreated)", idx.IndexName)
	}
}

// If an index is removed out of band, it will be created when the method is called
func (ts *IndexWorkerTestSuite) TestOutOfBandIndexRemoval() {
	if ts.isOrioleDB {
		ts.T().Skip("OrioleDB does not support CREATE INDEX CONCURRENTLY")
	}
	ctx := context.Background()

	// First, create all indexes
	err := CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err)

	// Verify all indexes exist
	indexes := getUsersIndexes(ts.namespace)
	existingIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), len(indexes), len(existingIndexes))

	// Remove one index out of band
	indexToRemove := "idx_users_email"
	dropQuery := fmt.Sprintf("DROP INDEX IF EXISTS %q.%s", ts.namespace, indexToRemove)
	err = ts.db.RawQuery(dropQuery).Exec()
	require.NoError(ts.T(), err)

	// Verify index is gone
	statuses, err := getIndexStatuses(ts.popDB, ts.namespace, []string{indexToRemove})
	require.NoError(ts.T(), err)
	assert.Empty(ts.T(), statuses, "Index should have been dropped")

	// Run CreateIndexes again - should recreate the missing index
	err = CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err)

	// Verify all indexes exist again
	existingIndexes, err = getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), len(indexes), len(existingIndexes), "All indexes should be recreated")

	// Specifically check that the removed index was recreated
	found := false
	for _, idx := range existingIndexes {
		if idx.IndexName == indexToRemove {
			found = true
			assert.True(ts.T(), idx.IsValid, "Recreated index should be valid")
			assert.True(ts.T(), idx.IsReady, "Recreated index should be ready")
			break
		}
	}
	assert.True(ts.T(), found, "The removed index should have been recreated")
}

// Test concurrent access - workers coordinate via advisory lock
func (ts *IndexWorkerTestSuite) TestConcurrentWorkers() {
	if ts.isOrioleDB {
		ts.T().Skip("OrioleDB does not support CREATE INDEX CONCURRENTLY")
	}
	ctx := context.Background()

	numWorkers := 5
	var wg sync.WaitGroup
	wg.Add(numWorkers)

	var successCount, lockSkipCount, errorCount int32

	for i := 0; i < numWorkers; i++ {
		go func() {
			defer wg.Done()

			// Each worker needs its own logger to avoid race conditions
			logger := logrus.NewEntry(logrus.New())
			logger.Logger.SetLevel(logrus.DebugLevel)

			err := CreateIndexes(ctx, ts.config, logger)
			switch {
			case err == nil:
				atomic.AddInt32(&successCount, 1)
			case errors.Is(err, ErrAdvisoryLockAlreadyAcquired):
				atomic.AddInt32(&lockSkipCount, 1)
			default:
				atomic.AddInt32(&errorCount, 1)
				ts.T().Errorf("Unexpected error from CreateIndexes: %v", err)
			}
		}()
	}

	wg.Wait()

	assert.GreaterOrEqual(ts.T(), successCount, int32(1), "At least one worker should succeed")
	assert.Equal(ts.T(), int32(0), errorCount, "No unexpected errors should occur")
	assert.Equal(ts.T(), int32(numWorkers), successCount+lockSkipCount, "All workers should either succeed or skip due to lock")

	// Verify indexes were created correctly regardless of which worker did it
	indexes := getUsersIndexes(ts.namespace)
	existingIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), len(indexes), len(existingIndexes), "All indexes should be created")
}

// Helper function to get index names from index definitions
func getIndexNames(indexes []struct {
	name  string
	query string
}) []string {
	names := make([]string, len(indexes))
	for i, idx := range indexes {
		names[i] = idx.name
	}
	return names
}

// TestMaxUsersThresholdSkipsIndexCreation verifies when EnsureUserSearchIndexesExist=false and MaxUsersThreshold > 0,
// index creation is skipped if user count exceeds the threshold.
func (ts *IndexWorkerTestSuite) TestMaxUsersThresholdSkipsIndexCreation() {
	if ts.isOrioleDB {
		ts.T().Skip("OrioleDB does not support CREATE INDEX CONCURRENTLY")
	}
	ctx := context.Background()

	// No explicit user opt-in - rely on threshold behavior
	ts.config.IndexWorker.EnsureUserSearchIndexesExist = false

	// SetupTest already called TruncateAll, so the users table is empty.
	// Insert test users so the approximate count exceeds the threshold.
	for i := 0; i < 5; i++ {
		insertQuery := fmt.Sprintf(
			`INSERT INTO %q.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'threshold_test_%d@example.com', '', now(), now())`,
			ts.namespace, i,
		)
		require.NoError(ts.T(), ts.db.RawQuery(insertQuery).Exec())
	}
	// Update pg_class.reltuples so getApproximateUserCount reflects the inserts
	analyzeQuery := fmt.Sprintf(`ANALYZE %q.users`, ts.namespace)
	require.NoError(ts.T(), ts.db.RawQuery(analyzeQuery).Exec())

	ts.config.IndexWorker.MaxUsersThreshold = 1

	indexes := getUsersIndexes(ts.namespace)
	existingIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Empty(ts.T(), existingIndexes, "No indexes should exist before the test")

	err = CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err)

	existingIndexes, err = getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Empty(ts.T(), existingIndexes, "No indexes should be created when user count exceeds threshold")
}

// TestUserOptInAlwaysCreatesIndexes verifies that when EnsureUserSearchIndexesExist=true,
// indexes are always created regardless of user count or threshold setting.
func (ts *IndexWorkerTestSuite) TestUserOptInAlwaysCreatesIndexes() {
	if ts.isOrioleDB {
		ts.T().Skip("OrioleDB does not support CREATE INDEX CONCURRENTLY")
	}
	ctx := context.Background()

	// Insert test users so there's a non-zero user count
	for i := 0; i < 5; i++ {
		insertQuery := fmt.Sprintf(
			`INSERT INTO %q.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'optin_test_%d@example.com', '', now(), now())`,
			ts.namespace, i,
		)
		require.NoError(ts.T(), ts.db.RawQuery(insertQuery).Exec())
	}
	analyzeQuery := fmt.Sprintf(`ANALYZE %q.users`, ts.namespace)
	require.NoError(ts.T(), ts.db.RawQuery(analyzeQuery).Exec())

	// User opt-in with threshold set below user count — should still create indexes
	ts.config.IndexWorker.EnsureUserSearchIndexesExist = true
	ts.config.IndexWorker.MaxUsersThreshold = 1

	err := CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err)

	indexes := getUsersIndexes(ts.namespace)
	existingIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), len(indexes), len(existingIndexes), "All indexes should be created when user opted in, even if over threshold")
	for _, idx := range existingIndexes {
		assert.True(ts.T(), idx.IsValid, "Index %s should be valid", idx.IndexName)
		assert.True(ts.T(), idx.IsReady, "Index %s should be ready", idx.IndexName)
	}
}

// TestUserOptInWithZeroThreshold verifies that EnsureUserSearchIndexesExist=true
// with MaxUsersThreshold=0 (disabled) still creates indexes.
func (ts *IndexWorkerTestSuite) TestUserOptInWithZeroThreshold() {
	if ts.isOrioleDB {
		ts.T().Skip("OrioleDB does not support CREATE INDEX CONCURRENTLY")
	}
	ctx := context.Background()

	ts.config.IndexWorker.EnsureUserSearchIndexesExist = true
	ts.config.IndexWorker.MaxUsersThreshold = 0

	err := CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err)

	indexes := getUsersIndexes(ts.namespace)
	existingIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), len(indexes), len(existingIndexes), "All indexes should be created when user opted in with threshold disabled")
	for _, idx := range existingIndexes {
		assert.True(ts.T(), idx.IsValid, "Index %s should be valid", idx.IndexName)
		assert.True(ts.T(), idx.IsReady, "Index %s should be ready", idx.IndexName)
	}
}

// TestCreateIndexesWithInvalidIndexes tests that CreateIndexes can recover from invalid indexes
// This test simulates a scenario where indexes become invalid (e.g., from interrupted CONCURRENT creation)
// and verifies that CreateIndexes properly handles them by dropping and recreating.
func (ts *IndexWorkerTestSuite) TestCreateIndexesWithInvalidIndexes() {
	if ts.isOrioleDB {
		ts.T().Skip("OrioleDB does not support CREATE INDEX CONCURRENTLY")
	}
	ctx := context.Background()

	// Step 1: Run CreateIndexes to create all indexes
	err := CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err, "Initial CreateIndexes should succeed")

	// Verify all indexes were created and are valid
	indexes := getUsersIndexes(ts.namespace)
	initialIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), len(indexes), len(initialIndexes), "All indexes should be created initially")
	for _, idx := range initialIndexes {
		assert.True(ts.T(), idx.IsValid, "Index %s should be valid initially", idx.IndexName)
		assert.True(ts.T(), idx.IsReady, "Index %s should be ready initially", idx.IndexName)
	}

	// Step 2: Connect as the postgres superuser to manipulate pg_index.
	// Parse the existing connection URL and replace credentials with the postgres superuser.
	superuserPassword := cmp.Or(os.Getenv("POSTGRES_PASSWORD"), "root")
	manipulatorURL := ts.config.DB.URL
	if u, err := url.Parse(ts.config.DB.URL); err == nil {
		u.User = url.UserPassword("postgres", superuserPassword)
		manipulatorURL = u.String()
	}

	manipulatorDeets := &pop.ConnectionDetails{
		Dialect: ts.config.DB.Driver,
		URL:     manipulatorURL,
	}
	manipulatorDeets.Options = map[string]string{
		"Namespace": ts.config.DB.Namespace,
	}

	manipulatorDB, err := pop.NewConnection(manipulatorDeets)
	require.NoError(ts.T(), err, "Should be able to connect as postgres superuser")
	require.NoError(ts.T(), manipulatorDB.Open())
	defer manipulatorDB.Close()

	// Select the first 2 indexes to mark as invalid
	allIndexes := getUsersIndexes(ts.namespace)
	indexesToInvalidate := []string{allIndexes[0].name, allIndexes[1].name}

	for _, indexName := range indexesToInvalidate {
		// Update pg_index to mark the index as invalid (indisvalid = false) and not ready (indisready = false)
		// This simulates what happens when CREATE INDEX CONCURRENTLY is interrupted
		updateQuery := fmt.Sprintf(`
			UPDATE pg_index
			SET indisvalid = false, indisready = false
			WHERE indexrelid = (
				SELECT c.oid
				FROM pg_class c
				JOIN pg_namespace n ON n.oid = c.relnamespace
				WHERE n.nspname = '%s' AND c.relname = '%s'
			)
		`, ts.namespace, indexName)

		err := manipulatorDB.RawQuery(updateQuery).Exec()
		require.NoError(ts.T(), err, "Should be able to mark index %s as invalid", indexName)

		ts.logger.Infof("Marked index %s as invalid for testing", indexName)
	}

	// Verify the indexes are now invalid
	invalidatedIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, indexesToInvalidate)
	require.NoError(ts.T(), err)
	for _, idx := range invalidatedIndexes {
		assert.False(ts.T(), idx.IsValid, "Index %s should be marked as invalid", idx.IndexName)
		assert.False(ts.T(), idx.IsReady, "Index %s should be marked as not ready", idx.IndexName)
	}

	// Step 3: Re-run CreateIndexes - it should detect and fix the invalid indexes
	err = CreateIndexes(ctx, ts.config, ts.logger)
	require.NoError(ts.T(), err, "CreateIndexes should succeed even with invalid indexes present")

	// Step 4: Verify all indexes are now valid and ready
	finalIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), len(indexes), len(finalIndexes), "All indexes should exist after recovery")

	for _, idx := range finalIndexes {
		assert.True(ts.T(), idx.IsValid, "Index %s should be valid after recovery", idx.IndexName)
		assert.True(ts.T(), idx.IsReady, "Index %s should be ready after recovery", idx.IndexName)
	}

	// Check that the previously invalid indexes were fixed
	recoveredIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, indexesToInvalidate)
	require.NoError(ts.T(), err)
	for _, idx := range recoveredIndexes {
		assert.True(ts.T(), idx.IsValid, "Previously invalid index %s should now be valid", idx.IndexName)
		assert.True(ts.T(), idx.IsReady, "Previously invalid index %s should now be ready", idx.IndexName)
	}

	ts.logger.Infof("Successfully recovered from %d invalid indexes", len(indexesToInvalidate))
}

func (ts *IndexWorkerTestSuite) TestIsOrioleDBTableNonExistentTable() {
	_, err := isOrioleDBTable(ts.popDB, ts.namespace, "nonexistent_table")
	assert.Error(ts.T(), err, "Should return error for non-existent table")
}

func (ts *IndexWorkerTestSuite) TestCreateIndexesSkipsOnOrioleDB() {
	if !ts.isOrioleDB {
		ts.T().Skip("Test only runs on OrioleDB")
	}
	ctx := context.Background()

	err := CreateIndexes(ctx, ts.config, ts.logger)
	require.ErrorIs(ts.T(), err, ErrOrioleDBUnsupported)

	// Verify no indexes were created
	indexes := getUsersIndexes(ts.namespace)
	existingIndexes, err := getIndexStatuses(ts.popDB, ts.namespace, getIndexNames(indexes))
	require.NoError(ts.T(), err)
	assert.Empty(ts.T(), existingIndexes, "No indexes should be created when OrioleDB is detected")
}

// Run the test suite
func TestIndexWorker(t *testing.T) {
	suite.Run(t, new(IndexWorkerTestSuite))
}
