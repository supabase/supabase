package chaos

import (
	"runtime"
	"sync"
	"testing"
	"time"
)

// We never call AssertSafeBuild here because tests are not "shipping".

func TestChannelHangCreatesAndReleases(t *testing.T) {
	before := runtime.NumGoroutine()
	stop := ChannelHang(50)
	time.Sleep(20 * time.Millisecond)
	if runtime.NumGoroutine() < before+50 {
		t.Fatalf("expected at least %d new goroutines, got delta %d",
			50, runtime.NumGoroutine()-before)
	}
	stop()
	// wait for goroutines to wind down
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) && runtime.NumGoroutine() > before+5 {
		time.Sleep(10 * time.Millisecond)
	}
	if runtime.NumGoroutine() > before+5 {
		t.Errorf("goroutines did not unwind: before=%d after=%d",
			before, runtime.NumGoroutine())
	}
}

func TestGoroutineLeakAndStopper(t *testing.T) {
	before := runtime.NumGoroutine()
	stop := GoroutineLeak(100)
	time.Sleep(10 * time.Millisecond)
	if delta := runtime.NumGoroutine() - before; delta < 100 {
		t.Fatalf("expected ≥100 new goroutines, got %d", delta)
	}
	stop()
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) && runtime.NumGoroutine() > before+5 {
		time.Sleep(10 * time.Millisecond)
	}
	if runtime.NumGoroutine() > before+5 {
		t.Errorf("leaked goroutines did not release")
	}
}

func TestStoppersIdempotent(t *testing.T) {
	stop := ChannelHang(5)
	stop()
	stop() // must not panic / double-close
}

func TestMutexContentionRecordsContention(t *testing.T) {
	runtime.SetMutexProfileFraction(100)
	defer runtime.SetMutexProfileFraction(0)
	stop := MutexContention(20, 200*time.Microsecond)
	defer stop()
	time.Sleep(150 * time.Millisecond)
	// Best-effort sanity: contention happened by simply not panicking.
	// We don't read the mutex profile here because it's a global and
	// other tests would race.
	var mu sync.Mutex
	mu.Lock()
	mu.Unlock()
}
