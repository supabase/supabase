package hookspgfunc

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgconn"
	"github.com/jackc/pgerrcode"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/e2e"
	"github.com/supabase/auth/internal/storage"
)

type M = map[string]any

func TestDispatch(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	globalCfg := e2e.Must(e2e.Config())
	db := e2e.Must(e2e.Conn(globalCfg))

	type testCase struct {
		ctx     context.Context
		desc    string
		tx      *storage.Connection
		dr      *Dispatcher
		cfg     conf.ExtensibilityPointConfiguration
		sql     string
		req     any
		exp     any
		err     error
		errStr  string
		errCode string
	}

	cases := []testCase{

		{
			desc: "pass - returns json",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_return_input`,
				HookName: `"auth"."v0pgfunc_test_return_input"`,
			},
			req: M{"user": M{"ID": "16e3c032-a7ea-4388-b880-756c0d02202c"}},
			exp: M{"user": M{"ID": "16e3c032-a7ea-4388-b880-756c0d02202c"}},
			sql: `
				create or replace function v0pgfunc_test_return_input(input jsonb)
				returns json as $$
				begin
					return input;
				end; $$ language plpgsql;`,
		},

		{
			desc: "pass - returns json with conn for tx",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_return_input`,
				HookName: `"auth"."v0pgfunc_test_return_input"`,
			},
			tx:  db,
			req: M{"user": M{"ID": "16e3c032-a7ea-4388-b880-756c0d02202c"}},
			exp: M{"user": M{"ID": "16e3c032-a7ea-4388-b880-756c0d02202c"}},
			sql: `
				create or replace function v0pgfunc_test_return_input(input jsonb)
				returns json as $$
				begin
					return input;
				end; $$ language plpgsql;`,
		},

		{
			desc: "pass - small sleep of 50ms within timeout (100ms)",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_sleep_timeout`,
				HookName: `"auth"."v0pgfunc_test_sleep_timeout"`,
			},
			dr: New(
				db,
				WithTimeout(time.Millisecond*100),
			),
			req: M{"user": M{"ID": "16e3c032-a7ea-4388-b880-756c0d02202c"}},
			exp: M{"user": M{"ID": "16e3c032-a7ea-4388-b880-756c0d02202c"}},
			sql: `
				create or replace function v0pgfunc_test_sleep_timeout(input jsonb)
				returns json as $$
				begin
					PERFORM pg_sleep(0.05);
					return input;
				end; $$ language plpgsql;`,
		},

		{
			desc: "fail - small sleep of 50ms within timeout (40ms)",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_sleep_timeout`,
				HookName: `"auth"."v0pgfunc_test_sleep_timeout"`,
			},
			dr: New(
				db,
				WithTimeout(time.Millisecond*40),
			),
			req: M{"user": M{"ID": "16e3c032-a7ea-4388-b880-756c0d02202c"}},
			exp: M{"user": M{"ID": "16e3c032-a7ea-4388-b880-756c0d02202c"}},
			sql: `
				create or replace function v0pgfunc_test_sleep_timeout(input jsonb)
				returns json as $$
				begin
					PERFORM pg_sleep(0.05);
					return input;
				end; $$ language plpgsql;`,
			errStr:  `ERROR: canceling statement due to statement timeout`,
			errCode: pgerrcode.QueryCanceled,
		},

		{
			desc: "fail - func does not exist",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_NOT_EXIST`,
				HookName: `"auth"."v0pgfunc_test_NOT_EXIST"`,
			},
			req:     M{"user": M{"ID": uuid.Must(uuid.NewV4())}},
			errStr:  "auth.v0pgfunc_test_NOT_EXIST(unknown) does not exist",
			errCode: pgerrcode.UndefinedFunction,
		},

		{
			desc: "fail - func does not exist with tx",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_NOT_EXIST`,
				HookName: `"auth"."v0pgfunc_test_NOT_EXIST"`,
			},
			tx:      db,
			req:     M{"user": M{"ID": uuid.Must(uuid.NewV4())}},
			errStr:  "auth.v0pgfunc_test_NOT_EXIST(unknown) does not exist",
			errCode: pgerrcode.UndefinedFunction,
		},

		{
			desc: "fail - timeout is invalid",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_return_input`,
				HookName: `"auth"."v0pgfunc_test_return_input"`,
			},
			dr: New(
				db,
				WithTimeout(-time.Millisecond),
			),
			req:     M{"user": M{"ID": uuid.Must(uuid.NewV4())}},
			errStr:  "ERROR: -1 ms is outside the valid range for parameter",
			errCode: pgerrcode.InvalidParameterValue,
		},

		{
			desc: "fail - func is malformed",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_malformed`,
				HookName: `"auth". malform!#(%!*&!())`,
			},
			dr: New(
				db,
				WithTimeout(time.Millisecond*100),
			),
			req:     M{"user": M{"ID": uuid.Must(uuid.NewV4())}},
			errStr:  "syntax error",
			errCode: pgerrcode.SyntaxError,
		},

		{
			desc:   "fail - unable to marshal",
			req:    make(chan int),
			errStr: "500: Error marshaling JSON input.",
		},

		{
			desc: "fail - unable to unmarshal",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_return_input`,
				HookName: `"auth"."v0pgfunc_test_return_input"`,
			},
			req: 12345,
			sql: `
				create or replace function v0pgfunc_test_return_input(input jsonb)
				returns json as $$
				begin
					return input;
				end; $$ language plpgsql;`,
			errStr: "500: Error unmarshaling JSON output.",
		},

		{
			desc: "fail - returned error",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_return_input`,
				HookName: `"auth"."v0pgfunc_test_return_input"`,
			},
			req: M{"error": M{"message": "failed"}},
			sql: `
				create or replace function v0pgfunc_test_return_input(input jsonb)
				returns json as $$
				begin
					return input;
				end; $$ language plpgsql;`,
			errStr: "500: failed",
		},

		{
			desc: "fail - returned error with status",
			cfg: conf.ExtensibilityPointConfiguration{
				URI:      `pg-functions://postgres/auth/v0pgfunc_test_return_input`,
				HookName: `"auth"."v0pgfunc_test_return_input"`,
			},
			req: M{"error": M{"message": "failed", "http_code": 403}},
			sql: `
				create or replace function v0pgfunc_test_return_input(input jsonb)
				returns json as $$
				begin
					return input;
				end; $$ language plpgsql;`,
			errStr: "403: failed",
		},
	}

	for _, tc := range cases {
		t.Run(tc.desc, func(t *testing.T) {
			testCtx := tc.ctx
			if testCtx == nil {
				testCtx = ctx
			}

			dr := tc.dr
			if dr == nil {
				dr = New(
					db,
					WithTimeout(time.Second*2),
				)
			}

			sql := tc.sql
			if sql != "" {
				err := db.RawQuery(sql).Exec()
				require.NoError(t, err)
			}

			tx := tc.tx
			cfg := tc.cfg
			res := M{}
			err := dr.Dispatch(testCtx, &cfg, tx, tc.req, &res)
			if tc.err != nil {
				require.Error(t, err)
				require.Equal(t, tc.err, err)
				return
			}
			if tc.errStr != "" || tc.errCode != "" {
				require.Error(t, err)
				if tc.errStr != "" {
					require.Contains(t, err.Error(), tc.errStr)
				}
				if tc.errCode != "" {
					var pgErr *pgconn.PgError
					require.True(t, errors.As(err, &pgErr),
						"expected a *pgconn.PgError, got %T: %v", err, err)
					require.Equal(t, tc.errCode, pgErr.Code)
				}
				return
			}
			require.NoError(t, err)
			require.Equal(t, tc.exp, res)
		})
	}
}
