// Package apitask provides a background execution context for background work
// that limits the execution time to the current request.
package apitask

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync"

	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/ctxkey"
	"github.com/supabase/auth/internal/observability"
)

// ErrTask is the base of all errors originating from apitasks.
var ErrTask = errors.New("apitask")

// Middleware wraps next with an http.Handler which adds apitasks handling
// to the request context and waits for all tasks to exit before returning.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r = r.WithContext(With(r.Context()))
		defer Wait(r.Context())

		next.ServeHTTP(w, r)
	})
}

// Task is implemented by objects which may be ran in the background.
type Task interface {

	// Type return a basic name for a task. It is not expected to be consistent
	// with the underlying type, but it should be low cardinality.
	Type() string

	// Run should run this task.
	Run(context.Context) error
}

type taskFunc struct {
	typ string
	fn  func(context.Context) error
}

func (o *taskFunc) Type() string { return o.typ }

func (o *taskFunc) Run(ctx context.Context) error { return o.fn(ctx) }

func Func(typ string, fn func(context.Context) error) Task {
	return &taskFunc{typ: typ, fn: fn}
}

// Run will run a request-scoped background task in a separate goroutine
// immediately if the current context supports it. Otherwise it makes an
// immediate blocking call to task.Run(ctx).
//
// It is invalid to call Run within a tasks Run method.
func Run(ctx context.Context, task Task) error {
	wrk, ok := from(ctx)
	if !ok {
		return task.Run(ctx)
	}
	return wrk.run(ctx, task)
}

// Wait will wait for all currently running request-scoped background tasks to
// complete before returning.
func Wait(ctx context.Context) {
	wrk, ok := from(ctx)
	if !ok {
		return
	}
	wrk.wait()
}

// With sets up the given context for adding request-scoped background tasks.
func With(ctx context.Context) context.Context {
	wrk, ok := from(ctx)
	if !ok {
		wrk = &requestWorker{}
	}
	return ctxKey.WithValue(ctx, wrk)
}

var ctxKey = ctxkey.New[*requestWorker]("apitask_worker")

func from(ctx context.Context) (*requestWorker, bool) {
	if st, ok := ctxKey.Lookup(ctx); ok && st != nil {
		return st, true
	}
	return nil, false
}

type requestWorker struct {
	mu   sync.Mutex
	wg   sync.WaitGroup
	done bool
}

func (o *requestWorker) wait() {
	o.mu.Lock()
	o.done = true
	o.mu.Unlock()

	o.wg.Wait()
}

func (o *requestWorker) run(ctx context.Context, task Task) error {
	o.mu.Lock()
	defer o.mu.Unlock()
	if o.done {
		err := fmt.Errorf(
			"%w: unable to run tasks after a call to Wait", ErrTask)
		return apierrors.NewInternalServerError(
			"failed to run task").WithInternalError(err)
	}

	o.wg.Add(1)
	go func() {
		defer o.wg.Done()

		if err := task.Run(ctx); err != nil {
			typ := task.Type()
			err = fmt.Errorf("apitask: error running %q: %w", typ, err)

			le := observability.GetLogEntryFromContext(ctx).Entry
			le.WithFields(logrus.Fields{
				"action":    "apitask",
				"task_type": typ,
			}).WithError(err).Error(err)
		}
	}()
	return nil
}
