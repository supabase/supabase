package apitask

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestContext(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()

	{
		rw, ok := from(ctx)
		require.False(t, ok, "request worker must not found in context")
		require.Nil(t, rw, "request worker must be nil")
	}

	withCtx := With(ctx)
	{
		rw, ok := from(withCtx)
		require.True(t, ok, "request worker not found in context")
		require.NotNil(t, rw, "request worker was nil")

		withCtxDupe := With(withCtx)
		sameRw, ok := from(withCtxDupe)
		require.True(t, ok, "request worker not found in context")
		require.True(t, rw == sameRw, "request worker should be created only once")
	}
}

func TestRun(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()

	t.Run("Success", func(t *testing.T) {
		withCtx := With(ctx)

		calls := new(atomic.Int64)
		expCalls := 0
		for range 16 {
			expCalls++
			task := Func("test.run", func(ctx context.Context) error {
				calls.Add(1)
				return nil
			})
			err := Run(withCtx, task)
			require.NoError(t, err)
		}

		{
			Wait(withCtx)

			gotCalls := int(calls.Load())
			require.Equal(t, expCalls, gotCalls)
		}
	})
	t.Run("Failure", func(t *testing.T) {

		// exp no errors when async
		t.Run("WhenAsync", func(t *testing.T) {
			withCtx := With(ctx)

			calls := new(atomic.Int64)
			expCalls := 0
			sentinel := errors.New("sentinel")
			for range 16 {
				expCalls++
				task := Func("test.run", func(ctx context.Context) error {
					calls.Add(1)
					return sentinel
				})
				err := Run(withCtx, task)
				require.NoError(t, err)
			}

			{
				Wait(withCtx)

				gotCalls := int(calls.Load())
				require.Equal(t, expCalls, gotCalls)
			}
		})

		// exp errors when sync
		t.Run("WhenSync", func(t *testing.T) {
			withCtx := ctx

			calls := new(atomic.Int64)
			expCalls := 0
			sentinel := errors.New("sentinel")
			for range 16 {
				expCalls++
				task := Func("test.run", func(ctx context.Context) error {
					calls.Add(1)
					return sentinel
				})
				err := Run(withCtx, task)
				require.Error(t, err)
			}

			{
				Wait(withCtx)

				gotCalls := int(calls.Load())
				require.Equal(t, expCalls, gotCalls)
			}
		})
	})
}

func TestMiddleware(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	t.Run("Success", func(t *testing.T) {
		var errs []error
		hrFunc := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			for i := range 10 {
				typ := fmt.Sprintf("test-task-%v", i)
				task := Func(typ, func(ctx context.Context) error {
					return nil
				})

				err := Run(r.Context(), task)
				errs = append(errs, err)
			}
		})
		hr := Middleware(hrFunc)

		req, err := http.NewRequestWithContext(ctx, "GET", "/", nil)
		require.NoError(t, err)

		for i := range 10 {
			hr.ServeHTTP(nil, req)
			require.Equal(t, 10*(i+1), len(errs))
		}
		for _, e := range errs {
			require.NoError(t, e)
		}
	})

	t.Run("Failure", func(t *testing.T) {
		var errs []error
		hrFunc := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			for i := range 10 {
				typ := fmt.Sprintf("test-task-%v", i)
				task := Func(typ, func(ctx context.Context) error {
					return nil
				})
				err := Run(r.Context(), task)
				errs = append(errs, err)
			}
		})
		hr := Middleware(hrFunc)

		ctx = With(ctx)
		req, err := http.NewRequestWithContext(ctx, "GET", "/", nil)
		require.NoError(t, err)

		hr.ServeHTTP(nil, req)
		require.Equal(t, 10, len(errs))

		for _, e := range errs {
			require.NoError(t, e)
		}

		errs = nil
		hr.ServeHTTP(nil, req)
		require.Equal(t, 10, len(errs))
		for _, e := range errs {
			require.Error(t, e)
		}
	})
}
