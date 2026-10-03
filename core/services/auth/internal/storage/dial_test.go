package storage

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/observability"
	"golang.org/x/sync/errgroup"
)

type TestUser struct {
	ID    uuid.UUID
	Role  string `db:"role"`
	Other string `db:"othercol"`
}

func TestGetExcludedColumns(t *testing.T) {
	u := TestUser{}
	cols, err := getExcludedColumns(u, "role")
	require.NoError(t, err)
	require.NotContains(t, cols, "role")
	require.Contains(t, cols, "othercol")
}

func TestGetExcludedColumns_InvalidName(t *testing.T) {
	u := TestUser{}
	_, err := getExcludedColumns(u, "adsf")
	require.Error(t, err)
}

func TestTransaction(t *testing.T) {
	apiTestConfig := "../../hack/test.env"
	config, err := confload.LoadGlobal(apiTestConfig)
	require.NoError(t, err)
	conn, err := Dial(config)
	require.NoError(t, err)
	require.NotNil(t, conn)

	defer func() {
		// clean up the test table created
		require.NoError(t, conn.RawQuery("drop table if exists test").Exec(), "Error removing table")
	}()

	commitWithError := NewCommitWithError(errors.New("commit with error"))
	err = conn.Transaction(func(tx *Connection) error {
		require.NoError(t, tx.RawQuery("create table if not exists test()").Exec(), "Error saving creating test table")
		return commitWithError
	})
	require.Error(t, err)
	require.ErrorIs(t, err, commitWithError)

	type TestData struct{}

	// check that transaction is still being committed despite returning an error above
	data := []TestData{}
	err = conn.RawQuery("select * from test").All(&data)
	require.NoError(t, err)
	require.Empty(t, data)
}

func TestPopConnToStd(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	apiTestConfig := "../../hack/test.env"
	config, err := confload.LoadGlobal(apiTestConfig)
	require.NoError(t, err)

	cd, err := newConnectionDetails(config)
	require.NoError(t, err)

	conn, err := pop.NewConnection(cd)
	require.NoError(t, err)
	require.NoError(t, conn.Open())

	t.Run("connToDB", func(t *testing.T) {
		sdb, ok := popConnToStd(conn)
		require.NotNil(t, sdb)
		require.True(t, ok)
		require.Equal(t, "*sql.DB", fmt.Sprintf("%T", sdb))
	})

	// Could not find a way to do this (without unsafe) due to struct layout
	// of pop.contextStore (contextStore { store: store }).
	t.Run("connWithContextToDB", func(t *testing.T) {
		sdb, ok := popConnToStd(conn.WithContext(ctx))
		require.Nil(t, sdb)
		require.False(t, ok)
	})
}

func TestConnection(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	t.Run("DialContext", func(t *testing.T) {
		config := mustConfig(t)
		dbCfg := config.DB

		cd, err := newConnectionDetails(config)
		require.NoError(t, err)
		require.Equal(t, dbCfg.Driver, cd.Dialect)
		require.Equal(t, dbCfg.URL, cd.URL)
		require.Equal(t, dbCfg.MaxPoolSize, cd.Pool)
		require.Equal(t, dbCfg.MaxIdlePoolSize, cd.IdlePool)
		require.Equal(t, dbCfg.ConnMaxLifetime, cd.ConnMaxLifetime)
		require.Equal(t, dbCfg.ConnMaxIdleTime, cd.ConnMaxIdleTime)

		db, err := DialContext(ctx, config)
		require.NoError(t, err)
		require.NotNil(t, db)
		defer db.Close()
	})

	t.Run("DialContextInvalidDriver", func(t *testing.T) {
		config := mustConfig(t)

		// set invalid db url
		config.DB.URL = string([]byte("\x00"))
		config.DB.Driver = ""

		const errStr = "invalid control character in URL"
		db, err := DialContext(ctx, config)
		require.Nil(t, db)
		require.Error(t, err)
		require.Contains(t, err.Error(), errStr)
	})
}

