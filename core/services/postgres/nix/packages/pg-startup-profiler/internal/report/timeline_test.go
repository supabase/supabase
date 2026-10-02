package report

import (
	"testing"
	"time"
)

func TestTimeline(t *testing.T) {
	tl := NewTimeline()

	start := time.Now()
	tl.AddEvent(Event{
		Type:      EventTypeDocker,
		Name:      "container_start",
		Timestamp: start,
	})

	tl.AddEvent(Event{
		Type:       EventTypeLog,
		Name:       "final_server_ready",
		Timestamp:  start.Add(5 * time.Second),
		MarksReady: true,
	})

	tl.Finalize()

	if tl.TotalDuration != 5*time.Second {
		t.Errorf("expected 5s duration, got %v", tl.TotalDuration)
	}

	if len(tl.Events) != 2 {
		t.Errorf("expected 2 events, got %d", len(tl.Events))
	}
}
