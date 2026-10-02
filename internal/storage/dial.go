package storage

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"reflect"
	"time"

	"github.com/XSAM/otelsql"
	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/pop/v6/columns"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
)

// Connection is the interface a storage provider must implement. Do not copy
// a storage connection
type Connection struct {
	*pop.Connection
	sqldb *sql.DB
}

// Dial will connect to that storage engine
func Dial(config *conf.GlobalConfiguration) (*Connection, error) {
	return DialContext(context.TODO(), config)
}

func DialContext(
	ctx context.Context,
	config *conf.GlobalConfiguration,
) (*Connection, error) {
	cd, err := newConnectionDetails(config)
	if err != nil {
		return nil, err
	}

	db, err := pop.NewConnection(cd)
	if err != nil {
		return nil, errors.Wrap(err, "opening database connection")
	}
	if err := db.Open(); err != nil {
		return nil, errors.Wrap(err, "checking database connection")
	}

	sqldb, ok := popConnToStd(db)
	if ok && config.Metrics.Enabled {
		registerOpenTelemetryDatabaseStats(config, sqldb)
	}

	conn := &Connection{
		Connection: db,
		sqldb:      sqldb,
	}
	return conn, nil
}

// // GetSqlDB returns the underlying *sql.DB and true or nil if no db could be obtained.
// func (c *Connection) GetSqlDB() (*sql.DB, bool) { return c.sqldb, c.sqldb != nil }

// Copy will return a copy of this connection. It must be instead of using a
// struct literal from external packages.
func (c *Connection) Copy() *Connection {
	cpy := *c
	return &cpy
}

func newConnectionDetails(
	config *conf.GlobalConfiguration,
) (*pop.ConnectionDetails, error) {
	cd := &pop.ConnectionDetails{
		Dialect:         config.DB.Driver,
		URL:             config.DB.URL,
		Pool:            config.DB.MaxPoolSize,
		IdlePool:        config.DB.MaxIdlePoolSize,
		ConnMaxLifetime: config.DB.ConnMaxLifetime,
		ConnMaxIdleTime: config.DB.ConnMaxIdleTime,
		Options:         make(map[string]string),
	}
	if err := applyDBDriver(config, cd); err != nil {
		return nil, err
	}
	if config.DB.HealthCheckPeriod != time.Duration(0) {
		cd.Options["pool_health_check_period"] = config.DB.HealthCheckPeriod.String()
	}
	if config.DB.ConnMaxIdleTime != time.Duration(0) {
		cd.Options["pool_max_conn_idle_time"] = config.DB.ConnMaxIdleTime.String()
	}
	return cd, nil
}

// TODO(cstockton): I'm preserving the Mutation here for now because I'm not
// sure what side effects changing this could have. But it should probably go
// inside the Validate() function in conf package or somewhere else.
func applyDBDriver(
	config *conf.GlobalConfiguration,
	cd *pop.ConnectionDetails,
) error {
	if config.DB.Driver == "" && config.DB.URL != "" {
		u, err := url.Parse(config.DB.URL)
		if err != nil {
			return errors.Wrap(err, "parsing db connection url")
		}
		config.DB.Driver = u.Scheme
	}

	driver := ""
	if config.DB.Driver != "postgres" {
		logrus.Warn("DEPRECATION NOTICE: only PostgreSQL is supported by Supabase's GoTrue, will be removed soon")
	} else {
		// pop v5 uses pgx as the default PostgreSQL driver
		driver = "pgx"
	}

	if driver != "" && (config.Tracing.Enabled || config.Metrics.Enabled) {
		instrumentedDriver, err := otelsql.Register(driver)
		if err != nil {
			logrus.WithError(err).Errorf("unable to instrument sql driver %q for use with OpenTelemetry", driver)
		} else {
			logrus.Debugf("using %s as an instrumented driver for OpenTelemetry", instrumentedDriver)

			// sqlx needs to be informed that the new instrumented
			// driver has the same semantics as the
			// non-instrumented driver
			sqlx.BindDriver(instrumentedDriver, sqlx.BindType(driver))

			driver = instrumentedDriver
		}
	}

	cd.Driver = driver
	return nil
}

// NOTE: I couldn't find any way to obtain the store when wrapped with context
// due to the private store field in pop.contextStore.
func popConnToStd(db *pop.Connection) (sqldb *sql.DB, ok bool) {
	defer func() {
		if rec := recover(); rec != nil {
			sqldb, ok = nil, false
		}
	}()

	// Get element stored in the pop.store interface within field db.Store.
	dbval := reflect.ValueOf(db.Store).Elem() // *pop.dB

	// dbval should contain a pointer to struct with layout of pop.dB:
	//
	//   type dB struct {
	//     *sqlx.DB
	//   }
	//
	dbval = dbval.Field(0) // *sqlx.DB

	// dbval should now be a pointer to a struct with layout like sqlx.DB:
	//
	//   type DB struct {
	//     *sql.DB
	//   }
	//
	dbval = dbval.Elem().Field(0) // *sql.DB

	// dbval should now be (*sql.DB) get an iface and try to cast.
	sqldb, ok = dbval.Interface().(*sql.DB)
	return
}

