package rules

import (
	"testing"
)

func TestLoadRules(t *testing.T) {
	yaml := `
patterns:
  - name: "test_pattern"
    regex: 'database system is ready'
    marks_ready: true

timestamp:
  regex: '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \w+)'
  format: "2006-01-02 15:04:05.000 MST"
`
	rules, err := LoadFromYAML([]byte(yaml))
	if err != nil {
		t.Fatalf("failed to load rules: %v", err)
	}

	if len(rules.Patterns) != 1 {
		t.Errorf("expected 1 pattern, got %d", len(rules.Patterns))
	}

	if rules.Patterns[0].Name != "test_pattern" {
		t.Errorf("expected name 'test_pattern', got '%s'", rules.Patterns[0].Name)
	}

	if !rules.Patterns[0].MarksReady {
		t.Error("expected marks_ready to be true")
	}
}

func TestPatternMatch(t *testing.T) {
	yaml := `
patterns:
  - name: "ready"
    regex: 'database system is ready to accept connections'
    marks_ready: true

timestamp:
  regex: '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \w+)'
  format: "2006-01-02 15:04:05.000 MST"
`
	rules, _ := LoadFromYAML([]byte(yaml))

	line := "2026-01-30 13:18:21.286 UTC [41] LOG:  database system is ready to accept connections"
	match := rules.Match(line)

	if match == nil {
		t.Fatal("expected match, got nil")
	}

	if match.Pattern.Name != "ready" {
		t.Errorf("expected pattern 'ready', got '%s'", match.Pattern.Name)
	}

	if match.Timestamp.IsZero() {
		t.Error("expected timestamp to be parsed")
	}
}
