package logs

import (
	"time"

	"github.com/supabase/pg-startup-profiler/internal/rules"
)

type Event struct {
	Name       string
	Timestamp  time.Time
	Captures   map[string]string
	Line       string
	MarksReady bool
}

type Parser struct {
	rules *rules.Rules
}

func NewParser(r *rules.Rules) *Parser {
	return &Parser{rules: r}
}

func (p *Parser) ParseLine(line string, fallbackTime time.Time, events chan<- Event) {
	match := p.rules.Match(line)
	if match != nil {
		ts := match.Timestamp
		// Use fallback time if no timestamp was parsed from the line
		if ts.IsZero() {
			ts = fallbackTime
		}
		events <- Event{
			Name:       match.Pattern.Name,
			Timestamp:  ts,
			Captures:   match.Captures,
			Line:       line,
			MarksReady: match.Pattern.MarksReady,
		}
	}
}

func (p *Parser) Reset() {
	p.rules.Reset()
}