// ApplyConfig will apply the given config to this *Connection, potentially
// adjusting the underlying *sql.DB's current settings.
//
// When config.DB.ConnPercentage is set to a non-zero value ApplyConfig attempts
// to set the MaxOpenConns and MaxIdleConns to a percentage based value. It does
// this by opening a connection to the server and calling
// `SHOW max_connections;` to determine the connection limits. If this operation
// fails it applies no configuration changes at all and returns an error.
func (c *Connection) ApplyConfig(
	ctx context.Context,
	config *conf.GlobalConfiguration,
	le *logrus.Entry,
) error {
	sqldb := c.sqldb
	if sqldb == nil {
		return errors.New("storage: ApplyConfig: unable to access underying *sql.DB")
	}

	cl, err := c.getConnLimits(ctx, &config.DB)
	if err != nil {
		return fmt.Errorf("storage: ApplyConfig: %w", err)
	}

	le.WithFields(logrus.Fields{
		// Config values
		"config_max_pool_size":      config.DB.MaxPoolSize,
		"config_max_idle_pool_size": config.DB.MaxIdlePoolSize,
		"config_conn_max_lifetime":  config.DB.ConnMaxLifetime.String(),
		"config_conn_max_idle_time": config.DB.ConnMaxIdleTime.String(),
		"config_conn_percentage":    config.DB.ConnPercentage,

		// Server values
		"server_max_conns": cl.ServerMaxConns,

		// Limit values
		"limit_max_open_conns":     cl.MaxOpenConns,
		"limit_max_idle_conns":     cl.MaxIdleConns,
		"limit_conn_max_lifetime":  cl.ConnMaxLifetime.String(),
		"limit_conn_max_idle_time": cl.ConnMaxIdleTime.String(),
		"limit_strategy":           cl.Strategy,
	}).Infof("applying connection limits to db using the %q strategy", cl.Strategy)

	sqldb.SetMaxOpenConns(cl.MaxOpenConns)
	sqldb.SetMaxIdleConns(cl.MaxIdleConns)
	sqldb.SetConnMaxLifetime(cl.ConnMaxLifetime)
	sqldb.SetConnMaxIdleTime(cl.ConnMaxIdleTime)
	return nil
}

func (c *Connection) getConnLimits(
	ctx context.Context,
	dbCfg *conf.DBConfiguration,
) (*ConnLimits, error) {
	// Set the connection limits to the fixed values in config
	cl := newConnLimitsFromConfig(dbCfg)

	// Always fetch max conns because it is useful for logging.
	maxConns, err := c.showMaxConns(ctx)
	if err != nil {
		return nil, err
	}
	cl.ServerMaxConns = maxConns

	if dbCfg.ConnPercentage == 0 {
		// pct based conn limits are disabled
		cl.Strategy = connLimitsFixedStrategy
		return cl, nil
	}

	// pct conn limits are enabled, try to determine what they should be
	if err := c.applyPercentageLimits(dbCfg, maxConns, cl); err != nil {
		return nil, err
	}

	return cl, nil
}

func (c *Connection) applyPercentageLimits(
	dbCfg *conf.DBConfiguration,
	maxConns int,
	cl *ConnLimits,
) error {
	cl.ServerMaxConns = maxConns // set this here too for unit tests

	if dbCfg.ConnPercentage == 0 {
		// pct based conn limits are disabled
		cl.Strategy = connLimitsFixedStrategy
		return nil
	}

	if maxConns <= 0 {
		// If maxConns is 0 it means our role or db is not allowing conns right
		// now and we do nothing.
		return errors.New("db reported a maximum of 0 connections")
	}

	// Ensure the conn pct isn't OOB
	if dbCfg.ConnPercentage <= 0 || dbCfg.ConnPercentage > 100 {
		return errors.New("db conn percentage must be between 1 and 100")
	}

	// maxConns > 0 so we may calculate the percentage.
	pct := float64(dbCfg.ConnPercentage)
	cl.MaxOpenConns = int(max(1, (pct/100)*float64(maxConns)))

	// We set max idle conns to the max open conns.
	cl.MaxIdleConns = cl.MaxOpenConns

	// return the percentage based conn limits
	cl.Strategy = connLimitsPercentageStrategy
	return nil
}

