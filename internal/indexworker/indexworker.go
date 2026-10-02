package indexworker

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
)

// ErrAdvisoryLockAlreadyAcquired is returned when another process already holds the advisory lock
var ErrAdvisoryLockAlreadyAcquired = errors.New("advisory lock already acquired by another process")
var ErrOrioleDBUnsupported = errors.New("index worker does not support OrioleDB tables")

type Outcome string

const (
	OutcomeSuccess Outcome = "success"
	OutcomeFailure Outcome = "failure"
	OutcomeSkipped Outcome = "skipped"
)

// CreateIndexes ensures that the necessary indexes on the users table exist.
// If the indexes already exist and are valid, it skips creation.
// It uses a Postgres advisory lock to prevent concurrent index creation
// by multiple processes.
// Returns an error either from index creation failure (partial or complete) or if the advisory lock
// could not be acquired.
func CreateIndexes(ctx context.Context, config *conf.GlobalConfiguration, le *logrus.Entry) error {
	u, err := url.Parse(config.DB.URL)
	if err != nil {
		le.WithError(err).Fatal("Error parsing db connection url")
	}

	if config.DB.Driver == "" && config.DB.URL != "" {
		config.DB.Driver = u.Scheme
	}

	q := u.Query()
	q.Add("application_name", "auth_indexworker")
	u.RawQuery = q.Encode()
	deets := &pop.ConnectionDetails{
		Dialect: config.DB.Driver,
		URL:     u.String(),
	}
	deets.Options = map[string]string{
		"Namespace": config.DB.Namespace,
	}

	db, err := pop.NewConnection(deets)
	if err != nil {
		log.Fatalf("Error opening db connection: %+v", err)
	}
	defer db.Close()

	if err := db.Open(); err != nil {
		log.Fatalf("Error checking database connection: %+v", err)
	}
	db = db.WithContext(ctx)

	// Check if the users table uses OrioleDB, which does not support
	// CREATE INDEX CONCURRENTLY or DROP INDEX CONCURRENTLY.
	isOrioleDB, err := isOrioleDBTable(db, config.DB.Namespace, "users")
	if err != nil {
		le.WithError(err).Warn("Failed to check table access method, proceeding with index creation")
	} else if isOrioleDB {
		le.WithFields(logrus.Fields{
			"outcome": OutcomeSkipped,
			"code":    "orioledb_unsupported",
		}).Info("Skipping index creation because auth.users uses the OrioleDB storage engine, which does not support CONCURRENTLY operations")
		return ErrOrioleDBUnsupported
	}

	// Try to obtain advisory lock to ensure only one index worker is creating indexes at a time
	lockName := "auth_index_worker"
	var lockAcquired bool
	lockQuery := fmt.Sprintf("SELECT pg_try_advisory_lock(hashtext('%s')::bigint)", lockName)

	if err := db.RawQuery(lockQuery).First(&lockAcquired); err != nil {
		le.WithFields(logrus.Fields{
			"outcome": OutcomeFailure,
			"code":    "advisory_lock_acquisition_failed",
		}).WithError(err).Error("Failed to attempt advisory lock acquisition")
		return err
	}

	if !lockAcquired {
		le.WithFields(logrus.Fields{
			"outcome": OutcomeSkipped,
			"code":    "advisory_lock_already_acquired",
		}).Info("Another process is currently holding the advisory lock, skipping index creation")
		return ErrAdvisoryLockAlreadyAcquired
	}

	le.Debug("Successfully acquired advisory lock for index creation")

	// Ensure lock is released on function exit
	defer func() {
		unlockQuery := fmt.Sprintf("SELECT pg_advisory_unlock(hashtext('%s')::bigint)", lockName)
		var unlocked bool
		if err := db.RawQuery(unlockQuery).First(&unlocked); err != nil {
			if ctx.Err() != nil {
				le.Debug("Context cancelled, advisory lock will be released upon session termination")
			} else {
				le.WithError(err).Error("Failed to release advisory lock")
			}
		} else if unlocked {
			le.Debug("Successfully released advisory lock")
		} else {
			le.Debug("Advisory lock was not held when attempting to release")
		}
	}()

	indexes := getUsersIndexes(config.DB.Namespace)
	indexNames := make([]string, len(indexes))
	for i, idx := range indexes {
		indexNames[i] = idx.name
	}

	// Check existing indexes and their statuses. If all exist and are valid, skip creation.
	existingIndexes, err := getIndexStatuses(db, config.DB.Namespace, indexNames)
	if err != nil {
		le.WithError(err).Warn("Failed to check existing index statuses, proceeding with index creation")
	} else {
		if len(existingIndexes) == len(indexes) {
			allHealthy := true
			for _, idx := range existingIndexes {
				if !idx.IsValid || !idx.IsReady {
					le.WithFields(logrus.Fields{
						"code":        "index_unhealthy",
						"index_name":  idx.IndexName,
						"index_valid": idx.IsValid,
						"index_ready": idx.IsReady,
					}).Info("Index exists but is not healthy")
					allHealthy = false
					break
				}
			}

			if allHealthy {
				le.WithFields(logrus.Fields{
					"outcome":     OutcomeSkipped,
					"code":        "indexes_already_exist",
					"index_count": len(indexes),
				}).Debug("All indexes on auth.users already exist and are ready, skipping index creation")
				return nil
			}
		} else {
			le.WithFields(logrus.Fields{
				"code":           "indexes_missing",
				"existing_count": len(existingIndexes),
				"expected_count": len(indexes),
			}).Info("Found fewer indexes than expected, proceeding with index creation")
		}
	}

	// When EnsureUserSearchIndexesExist is true, the user explicitly opted in, so we skip the threshold check entirely.
	if !config.IndexWorker.EnsureUserSearchIndexesExist && config.IndexWorker.MaxUsersThreshold > 0 {
		userCount, err := getApproximateUserCount(db, config.DB.Namespace)
		if err != nil {
			le.WithError(err).Warn("Failed to get approximate user count, proceeding with index creation")
		}
		if userCount > config.IndexWorker.MaxUsersThreshold {
			le.WithFields(logrus.Fields{
				"code":                "index_creation_skipped",
				"user_count":          userCount,
				"max_users_threshold": config.IndexWorker.MaxUsersThreshold,
			}).Info("Skipping index creation because user count exceeds threshold")
			return nil
		}
		le.WithFields(logrus.Fields{
			"code":       "index_creation_starting",
			"user_count": userCount,
		}).Info("Starting index creation")
	}

	// First, clean up any invalid indexes from previous interrupted attempts
	dropInvalidIndexes(db, le, config.DB.Namespace, indexNames)

	// Create indexes one by one
	var failedIndexes []string
	var succeededIndexes []string
	totalStartTime := time.Now()

	for _, idx := range indexes {
		startTime := time.Now()
		le.WithFields(logrus.Fields{
			"code":       "index_creating",
			"index_name": idx.name,
		}).Info("Creating index")

		if err := db.RawQuery(idx.query).Exec(); err != nil {
			duration := time.Since(startTime).Milliseconds()
			le.WithFields(logrus.Fields{
				"code":        "index_creation_failed",
				"index_name":  idx.name,
				"duration_ms": duration,
			}).WithError(err).Error("Failed to create index")
			failedIndexes = append(failedIndexes, idx.name)
		} else {
			duration := time.Since(startTime).Milliseconds()
			le.WithFields(logrus.Fields{
				"code":        "index_created",
				"index_name":  idx.name,
				"duration_ms": duration,
			}).Info("Successfully created index")
			succeededIndexes = append(succeededIndexes, idx.name)
		}
	}

	totalDuration := time.Since(totalStartTime).Milliseconds()

	if len(failedIndexes) > 0 {
		le.WithFields(logrus.Fields{
			"outcome":           OutcomeFailure,
			"code":              "index_creation_partial_failure",
			"duration_ms":       totalDuration,
			"failed_indexes":    failedIndexes,
			"succeeded_indexes": succeededIndexes,
		}).Error("Index creation completed with some failures")

		return fmt.Errorf("failed to create indexes: %v", failedIndexes)
	}

	le.WithFields(logrus.Fields{
		"outcome":           OutcomeSuccess,
		"code":              "index_creation_completed",
		"duration_ms":       totalDuration,
		"succeeded_indexes": succeededIndexes,
	}).Info("All indexes created successfully")

	return nil
}

