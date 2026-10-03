package utilities

import (
	"context"
	"sync"

	"github.com/supabase/auth/internal/ctxkey"
)

var requestIDKey = ctxkey.New[string]("request_id")

// WithRequestID adds the provided request ID to the context.
func WithRequestID(ctx context.Context, id string) context.Context {
	return requestIDKey.WithValue(ctx, id)
}

// GetRequestID reads the request ID from the context.
func GetRequestID(ctx context.Context) string {
	return requestIDKey.Value(ctx)
}

// WaitForCleanup waits until all long-running goroutines shut
// down cleanly or until the provided context signals done.
func WaitForCleanup(ctx context.Context, wg *sync.WaitGroup) {
	cleanupDone := make(chan struct{})

	go func() {
		defer close(cleanupDone)

		wg.Wait()
	}()

	select {
	case <-ctx.Done():
		return

	case <-cleanupDone:
		return
	}
}
