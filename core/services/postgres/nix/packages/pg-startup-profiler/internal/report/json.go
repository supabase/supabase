package report

import (
	"encoding/json"
	"io"
)

type JSONReport struct {
	Image           string          `json:"image"`
	TotalDurationMs int64           `json:"total_duration_ms"`
	Phases          []JSONPhase     `json:"phases"`
	InitScripts     []JSONScript    `json:"init_scripts"`
	Extensions      []JSONExtension `json:"extensions"`
	BGWorkers       []JSONWorker    `json:"background_workers"`
	Events          []JSONEvent     `json:"events,omitempty"`
}

type JSONPhase struct {
	Name       string  `json:"name"`
	DurationMs int64   `json:"duration_ms"`
	Percent    float64 `json:"pct"`
}

type JSONScript struct {
	Path       string `json:"path"`
	DurationMs int64  `json:"duration_ms"`
}

type JSONExtension struct {
	Name       string `json:"name"`
	LoadTimeMs int64  `json:"load_time_ms"`
}

type JSONWorker struct {
	Name        string `json:"name"`
	StartedAtMs int64  `json:"started_at_ms"`
}

type JSONEvent struct {
	Type     string            `json:"type"`
	Name     string            `json:"name"`
	OffsetMs int64             `json:"offset_ms"`
	Captures map[string]string `json:"captures,omitempty"`
}

func PrintJSON(w io.Writer, imageName string, tl *Timeline, verbose bool) error {
	report := JSONReport{
		Image:           imageName,
		TotalDurationMs: tl.TotalDuration.Milliseconds(),
	}

	for _, p := range tl.Phases {
		report.Phases = append(report.Phases, JSONPhase{
			Name:       p.Name,
			DurationMs: p.Duration.Milliseconds(),
			Percent:    p.Percent,
		})
	}

	for _, s := range tl.InitScripts {
		report.InitScripts = append(report.InitScripts, JSONScript{
			Path:       s.Path,
			DurationMs: s.Duration.Milliseconds(),
		})
	}

	for _, e := range tl.Extensions {
		report.Extensions = append(report.Extensions, JSONExtension{
			Name:       e.Name,
			LoadTimeMs: e.LoadTime.Milliseconds(),
		})
	}

	for _, bw := range tl.BGWorkers {
		report.BGWorkers = append(report.BGWorkers, JSONWorker{
			Name:        bw.Name,
			StartedAtMs: bw.StartedAt.Milliseconds(),
		})
	}

	if verbose {
		for _, e := range tl.Events {
			report.Events = append(report.Events, JSONEvent{
				Type:     string(e.Type),
				Name:     e.Name,
				OffsetMs: e.Duration.Milliseconds(),
				Captures: e.Captures,
			})
		}
	}

	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	return encoder.Encode(report)
}