// getUsersIndexes returns the list of indexes to create on the users table
func getUsersIndexes(namespace string) []struct {
	name  string
	query string
} {
	// Define indexes to create
	// Note: CONCURRENTLY cannot be used inside a transaction block
	return []struct {
		name  string
		query string
	}{
		// for exact-match queries, sorting, and prefix searches on email (e.g., email LIKE 'term%')
		{
			name: "idx_users_email",
			query: fmt.Sprintf(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
				ON %q.users USING btree (email);`, namespace),
		},
		// for range queries and sorting on created_at and last_sign_in_at
		{
			name: "idx_users_created_at_desc",
			query: fmt.Sprintf(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_desc
				ON %q.users (created_at DESC);`, namespace),
		},
		{
			name: "idx_users_last_sign_in_at_desc",
			query: fmt.Sprintf(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_sign_in_at_desc
				ON %q.users (last_sign_in_at DESC);`, namespace),
		},
		// for exact-match, sorting, and prefix searches on raw_user_meta_data->>'name'
		{
			name: "idx_users_name",
			query: fmt.Sprintf(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name
				ON %q.users USING btree ((raw_user_meta_data->>'name'))
				WHERE (raw_user_meta_data->>'name') IS NOT NULL;`, namespace),
		},
	}
}

type indexStatus struct {
	IndexName string `db:"index_name"`
	IsValid   bool   `db:"is_valid"`
	IsReady   bool   `db:"is_ready"`
}

