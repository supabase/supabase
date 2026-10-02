package observability

import (
	"context"
	"sync"

	"github.com/supabase/auth/internal/utilities"
)

var (
	cleanupWaitGroup sync.WaitGroup
)

// WaitForCleanup waits until all observability long-running goroutines shut
// down cleanly or until the provided context signals done.
func WaitForCleanup(ctx context.Context) {
	utilities.WaitForCleanup(ctx, &cleanupWaitGroup)
}
