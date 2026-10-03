package utilities

import (
	"errors"
	"strconv"
	"strings"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgerrcode"
)

// PostgresError is a custom error struct for marshalling Postgres errors to JSON.
type PostgresError struct {
	Code           string `json:"code"`
	HttpStatusCode int    `json:"-"`
	Message        string `json:"message"`
	Hint           string `json:"hint,omitempty"`
	Detail         string `json:"detail,omitempty"`
}

// NewPostgresError returns a new PostgresError if the error was from a publicly
// accessible Postgres error.
func NewPostgresError(err error) *PostgresError {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && isPubliclyAccessiblePostgresError(pgErr.Code) {
		return &PostgresError{
			Code:           pgErr.Code,
			HttpStatusCode: getHttpStatusCodeFromPostgresErrorCode(pgErr.Code),
			Message:        pgErr.Message,
			Detail:         pgErr.Detail,
			Hint:           pgErr.Hint,
		}
	}

	return nil
}
func (pg *PostgresError) IsUniqueConstraintViolated() bool {
	// See https://www.postgresql.org/docs/current/errcodes-appendix.html for list of error codes
	return pg.Code == "23505"
}

// isPubliclyAccessiblePostgresError checks if the Postgres error should be
// made accessible.
func isPubliclyAccessiblePostgresError(code string) bool {
	if len(code) != 5 {
		return false
	}

	// default response
	return getHttpStatusCodeFromPostgresErrorCode(code) != 0
}

// getHttpStatusCodeFromPostgresErrorCode maps a Postgres error code to a HTTP
// status code. Returns 0 if the code doesn't map to a given postgres error code.
func getHttpStatusCodeFromPostgresErrorCode(code string) int {
	if code == pgerrcode.RaiseException ||
		code == pgerrcode.IntegrityConstraintViolation ||
		code == pgerrcode.RestrictViolation ||
		code == pgerrcode.NotNullViolation ||
		code == pgerrcode.ForeignKeyViolation ||
		code == pgerrcode.UniqueViolation ||
		code == pgerrcode.CheckViolation ||
		code == pgerrcode.ExclusionViolation {
		return 500
	}

	// Use custom HTTP status code if Postgres error was triggered with `PTXXX`
	// code. This is consistent with PostgREST's behaviour as well.
	if strings.HasPrefix(code, "PT") {
		if httpStatusCode, err := strconv.ParseInt(code[2:], 10, 0); err == nil {
			return int(httpStatusCode)
		}
	}

	return 0
}