// getIndexStatuses checks the status of the given indexes in the specified namespace
func getIndexStatuses(db *pop.Connection, namespace string, indexNames []string) ([]indexStatus, error) {
	indexNamesList := make([]string, len(indexNames))
	for i, idx := range indexNames {
		indexNamesList[i] = fmt.Sprintf("'%s'", idx)
	}
	indexNamesStr := strings.Join(indexNamesList, ",")

	query := fmt.Sprintf(`
		SELECT c.relname as index_name, i.indisvalid as is_valid, i.indisready as is_ready
		FROM pg_index i
		JOIN pg_class c ON c.oid = i.indexrelid
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = '%s'
		AND c.relname IN (%s)
	`, namespace, indexNamesStr)

	var existingIndexes []indexStatus
	if err := db.RawQuery(query).All(&existingIndexes); err != nil {
		return nil, err
	}

	return existingIndexes, nil
}

// getApproximateUserCount returns an approximate count of users in the users table to avoid a full table scan
func getApproximateUserCount(db *pop.Connection, namespace string) (int64, error) {
	var userCount int64
	countQuery := fmt.Sprintf("SELECT reltuples::BIGINT FROM pg_class WHERE oid = '%q.users'::regclass;", namespace)

	if err := db.RawQuery(countQuery).First(&userCount); err != nil {
		return 0, err
	}

	return userCount, nil
}

// isOrioleDBTable checks if the specified table uses the OrioleDB storage engine
// by examining the table's access method in pg_class.
func isOrioleDBTable(db *pop.Connection, namespace, tableName string) (bool, error) {
	query := fmt.Sprintf(`
		SELECT am.amname
		FROM pg_class c
		JOIN pg_am am ON c.relam = am.oid
		JOIN pg_namespace n ON c.relnamespace = n.oid
		WHERE n.nspname = '%s' AND c.relname = '%s'
	`, namespace, tableName)

	var amName string
	if err := db.RawQuery(query).First(&amName); err != nil {
		return false, fmt.Errorf("failed to check table access method: %w", err)
	}
	return amName == "orioledb", nil
}

// dropInvalidIndexes drops any invalid indexes from previous interrupted attempts
func dropInvalidIndexes(db *pop.Connection, le *logrus.Entry, namespace string, indexNames []string) {
	indexNamesList := make([]string, len(indexNames))
	for i, idx := range indexNames {
		indexNamesList[i] = fmt.Sprintf("'%s'", idx)
	}
	indexNamesStr := strings.Join(indexNamesList, ",")

	// Query the system catalog to find invalid indexes (from interrupted CONCURRENTLY operations)
	cleanupQuery := fmt.Sprintf(`
		SELECT c.relname as index_name
		FROM pg_index i
		JOIN pg_class c ON c.oid = i.indexrelid
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = '%s'
		AND NOT i.indisvalid
		AND c.relname IN (%s)
	`, namespace, indexNamesStr)

	type invalidIndex struct {
		IndexName string `db:"index_name"`
	}
	var invalidIndexes []invalidIndex
	if err := db.RawQuery(cleanupQuery).All(&invalidIndexes); err == nil && len(invalidIndexes) > 0 {
		for _, idx := range invalidIndexes {
			le.WithFields(logrus.Fields{
				"code":       "dropping_invalid_index",
				"index_name": idx.IndexName,
			}).Info("Dropping invalid index from previous interrupted run")
			dropQuery := fmt.Sprintf("DROP INDEX CONCURRENTLY IF EXISTS %q.%s", namespace, idx.IndexName)
			if err := db.RawQuery(dropQuery).Exec(); err != nil {
				le.WithFields(logrus.Fields{
					"code":       "drop_invalid_index_failed",
					"index_name": idx.IndexName,
				}).WithError(err).Error("Failed to drop invalid index")
			}
		}
	}
}