// showMaxConns retrieves the max_connections from the db.
func (c *Connection) showMaxConns(ctx context.Context) (int, error) {
	db := c.WithContext(ctx)

	var maxConns int
	err := db.Transaction(func(tx *Connection) error {
		return tx.RawQuery("SHOW max_connections;").First(&maxConns)
	})
	if err != nil {
		return 0, err
	}
	return maxConns, nil
}

const (
	connLimitsErrorStrategy      = "error"
	connLimitsFixedStrategy      = "fixed"
	connLimitsPercentageStrategy = "percentage"
)

// ConnLimits represents the connection limits for the underlying *sql.DB.
type ConnLimits struct {
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
	ServerMaxConns  int
	Strategy        string
}

func newConnLimitsFromConfig(dbCfg *conf.DBConfiguration) *ConnLimits {
	return &ConnLimits{
		MaxOpenConns:    dbCfg.MaxPoolSize,
		MaxIdleConns:    dbCfg.MaxIdlePoolSize,
		ConnMaxLifetime: dbCfg.ConnMaxLifetime,
		ConnMaxIdleTime: dbCfg.ConnMaxIdleTime,
		Strategy:        connLimitsErrorStrategy,
	}
}

func registerOpenTelemetryDatabaseStats(config *conf.GlobalConfiguration, sqldb *sql.DB) {
	defer func() {
		if rec := recover(); rec != nil {
			logrus.WithField("error", rec).Error("registerOpenTelemetryDatabaseStats is not able to determine database object with reflection -- panicked")
		}
	}()

	if err := otelsql.RegisterDBStatsMetrics(sqldb); err != nil {
		logrus.WithError(err).Error("unable to register OpenTelemetry stats metrics for databse")
	} else {
		logrus.Debug("registered OpenTelemetry stats metrics for database")
	}

	if config.DB.Advisor.Enabled {
		advisor := Advisor{
			StatsFunc: func() sql.DBStats {
				return sqldb.Stats()
			},
			Interval: config.DB.Advisor.SamplingInterval,
			AdviseFunc: func(advisory Advisory) {
				logrus.WithFields(logrus.Fields{
					"component":                  "db.advisor",
					"long_wait_duration_samples": advisory.LongWaitDurationSamples,
					"over_2_waiting_samples":     advisory.Over2WaitingSamples,
				}).Warn("Suboptimal database connection pool settings detected! Consider doubling the max DB pool size configuration")
			},
		}

		advisor.Start(config.DB.Advisor.ObservationInterval)
	}
}

type CommitWithError struct {
	Err error
}

func (e *CommitWithError) Error() string {
	return e.Err.Error()
}

func (e *CommitWithError) Cause() error {
	return e.Err
}

// NewCommitWithError creates an error that can be returned in a pop transaction
// without rolling back the transaction. This should only be used in cases where
// you want the transaction to commit but return an error message to the user.
func NewCommitWithError(err error) *CommitWithError {
	return &CommitWithError{Err: err}
}

func (c *Connection) Transaction(fn func(*Connection) error) error {
	if c.TX == nil {
		var returnErr error
		if terr := c.Connection.Transaction(func(tx *pop.Connection) error {
			conn := c.Copy()
			conn.Connection = tx

			err := fn(conn)
			switch err.(type) {
			case *CommitWithError:
				returnErr = err
				return nil
			default:
				return err
			}
		}); terr != nil {
			// there exists a race condition when the context deadline is exceeded
			// and whether the transaction has been committed or not
			// e.g. if the context deadline has exceeded but the transaction has already been committed,
			// it won't be possible to perform a rollback on the transaction since the transaction has been closed
			if !errors.Is(terr, sql.ErrTxDone) {
				return terr
			}
		}
		return returnErr
	}
	return fn(c)
}

// WithContext returns a new connection with an updated context. This is
// typically used for tracing as the context contains trace span information.
func (c *Connection) WithContext(ctx context.Context) *Connection {
	cpy := c.Copy()
	cpy.Connection = cpy.Connection.WithContext(ctx)
	return cpy
}

func getExcludedColumns(model interface{}, includeColumns ...string) ([]string, error) {
	sm := &pop.Model{Value: model}
	st := reflect.TypeOf(model)
	if st.Kind() == reflect.Pointer {
		_ = st.Elem()
	}

	// get all columns and remove included to get excluded set
	cols := columns.ForStructWithAlias(model, sm.TableName(), sm.As, sm.IDField())
	for _, f := range includeColumns {
		if _, ok := cols.Cols[f]; !ok {
			return nil, errors.Errorf("Invalid column name %s", f)
		}
		cols.Remove(f)
	}

	xcols := make([]string, 0, len(cols.Cols))
	for n := range cols.Cols {
		// gobuffalo updates the updated_at column automatically
		if n == "updated_at" {
			continue
		}
		xcols = append(xcols, n)
	}
	return xcols, nil
}
