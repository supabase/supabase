package report

import (
	"sort"
	"time"
)

type EventType string

const (
	EventTypeDocker EventType = "DOCKER"
	EventTypeExec   EventType = "EXEC"
	EventTypeOpen   EventType = "OPEN"
	EventTypeLog    EventType = "LOG"
)

type Event struct {
	Type       EventType
	Name       string
	Timestamp  time.Time
	Duration   time.Duration
	Details    string
	Captures   map[string]string
	MarksReady bool
}

type Phase struct {
	Name     string
	Start    time.Time
	End      time.Time
	Duration time.Duration
	Percent  float64
}

type Timeline struct {
	Events        []Event
	Phases        []Phase
	TotalDuration time.Duration
	StartTime     time.Time
	EndTime       time.Time
	Extensions    []ExtensionTiming
	InitScripts   []ScriptTiming
	BGWorkers     []WorkerTiming
}

type ExtensionTiming struct {
	Name     string
	LoadTime time.Duration
}

type ScriptTiming struct {
	Path     string
	Duration time.Duration
}

type WorkerTiming struct {
	Name      string
	StartedAt time.Duration
}

func NewTimeline() *Timeline {
	return &Timeline{
		Events: make([]Event, 0),
	}
}

func (t *Timeline) AddEvent(e Event) {
	t.Events = append(t.Events, e)
}

func (t *Timeline) Finalize() {
	if len(t.Events) == 0 {
		return
	}

	// Sort by timestamp
	sort.Slice(t.Events, func(i, j int) bool {
		return t.Events[i].Timestamp.Before(t.Events[j].Timestamp)
	})

	t.StartTime = t.Events[0].Timestamp

	// Find the ready event
	for _, e := range t.Events {
		if e.MarksReady {
			t.EndTime = e.Timestamp
			break
		}
	}

	if t.EndTime.IsZero() {
		t.EndTime = t.Events[len(t.Events)-1].Timestamp
	}

	t.TotalDuration = t.EndTime.Sub(t.StartTime)

	// Calculate relative timestamps
	for i := range t.Events {
		t.Events[i].Duration = t.Events[i].Timestamp.Sub(t.StartTime)
	}

	// Extract extension timings
	t.extractExtensions()

	// Extract init script timings
	t.extractInitScripts()

	// Extract background worker timings
	t.extractBGWorkers()

	// Build phases
	t.buildPhases()
}

func (t *Timeline) extractExtensions() {
	for _, e := range t.Events {
		if e.Name == "extension_load" {
			if ext, ok := e.Captures["extension"]; ok {
				t.Extensions = append(t.Extensions, ExtensionTiming{
					Name:     ext,
					LoadTime: e.Duration,
				})
			}
		}
	}
}

func (t *Timeline) extractInitScripts() {
	var lastScript string
	var lastTime time.Time

	for _, e := range t.Events {
		if e.Name == "migration_file" {
			if file, ok := e.Captures["file"]; ok {
				if lastScript != "" {
					t.InitScripts = append(t.InitScripts, ScriptTiming{
						Path:     lastScript,
						Duration: e.Timestamp.Sub(lastTime),
					})
				}
				lastScript = file
				lastTime = e.Timestamp
			}
		}
	}
}

func (t *Timeline) extractBGWorkers() {
	for _, e := range t.Events {
		if e.Name == "bgworker_start" {
			if worker, ok := e.Captures["worker"]; ok {
				t.BGWorkers = append(t.BGWorkers, WorkerTiming{
					Name:      worker,
					StartedAt: e.Duration,
				})
			}
		}
	}
}

func (t *Timeline) buildPhases() {
	// Simplified phase detection
	// In practice, would use more sophisticated logic based on events
	t.Phases = []Phase{
		{Name: "Total", Duration: t.TotalDuration, Percent: 100.0},
	}
}
