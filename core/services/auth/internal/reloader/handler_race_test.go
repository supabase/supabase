//go:build race
// +build race

package reloader

import (
	"context"
	"net/http"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestAtomicHandlerRaces(t *testing.T) {
	type testHandler struct{ http.Handler }

	hrFn := func() http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})
	}

	const count = 8
	hrFuncMap := make(map[http.Handler]struct{}, count)
	for i := 0; i < count; i++ {
		hrFuncMap[&testHandler{hrFn()}] = struct{}{}
	}

	hr := NewAtomicHandler(nil)
	assert.NotNil(t, hr)

	var wg sync.WaitGroup
	defer wg.Wait()

	ctx, cancel := context.WithTimeout(context.Background(), time.Second/4)
	defer cancel()

	// We create 8 goroutines reading & writing to the handler concurrently. If
	// a race condition occurs the test will fail and halt.
	for i := 0; i < count; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			for hrFunc := range hrFuncMap {
				select {
				case <-ctx.Done():
				default:
				}

				hr.Store(hrFunc)

				// Calling string should be safe
				hr.String()

				got := hr.load()
				_, ok := hrFuncMap[got]
				if !ok {
					// This will trigger a race failure / exit test
					t.Fatal("unknown handler returned from load()")
					return
				}
			}
		}()
	}
	wg.Wait()
}
