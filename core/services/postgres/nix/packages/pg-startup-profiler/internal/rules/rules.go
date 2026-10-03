package rules

import (
	"regexp"
	"time"

	"gopkg.in/yaml.v3"
)

type Pattern struct {
	Name       string `yaml:"name"`
	Regex      string `yaml:"regex"`
	Occurrence int    `yaml:"occurrence,omitempty"`
	MarksReady bool   `yaml:"marks_ready,omitempty"`
	Capture    string `yaml:"capture,omitempty"`

	compiled *regexp.Regexp
	seen     int
}

type TimestampConfig struct {
	Regex  string `yaml:"regex"`
	Format string `yaml:"format"`

	compiled *regexp.Regexp
}

type Rules struct {
	Patterns  []*Pattern      `yaml:"patterns"`
	Timestamp TimestampConfig `yaml:"timestamp"`

	// regexCounts tracks how many times each unique regex has been seen
	// This allows multiple patterns with the same regex but different occurrence values
	regexCounts map[string]int
}

type Match struct {
	Pattern   *Pattern
	Timestamp time.Time
	Captures  map[string]string
	Line      string
}

func LoadFromYAML(data []byte) (*Rules, error) {
	var rules Rules
	if err := yaml.Unmarshal(data, &rules); err != nil {
		return nil, err
	}

	// Initialize regex counts map
	rules.regexCounts = make(map[string]int)

	// Compile patterns
	for _, p := range rules.Patterns {
		compiled, err := regexp.Compile(p.Regex)
		if err != nil {
			return nil, err
		}
		p.compiled = compiled
		if p.Occurrence == 0 {
			p.Occurrence = 1
		}
	}

	// Compile timestamp regex
	if rules.Timestamp.Regex != "" {
		compiled, err := regexp.Compile(rules.Timestamp.Regex)
		if err != nil {
			return nil, err
		}
		rules.Timestamp.compiled = compiled
	}

	return &rules, nil
}

func (r *Rules) Match(line string) *Match {
	// Track which regexes matched in this line to only increment count once per regex
	matchedRegexes := make(map[string]bool)

	for _, p := range r.Patterns {
		if p.compiled.MatchString(line) {
			// Only increment counter once per unique regex per line
			if !matchedRegexes[p.Regex] {
				matchedRegexes[p.Regex] = true
				r.regexCounts[p.Regex]++
			}

			if r.regexCounts[p.Regex] == p.Occurrence {
				match := &Match{
					Pattern:  p,
					Line:     line,
					Captures: make(map[string]string),
				}

				// Extract timestamp
				if r.Timestamp.compiled != nil {
					if ts := r.Timestamp.compiled.FindStringSubmatch(line); len(ts) > 1 {
						if t, err := time.Parse(r.Timestamp.Format, ts[1]); err == nil {
							match.Timestamp = t
						}
					}
				}

				// Extract named captures
				if p.Capture != "" {
					names := p.compiled.SubexpNames()
					matches := p.compiled.FindStringSubmatch(line)
					for i, name := range names {
						if name != "" && i < len(matches) {
							match.Captures[name] = matches[i]
						}
					}
				}

				return match
			}
		}
	}
	return nil
}

func (r *Rules) Reset() {
	for _, p := range r.Patterns {
		p.seen = 0
	}
	// Clear the shared regex counts
	r.regexCounts = make(map[string]int)
}