func TestConnLimits(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	t.Run("ApplyConfig", func(t *testing.T) {
		config := mustConfig(t)
		config.DB.MaxPoolSize = 50

		db, err := DialContext(ctx, config)
		require.NoError(t, err)
		require.NotNil(t, db)
		defer db.Close()

		maxConns, err := db.showMaxConns(ctx)
		require.NoError(t, err)

		// 100 is current default in local testing, we rely on it for unit tests
		require.True(t, maxConns == 100)

		openConns := func(n int) {
			var eg errgroup.Group
			for range n {
				eg.Go(func() error {
					return db.Transaction(func(tx *Connection) error {
						return tx.RawQuery("SELECT pg_sleep(0.1);").Exec()
					})
				})
			}
			require.NoError(t, eg.Wait())
		}

		// baseline: should have at most 1 conn
		{
			stats := db.sqldb.Stats()
			require.Equal(t, 1, stats.OpenConnections,
				"expected a single open connection")
		}

		// stats should show max poolsize since we have no conn pct
		{
			// open max pool size * 2
			openConns(config.DB.MaxPoolSize * 2)

			// after blocking calls we should have the max pool size if applying worked.
			stats := db.sqldb.Stats()
			require.Equal(t, config.DB.MaxPoolSize, stats.OpenConnections,
				"expected a single open connection")
			require.NoError(t, err)
		}

		// apply percentage based now
		{
			newConfig := mustConfig(t)
			newConfig.DB.ConnPercentage = 30

			le := observability.GetLogEntryFromContext(ctx).Entry
			err := db.ApplyConfig(ctx, newConfig, le)
			require.NoError(t, err)
		}

		// stats should show 30 since we allocated 30% of conns of our 100 avail
		{
			// open max pool size * 2
			openConns(config.DB.MaxPoolSize * 2)

			// after blocking calls we should have the max pool size if applying worked.
			stats := db.sqldb.Stats()

			require.Equal(t, 30, stats.OpenConnections,
				"expected a single open connection")
			require.NoError(t, err)
		}

		// exp error when sqldb nil
		{
			db.sqldb = nil
			newConfig := mustConfig(t)
			newConfig.DB.ConnPercentage = 50

			le := observability.GetLogEntryFromContext(ctx).Entry
			err := db.ApplyConfig(ctx, config, le)
			require.Error(t, err)
			require.Contains(t, err.Error(), "unable to access underying *sql.DB")
		}
	})

	t.Run("getConnLimits", func(t *testing.T) {
		config := mustConfig(t)
		config.DB.MaxPoolSize = 50

		db, err := DialContext(ctx, config)
		require.NoError(t, err)
		require.NotNil(t, db)
		defer db.Close()

		const maxConns = 100
		{
			serverMaxConns, err := db.showMaxConns(ctx)
			require.NoError(t, err)

			// 100 is current default in local testing, we rely on it for unit tests
			require.True(t, serverMaxConns == maxConns)
		}

		t.Run("PercentageEnabled", func(t *testing.T) {
			dbCfg := conf.DBConfiguration{
				ConnPercentage:  10,
				MaxPoolSize:     50,
				MaxIdlePoolSize: 50,
				ConnMaxIdleTime: time.Second * 60,
				ConnMaxLifetime: 0,
			}
			exp := ConnLimits{
				MaxOpenConns:    10,
				MaxIdleConns:    10,
				ConnMaxIdleTime: time.Second * 60,
				ConnMaxLifetime: 0,
				Strategy:        connLimitsPercentageStrategy,
			}

			cl, err := db.getConnLimits(ctx, &dbCfg)
			require.NoError(t, err)
			require.NotNil(t, cl)

			require.Equal(t, exp.MaxOpenConns, cl.MaxOpenConns)
			require.Equal(t, exp.MaxIdleConns, cl.MaxIdleConns)
			require.Equal(t, exp.ConnMaxLifetime, cl.ConnMaxLifetime)
			require.Equal(t, exp.ConnMaxIdleTime, cl.ConnMaxIdleTime)
			require.Equal(t, exp.Strategy, cl.Strategy)
			require.Equal(t, maxConns, cl.ServerMaxConns)
		})

		t.Run("PercentageDisabled", func(t *testing.T) {
			dbCfg := conf.DBConfiguration{
				ConnPercentage:  0,
				MaxPoolSize:     50,
				MaxIdlePoolSize: 50,
				ConnMaxIdleTime: time.Second * 60,
				ConnMaxLifetime: 0,
			}
			exp := ConnLimits{
				MaxOpenConns:    50,
				MaxIdleConns:    50,
				ConnMaxIdleTime: time.Second * 60,
				ConnMaxLifetime: 0,
				Strategy:        connLimitsFixedStrategy,
			}

			cl, err := db.getConnLimits(ctx, &dbCfg)
			require.NoError(t, err)
			require.NotNil(t, cl)

			require.Equal(t, exp.MaxOpenConns, cl.MaxOpenConns)
			require.Equal(t, exp.MaxIdleConns, cl.MaxIdleConns)
			require.Equal(t, exp.ConnMaxLifetime, cl.ConnMaxLifetime)
			require.Equal(t, exp.ConnMaxIdleTime, cl.ConnMaxIdleTime)
			require.Equal(t, exp.Strategy, cl.Strategy)
			require.Equal(t, maxConns, cl.ServerMaxConns)
		})
	})

	t.Run("applyPercentageLimits", func(t *testing.T) {

		config := mustConfig(t)
		config.DB.MaxPoolSize = 50

		db, err := DialContext(ctx, config)
		require.NoError(t, err)
		require.NotNil(t, db)
		defer db.Close()

		const maxConns = 100
		{
			serverMaxConns, err := db.showMaxConns(ctx)
			require.NoError(t, err)

			// 100 is current default in local testing, we rely on it for unit tests
			require.True(t, serverMaxConns == maxConns)
		}

		type testCase struct {
			desc     string
			maxConns int
			cfg      conf.DBConfiguration
			exp      ConnLimits
			err      string
		}
		tests := []testCase{

			{
				desc:     "exp fallback to maxpool size",
				maxConns: maxConns,
				cfg: conf.DBConfiguration{
					ConnPercentage:  0,
					MaxPoolSize:     50,
					MaxIdlePoolSize: 50,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
				},
				exp: ConnLimits{
					MaxOpenConns:    50,
					MaxIdleConns:    50,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
					ServerMaxConns:  maxConns,
					Strategy:        connLimitsFixedStrategy,
				},
			},

			{
				desc:     "exp conn pct to take precedence over max pool size",
				maxConns: maxConns,
				cfg: conf.DBConfiguration{
					ConnPercentage:  30,
					MaxPoolSize:     50,
					MaxIdlePoolSize: 50,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
				},
				exp: ConnLimits{
					MaxOpenConns:    30,
					MaxIdleConns:    30,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
					ServerMaxConns:  maxConns,
					Strategy:        connLimitsPercentageStrategy,
				},
			},

			{
				desc:     "exp conn pct to ignore fixed values",
				maxConns: maxConns,
				cfg: conf.DBConfiguration{
					ConnPercentage:  30,
					MaxPoolSize:     0,
					MaxIdlePoolSize: 0,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
				},
				exp: ConnLimits{
					MaxOpenConns:    30,
					MaxIdleConns:    30,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
					ServerMaxConns:  maxConns,
					Strategy:        connLimitsPercentageStrategy,
				},
			},

			{
				desc:     "exp conn pct to not be set lower than 1 for small max conns",
				maxConns: 4,
				cfg: conf.DBConfiguration{
					ConnPercentage:  10,
					MaxPoolSize:     50,
					MaxIdlePoolSize: 50,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
				},
				exp: ConnLimits{
					MaxOpenConns:    1,
					MaxIdleConns:    1,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
					ServerMaxConns:  4,
					Strategy:        connLimitsPercentageStrategy,
				},
			},

			{
				desc:     "exp error",
				err:      "percentage must be between 1 and 100",
				maxConns: maxConns,
				cfg: conf.DBConfiguration{
					ConnPercentage:  -1,
					MaxPoolSize:     50,
					MaxIdlePoolSize: 25,
				},
				exp: ConnLimits{
					MaxOpenConns:   50,
					MaxIdleConns:   50,
					ServerMaxConns: maxConns,
					Strategy:       connLimitsErrorStrategy,
				},
			},

			{
				desc:     "exp error",
				err:      "db reported a maximum of 0 connections",
				maxConns: 0,
				cfg: conf.DBConfiguration{
					ConnPercentage:  30,
					MaxPoolSize:     50,
					MaxIdlePoolSize: 50,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
				},
				exp: ConnLimits{
					MaxOpenConns:    50,
					MaxIdleConns:    50,
					ConnMaxIdleTime: time.Second * 60,
					ConnMaxLifetime: 0,
					ServerMaxConns:  0,
					Strategy:        connLimitsErrorStrategy,
				},
			},
		}

		tcStr := func(tc testCase) string {
			str := fmt.Sprintf("%v when server maxConns is %d", tc.desc, tc.maxConns)
			str += fmt.Sprintf(" and cfg(pct: %v max: %v)",
				tc.cfg.ConnPercentage, tc.cfg.MaxPoolSize)
			str += fmt.Sprintf(" exp %v", tc.exp)
			return str
		}

		for idx, tc := range tests {
			t.Logf("test #%v - %v", idx, tcStr(tc))

			dbCfg := &tc.cfg
			cl := newConnLimitsFromConfig(dbCfg)

			err := db.applyPercentageLimits(dbCfg, tc.maxConns, cl)
			if tc.err != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), tc.err)
				continue
			}
			require.NoError(t, err)
			require.NotNil(t, cl)

			require.Equal(t, tc.exp.MaxOpenConns, cl.MaxOpenConns)
			require.Equal(t, tc.exp.MaxIdleConns, cl.MaxIdleConns)
			require.Equal(t, tc.exp.ConnMaxLifetime, cl.ConnMaxLifetime)
			require.Equal(t, tc.exp.ConnMaxIdleTime, cl.ConnMaxIdleTime)
			require.Equal(t, tc.exp.Strategy, cl.Strategy)
			require.Equal(t, tc.exp.ServerMaxConns, cl.ServerMaxConns)
		}
	})
}

func mustConfig(t *testing.T) *conf.GlobalConfiguration {
	apiTestConfig := "../../hack/test.env"
	config, err := confload.LoadGlobal(apiTestConfig)
	require.NoError(t, err)

	config.Tracing.Enabled = true
	config.Metrics.Enabled = true

	dbCfg := &conf.DBConfiguration{
		Driver:    config.DB.Driver,
		URL:       config.DB.URL,
		Namespace: config.DB.Namespace,

		ConnPercentage:  0,
		MaxPoolSize:     50,
		MaxIdlePoolSize: 50,
		ConnMaxIdleTime: time.Second * 60,
		ConnMaxLifetime: 0,

		HealthCheckPeriod: 0,
		CleanupEnabled:    false,
		MigrationsPath:    config.DB.MigrationsPath,
	}
	config.DB = *dbCfg
	return config
}
