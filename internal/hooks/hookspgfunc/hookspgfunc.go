package hookspgfunc

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/hooks/hookserrors"
	"github.com/supabase/auth/internal/storage"
)

const (
	defaultTimeout = time.Second * 2
)

type Dispatcher struct {
	db            *storage.Connection
	hookTimeoutMS int
}

type Option interface {
	apply(*Dispatcher)
}

type optionFunc func(*Dispatcher)

func (f optionFunc) apply(o *Dispatcher) { f(o) }

func WithTimeout(d time.Duration) Option {
	return optionFunc(func(o *Dispatcher) {
		o.hookTimeoutMS = int(d / 1000000)
	})
}

func New(db *storage.Connection, opts ...Option) *Dispatcher {
	dr := &Dispatcher{
		db:            db,
		hookTimeoutMS: int(defaultTimeout / 1000000),
	}
	for _, o := range opts {
		o.apply(dr)
	}
	return dr
}

func (o *Dispatcher) Dispatch(
	ctx context.Context,
	cfg *conf.ExtensibilityPointConfiguration,
	tx *storage.Connection,
	req, res any,
) error {
	data, err := o.runPostgresHook(ctx, *cfg, tx, req)
	if err != nil {
		return err
	}
	if data != nil {
		if err := json.Unmarshal(data, res); err != nil {
			e := new(apierrors.HTTPError)
			if errors.As(err, &e) {
				return e
			}
			return apierrors.NewInternalServerError(
				"Error unmarshaling JSON output.").WithInternalError(err)
		}
	}
	return nil
}

func (o *Dispatcher) runPostgresHook(
	ctx context.Context,
	hookConfig conf.ExtensibilityPointConfiguration,
	tx *storage.Connection,
	input any,
) ([]byte, error) {
	db := o.db.WithContext(ctx)

	request, err := json.Marshal(input)
	if err != nil {
		return nil, apierrors.NewInternalServerError(
			"Error marshaling JSON input.").WithInternalError(err)
	}

	var response []byte
	invokeHookFunc := func(tx *storage.Connection) error {
		// We rely on Postgres timeouts to ensure the function doesn't overrun
		q1 := fmt.Sprintf("set local statement_timeout TO '%d';", o.hookTimeoutMS)
		if terr := tx.RawQuery(q1).Exec(); terr != nil {
			return terr
		}

		q2 := fmt.Sprintf("select %s(?);", hookConfig.HookName)
		if terr := tx.RawQuery(q2, request).First(&response); terr != nil {
			return terr
		}

		// reset the timeout
		const q3 = "set local statement_timeout TO default;"
		if terr := tx.RawQuery(q3).Exec(); terr != nil {
			return terr
		}
		return nil
	}
	if tx != nil {
		if err := invokeHookFunc(tx); err != nil {
			return nil, err
		}
	} else {
		if err := db.Transaction(invokeHookFunc); err != nil {
			return nil, err
		}
	}
	if err := hookserrors.Check(response); err != nil {
		return nil, err
	}
	return response, nil
}
