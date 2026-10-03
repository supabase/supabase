package logs

import (
	"testing"
	"time"

	"github.com/supabase/pg-startup-profiler/internal/rules"
)

func TestParser(t *testing.T) {
	rulesYAML := `
patterns:
  - name: "ready"
    regex: 'database system is ready to accept connections'
    marks_ready: true

timestamp:
  regex: '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \w+)'
  format: "2006-01-02 15:04:05.000 MST"
`
	r, _ := rules.LoadFromYAML([]byte(rulesYAML))
	parser := NewParser(r)

	events := make(chan Event, 10)
	fallbackTime := time.Now()
	go func() {
		parser.ParseLine("2026-01-30 13:18:21.286 UTC [41] LOG:  database system is ready to accept connections", fallbackTime, events)
		close(events)
	}()

	event := <-events
	if event.Name != "ready" {
		t.Errorf("expected event name 'ready', got '%s'", event.Name)
	}

	if event.MarksReady != true {
		t.Error("expected event to mark ready")
	}
}
