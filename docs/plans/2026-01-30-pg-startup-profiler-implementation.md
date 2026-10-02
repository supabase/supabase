# pg-startup-profiler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Go tool that profiles PostgreSQL container startup time using eBPF tracing and log parsing.

**Architecture:** Docker API for container lifecycle, eBPF probes (execve/openat) filtered by cgroup for syscall tracing, log stream parsing with configurable YAML rules for PostgreSQL events, unified timeline correlating all events.

**Tech Stack:** Go 1.23+, cilium/ebpf, spf13/cobra, docker/docker client, gopkg.in/yaml.v3, charmbracelet/log

---

## Task 1: Project Scaffolding

**Files:**
- Create: `nix/packages/pg-startup-profiler/go.mod`
- Create: `nix/packages/pg-startup-profiler/cmd/pg-startup-profiler/main.go`
- Create: `nix/packages/pg-startup-profiler/internal/logger/logger.go`

**Step 1: Create directory structure**

```bash
mkdir -p nix/packages/pg-startup-profiler/cmd/pg-startup-profiler
mkdir -p nix/packages/pg-startup-profiler/internal/logger
mkdir -p nix/packages/pg-startup-profiler/internal/docker
mkdir -p nix/packages/pg-startup-profiler/internal/ebpf
mkdir -p nix/packages/pg-startup-profiler/internal/logs
mkdir -p nix/packages/pg-startup-profiler/internal/rules
mkdir -p nix/packages/pg-startup-profiler/internal/report
mkdir -p nix/packages/pg-startup-profiler/rules
```

**Step 2: Create go.mod**

```go
// nix/packages/pg-startup-profiler/go.mod
module github.com/supabase/pg-startup-profiler

go 1.23.0

require (
	github.com/charmbracelet/log v0.4.2
	github.com/cilium/ebpf v0.17.3
	github.com/docker/docker v27.5.1+incompatible
	github.com/spf13/cobra v1.8.1
	gopkg.in/yaml.v3 v3.0.1
)
```

**Step 3: Create logger (matching supascan pattern)**

```go
// nix/packages/pg-startup-profiler/internal/logger/logger.go
package logger

import (
	"io"
	"os"

	"github.com/charmbracelet/log"
)

func Setup(verbose, debug bool) *log.Logger {
	var output io.Writer = io.Discard
	var level log.Level = log.InfoLevel

	if debug {
		output = os.Stderr
		level = log.DebugLevel
	} else if verbose {
		output = os.Stderr
		level = log.InfoLevel
	}

	return log.NewWithOptions(output, log.Options{
		Level:           level,
		ReportTimestamp: debug,
	})
}
```

**Step 4: Create main.go with root command**

```go
// nix/packages/pg-startup-profiler/cmd/pg-startup-profiler/main.go
package main

import (
	"os"

	"github.com/spf13/cobra"
)

var (
	version = "dev"
)

var rootCmd = &cobra.Command{
	Use:   "pg-startup-profiler",
	Short: "PostgreSQL container startup profiler",
	Long: `pg-startup-profiler - Profile PostgreSQL container startup time

A tool for measuring and analyzing PostgreSQL container startup performance
using eBPF tracing and log parsing.

Commands:
  profile   Profile a container's startup time
  compare   Compare startup times between two images

Examples:
  # Profile a Dockerfile
  pg-startup-profiler profile --dockerfile Dockerfile-17

  # Profile existing image
  pg-startup-profiler profile --image pg-docker-test:17

  # JSON output
  pg-startup-profiler profile --image pg-docker-test:17 --json

  # Compare two images
  pg-startup-profiler compare --baseline img:v1 --candidate img:v2
`,
	Version: version,
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
```

**Step 5: Commit**

```bash
git add nix/packages/pg-startup-profiler/
git commit -m "feat(pg-startup-profiler): scaffold project structure"
```

---

## Task 2: Rules System

**Files:**
- Create: `nix/packages/pg-startup-profiler/internal/rules/rules.go`
- Create: `nix/packages/pg-startup-profiler/internal/rules/rules_test.go`
- Create: `nix/packages/pg-startup-profiler/rules/default.yaml`

**Step 1: Write failing test for rules loading**

```go
// nix/packages/pg-startup-profiler/internal/rules/rules_test.go
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
  regex: '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \w+)'
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
```

**Step 2: Run test to verify it fails**

```bash
cd nix/packages/pg-startup-profiler && go test ./internal/rules/... -v
```

Expected: FAIL - package not found

**Step 3: Implement rules system**

```go
// nix/packages/pg-startup-profiler/internal/rules/rules.go
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
	for _, p := range r.Patterns {
		if p.compiled.MatchString(line) {
			p.seen++
			if p.seen == p.Occurrence {
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
}
```

**Step 4: Run test to verify it passes**

```bash
cd nix/packages/pg-startup-profiler && go test ./internal/rules/... -v
```

Expected: PASS

**Step 5: Create default rules**

```yaml
# nix/packages/pg-startup-profiler/rules/default.yaml
patterns:
  - name: "initdb_start"
    regex: 'running bootstrap script'

  - name: "initdb_complete"
    regex: 'syncing data to disk'

  - name: "temp_server_start"
    regex: 'database system is ready to accept connections'
    occurrence: 1

  - name: "server_shutdown"
    regex: 'database system is shut down'

  - name: "final_server_ready"
    regex: 'database system is ready to accept connections'
    occurrence: 2
    marks_ready: true

  - name: "extension_load"
    regex: 'statement: CREATE EXTENSION.*"(?P<extension>[^"]+)"'
    capture: extension

  - name: "bgworker_start"
    regex: '(?P<worker>pg_cron|pg_net).*started'
    capture: worker

  - name: "migration_file"
    regex: 'running (?P<file>/docker-entrypoint-initdb\.d/[^\s]+)'
    capture: file

timestamp:
  regex: '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \w+)'
  format: "2006-01-02 15:04:05.000 MST"
```

**Step 6: Commit**

```bash
git add nix/packages/pg-startup-profiler/internal/rules/ nix/packages/pg-startup-profiler/rules/
git commit -m "feat(pg-startup-profiler): add pluggable rules system"
```

---

## Task 3: Docker Client

**Files:**
- Create: `nix/packages/pg-startup-profiler/internal/docker/client.go`
- Create: `nix/packages/pg-startup-profiler/internal/docker/client_test.go`

**Step 1: Write failing test**

```go
// nix/packages/pg-startup-profiler/internal/docker/client_test.go
package docker

import (
	"testing"
)

func TestNewClient(t *testing.T) {
	client, err := NewClient()
	if err != nil {
		t.Skipf("Docker not available: %v", err)
	}
	defer client.Close()

	if client.cli == nil {
		t.Error("expected client to be initialized")
	}
}
```

**Step 2: Run test to verify it fails**

```bash
cd nix/packages/pg-startup-profiler && go test ./internal/docker/... -v
```

**Step 3: Implement Docker client**

```go
// nix/packages/pg-startup-profiler/internal/docker/client.go
package docker

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

type Client struct {
	cli *client.Client
}

type ContainerInfo struct {
	ID        string
	CgroupID  uint64
	StartTime time.Time
}

func NewClient() (*Client, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}
	return &Client{cli: cli}, nil
}

func (c *Client) Close() error {
	return c.cli.Close()
}

func (c *Client) ImageExists(ctx context.Context, imageName string) (bool, error) {
	_, _, err := c.cli.ImageInspectWithRaw(ctx, imageName)
	if err != nil {
		if client.IsErrNotFound(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (c *Client) BuildImage(ctx context.Context, dockerfile, contextPath, tag string) error {
	// Implementation for building from Dockerfile
	// Uses docker build API
	return fmt.Errorf("not implemented - use docker build externally")
}

func (c *Client) CreateContainer(ctx context.Context, imageName string, env []string) (*ContainerInfo, error) {
	resp, err := c.cli.ContainerCreate(ctx, &container.Config{
		Image: imageName,
		Env:   env,
	}, &container.HostConfig{}, nil, nil, "")
	if err != nil {
		return nil, fmt.Errorf("failed to create container: %w", err)
	}

	return &ContainerInfo{
		ID: resp.ID,
	}, nil
}

func (c *Client) StartContainer(ctx context.Context, containerID string) (time.Time, error) {
	startTime := time.Now()
	if err := c.cli.ContainerStart(ctx, containerID, container.StartOptions{}); err != nil {
		return time.Time{}, fmt.Errorf("failed to start container: %w", err)
	}
	return startTime, nil
}

func (c *Client) StopContainer(ctx context.Context, containerID string) error {
	timeout := 10
	return c.cli.ContainerStop(ctx, containerID, container.StopOptions{Timeout: &timeout})
}

func (c *Client) RemoveContainer(ctx context.Context, containerID string) error {
	return c.cli.ContainerRemove(ctx, containerID, container.RemoveOptions{Force: true})
}

func (c *Client) GetContainerCgroupID(ctx context.Context, containerID string) (uint64, error) {
	inspect, err := c.cli.ContainerInspect(ctx, containerID)
	if err != nil {
		return 0, err
	}
	// The cgroup path contains the container ID
	// We need to get the cgroup inode for eBPF filtering
	// This is platform-specific and may need adjustment
	_ = inspect
	return 0, fmt.Errorf("cgroup ID extraction not implemented")
}

func (c *Client) StreamLogs(ctx context.Context, containerID string, callback func(line string, timestamp time.Time)) error {
	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Timestamps: true,
	}

	reader, err := c.cli.ContainerLogs(ctx, containerID, options)
	if err != nil {
		return err
	}
	defer reader.Close()

	// Docker multiplexes stdout/stderr, need to demux
	pr, pw := io.Pipe()
	go func() {
		stdcopy.StdCopy(pw, pw, reader)
		pw.Close()
	}()

	scanner := bufio.NewScanner(pr)
	for scanner.Scan() {
		line := scanner.Text()
		// Docker prepends timestamp when Timestamps: true
		callback(line, time.Now())
	}

	return scanner.Err()
}

func (c *Client) PullImage(ctx context.Context, imageName string) error {
	reader, err := c.cli.ImagePull(ctx, imageName, image.PullOptions{})
	if err != nil {
		return err
	}
	defer reader.Close()
	io.Copy(io.Discard, reader)
	return nil
}
```

**Step 4: Run test**

```bash
cd nix/packages/pg-startup-profiler && go test ./internal/docker/... -v
```

**Step 5: Commit**

```bash
git add nix/packages/pg-startup-profiler/internal/docker/
git commit -m "feat(pg-startup-profiler): add Docker client wrapper"
```

---

## Task 4: Log Parser

**Files:**
- Create: `nix/packages/pg-startup-profiler/internal/logs/parser.go`
- Create: `nix/packages/pg-startup-profiler/internal/logs/parser_test.go`

**Step 1: Write failing test**

```go
// nix/packages/pg-startup-profiler/internal/logs/parser_test.go
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
	go func() {
		parser.ParseLine("2026-01-30 13:18:21.286 UTC [41] LOG:  database system is ready to accept connections", events)
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
```

**Step 2: Run test to verify it fails**

```bash
cd nix/packages/pg-startup-profiler && go test ./internal/logs/... -v
```

**Step 3: Implement log parser**

```go
// nix/packages/pg-startup-profiler/internal/logs/parser.go
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

func (p *Parser) ParseLine(line string, events chan<- Event) {
	match := p.rules.Match(line)
	if match != nil {
		events <- Event{
			Name:       match.Pattern.Name,
			Timestamp:  match.Timestamp,
			Captures:   match.Captures,
			Line:       line,
			MarksReady: match.Pattern.MarksReady,
		}
	}
}

func (p *Parser) Reset() {
	p.rules.Reset()
}
```

**Step 4: Run test**

```bash
cd nix/packages/pg-startup-profiler && go test ./internal/logs/... -v
```

**Step 5: Commit**

```bash
git add nix/packages/pg-startup-profiler/internal/logs/
git commit -m "feat(pg-startup-profiler): add log parser"
```

---

## Task 5: Timeline and Event Aggregation

**Files:**
- Create: `nix/packages/pg-startup-profiler/internal/report/timeline.go`
- Create: `nix/packages/pg-startup-profiler/internal/report/timeline_test.go`

**Step 1: Write failing test**

```go
// nix/packages/pg-startup-profiler/internal/report/timeline_test.go
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
		Type:      EventTypeLog,
		Name:      "final_server_ready",
		Timestamp: start.Add(5 * time.Second),
	})

	tl.Finalize()

	if tl.TotalDuration != 5*time.Second {
		t.Errorf("expected 5s duration, got %v", tl.TotalDuration)
	}

	if len(tl.Events) != 2 {
		t.Errorf("expected 2 events, got %d", len(tl.Events))
	}
}
```

**Step 2: Run test to verify it fails**

```bash
cd nix/packages/pg-startup-profiler && go test ./internal/report/... -v
```

**Step 3: Implement timeline**

```go
// nix/packages/pg-startup-profiler/internal/report/timeline.go
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
```

**Step 4: Run test**

```bash
cd nix/packages/pg-startup-profiler && go test ./internal/report/... -v
```

**Step 5: Commit**

```bash
git add nix/packages/pg-startup-profiler/internal/report/
git commit -m "feat(pg-startup-profiler): add timeline event aggregation"
```

---

## Task 6: CLI Table Output

**Files:**
- Create: `nix/packages/pg-startup-profiler/internal/report/table.go`

**Step 1: Implement table output**

```go
// nix/packages/pg-startup-profiler/internal/report/table.go
package report

import (
	"fmt"
	"io"
	"sort"
	"strings"
	"time"
)

func PrintTable(w io.Writer, imageName string, tl *Timeline) {
	fmt.Fprintln(w, strings.Repeat("=", 80))
	fmt.Fprintln(w, "PostgreSQL Container Startup Profile")
	fmt.Fprintln(w, strings.Repeat("=", 80))
	fmt.Fprintln(w)
	fmt.Fprintf(w, "Image:    %s\n", imageName)
	fmt.Fprintf(w, "Total:    %s\n", formatDuration(tl.TotalDuration))
	fmt.Fprintln(w)

	// Phases
	fmt.Fprintln(w, "PHASES")
	fmt.Fprintln(w, strings.Repeat("-", 80))
	fmt.Fprintf(w, "  %-30s %-12s %-8s\n", "Phase", "Duration", "Pct")
	fmt.Fprintln(w, "  "+strings.Repeat("-", 50))
	for _, p := range tl.Phases {
		fmt.Fprintf(w, "  %-30s %-12s %5.1f%%\n", p.Name, formatDuration(p.Duration), p.Percent)
	}
	fmt.Fprintln(w)

	// Init scripts (top 5)
	if len(tl.InitScripts) > 0 {
		fmt.Fprintln(w, "INIT SCRIPTS (top 5 by duration)")
		fmt.Fprintln(w, strings.Repeat("-", 80))

		// Sort by duration
		sorted := make([]ScriptTiming, len(tl.InitScripts))
		copy(sorted, tl.InitScripts)
		sort.Slice(sorted, func(i, j int) bool {
			return sorted[i].Duration > sorted[j].Duration
		})

		limit := 5
		if len(sorted) < limit {
			limit = len(sorted)
		}

		fmt.Fprintf(w, "  %-50s %s\n", "Script", "Duration")
		fmt.Fprintln(w, "  "+strings.Repeat("-", 60))
		for _, s := range sorted[:limit] {
			// Truncate path for display
			path := s.Path
			if len(path) > 48 {
				path = "..." + path[len(path)-45:]
			}
			fmt.Fprintf(w, "  %-50s %s\n", path, formatDuration(s.Duration))
		}
		fmt.Fprintln(w)
	}

	// Extensions
	if len(tl.Extensions) > 0 {
		fmt.Fprintln(w, "EXTENSIONS")
		fmt.Fprintln(w, strings.Repeat("-", 80))
		fmt.Fprintf(w, "  %-20s %s\n", "Extension", "Loaded at")
		fmt.Fprintln(w, "  "+strings.Repeat("-", 30))
		for _, e := range tl.Extensions {
			fmt.Fprintf(w, "  %-20s %s\n", e.Name, formatDuration(e.LoadTime))
		}
		fmt.Fprintln(w)
	}

	// Background workers
	if len(tl.BGWorkers) > 0 {
		fmt.Fprintln(w, "BACKGROUND WORKERS")
		fmt.Fprintln(w, strings.Repeat("-", 80))
		fmt.Fprintf(w, "  %-20s %s\n", "Worker", "Started at")
		fmt.Fprintln(w, "  "+strings.Repeat("-", 30))
		for _, w := range tl.BGWorkers {
			fmt.Fprintf(w, "  %-20s %s\n", w.Name, formatDuration(w.StartedAt))
		}
		fmt.Fprintln(w)
	}

	// Event timeline (verbose)
	if len(tl.Events) > 0 {
		fmt.Fprintln(w, "EVENT TIMELINE")
		fmt.Fprintln(w, strings.Repeat("-", 80))
		for _, e := range tl.Events {
			fmt.Fprintf(w, "  [%s] %-8s %s\n",
				formatDuration(e.Duration),
				e.Type,
				truncate(e.Name, 60))
		}
	}
}

func formatDuration(d time.Duration) string {
	if d < time.Millisecond {
		return fmt.Sprintf("%.3fms", float64(d.Microseconds())/1000)
	}
	if d < time.Second {
		return fmt.Sprintf("%.0fms", float64(d.Milliseconds()))
	}
	return fmt.Sprintf("%.3fs", d.Seconds())
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
```

**Step 2: Commit**

```bash
git add nix/packages/pg-startup-profiler/internal/report/table.go
git commit -m "feat(pg-startup-profiler): add CLI table output"
```

---

## Task 7: JSON Output

**Files:**
- Create: `nix/packages/pg-startup-profiler/internal/report/json.go`

**Step 1: Implement JSON output**

```go
// nix/packages/pg-startup-profiler/internal/report/json.go
package report

import (
	"encoding/json"
	"io"
)

type JSONReport struct {
	Image         string            `json:"image"`
	TotalDurationMs int64           `json:"total_duration_ms"`
	Phases        []JSONPhase       `json:"phases"`
	InitScripts   []JSONScript      `json:"init_scripts"`
	Extensions    []JSONExtension   `json:"extensions"`
	BGWorkers     []JSONWorker      `json:"background_workers"`
	Events        []JSONEvent       `json:"events,omitempty"`
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
	Type       string            `json:"type"`
	Name       string            `json:"name"`
	OffsetMs   int64             `json:"offset_ms"`
	Captures   map[string]string `json:"captures,omitempty"`
}

func PrintJSON(w io.Writer, imageName string, tl *Timeline, verbose bool) error {
	report := JSONReport{
		Image:         imageName,
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

	for _, w := range tl.BGWorkers {
		report.BGWorkers = append(report.BGWorkers, JSONWorker{
			Name:        w.Name,
			StartedAtMs: w.StartedAt.Milliseconds(),
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
```

**Step 2: Commit**

```bash
git add nix/packages/pg-startup-profiler/internal/report/json.go
git commit -m "feat(pg-startup-profiler): add JSON output"
```

---

## Task 8: eBPF Tracer (Stub for Linux)

**Files:**
- Create: `nix/packages/pg-startup-profiler/internal/ebpf/tracer.go`
- Create: `nix/packages/pg-startup-profiler/internal/ebpf/tracer_stub.go`

**Step 1: Create tracer interface and stub**

```go
// nix/packages/pg-startup-profiler/internal/ebpf/tracer.go
//go:build linux

package ebpf

import (
	"context"
	"time"
)

type ExecEvent struct {
	Timestamp time.Time
	Comm      string
	Args      string
	PID       uint32
}

type OpenEvent struct {
	Timestamp time.Time
	Path      string
	PID       uint32
}

type Tracer struct {
	cgroupID uint64
	execChan chan ExecEvent
	openChan chan OpenEvent
}

func NewTracer(cgroupID uint64) (*Tracer, error) {
	return &Tracer{
		cgroupID: cgroupID,
		execChan: make(chan ExecEvent, 1000),
		openChan: make(chan OpenEvent, 1000),
	}, nil
}

func (t *Tracer) Start(ctx context.Context) error {
	// TODO: Implement actual eBPF probe attachment
	// This requires:
	// 1. Load eBPF program from embedded bytecode
	// 2. Attach to tracepoints
	// 3. Set up perf buffer for events
	// 4. Filter by cgroup ID
	return nil
}

func (t *Tracer) Stop() error {
	close(t.execChan)
	close(t.openChan)
	return nil
}

func (t *Tracer) ExecEvents() <-chan ExecEvent {
	return t.execChan
}

func (t *Tracer) OpenEvents() <-chan OpenEvent {
	return t.openChan
}
```

```go
// nix/packages/pg-startup-profiler/internal/ebpf/tracer_stub.go
//go:build !linux

package ebpf

import (
	"context"
	"fmt"
	"time"
)

type ExecEvent struct {
	Timestamp time.Time
	Comm      string
	Args      string
	PID       uint32
}

type OpenEvent struct {
	Timestamp time.Time
	Path      string
	PID       uint32
}

type Tracer struct {
	execChan chan ExecEvent
	openChan chan OpenEvent
}

func NewTracer(cgroupID uint64) (*Tracer, error) {
	return nil, fmt.Errorf("eBPF tracing is only supported on Linux")
}

func (t *Tracer) Start(ctx context.Context) error {
	return fmt.Errorf("eBPF tracing is only supported on Linux")
}

func (t *Tracer) Stop() error {
	return nil
}

func (t *Tracer) ExecEvents() <-chan ExecEvent {
	return nil
}

func (t *Tracer) OpenEvents() <-chan OpenEvent {
	return nil
}
```

**Step 2: Commit**

```bash
git add nix/packages/pg-startup-profiler/internal/ebpf/
git commit -m "feat(pg-startup-profiler): add eBPF tracer interface and stub"
```

---

## Task 9: Profile Command

**Files:**
- Create: `nix/packages/pg-startup-profiler/cmd/pg-startup-profiler/profile.go`

**Step 1: Implement profile command**

```go
// nix/packages/pg-startup-profiler/cmd/pg-startup-profiler/profile.go
package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"github.com/supabase/pg-startup-profiler/internal/docker"
	"github.com/supabase/pg-startup-profiler/internal/logger"
	"github.com/supabase/pg-startup-profiler/internal/logs"
	"github.com/supabase/pg-startup-profiler/internal/report"
	"github.com/supabase/pg-startup-profiler/internal/rules"

	_ "embed"
)

//go:embed ../../rules/default.yaml
var defaultRulesYAML []byte

var (
	flagImage      string
	flagDockerfile string
	flagJSON       bool
	flagVerbose    bool
	flagRulesFile  string
	flagTimeout    time.Duration
)

func init() {
	profileCmd.Flags().StringVar(&flagImage, "image", "", "Docker image to profile")
	profileCmd.Flags().StringVar(&flagDockerfile, "dockerfile", "", "Dockerfile to build and profile")
	profileCmd.Flags().BoolVar(&flagJSON, "json", false, "Output as JSON")
	profileCmd.Flags().BoolVar(&flagVerbose, "verbose", false, "Include full event timeline")
	profileCmd.Flags().StringVar(&flagRulesFile, "rules", "", "Custom rules YAML file")
	profileCmd.Flags().DurationVar(&flagTimeout, "timeout", 5*time.Minute, "Timeout for container startup")

	rootCmd.AddCommand(profileCmd)
}

var profileCmd = &cobra.Command{
	Use:   "profile",
	Short: "Profile container startup time",
	Long:  "Profile a PostgreSQL container's startup time and show breakdown",
	RunE:  runProfile,
}

func runProfile(cmd *cobra.Command, args []string) error {
	log := logger.Setup(flagVerbose, false)

	if flagImage == "" && flagDockerfile == "" {
		return fmt.Errorf("either --image or --dockerfile is required")
	}

	// Load rules
	var rulesData []byte
	if flagRulesFile != "" {
		data, err := os.ReadFile(flagRulesFile)
		if err != nil {
			return fmt.Errorf("failed to read rules file: %w", err)
		}
		rulesData = data
	} else {
		rulesData = defaultRulesYAML
	}

	r, err := rules.LoadFromYAML(rulesData)
	if err != nil {
		return fmt.Errorf("failed to load rules: %w", err)
	}

	// Create Docker client
	dockerClient, err := docker.NewClient()
	if err != nil {
		return fmt.Errorf("failed to create docker client: %w", err)
	}
	defer dockerClient.Close()

	ctx, cancel := context.WithTimeout(context.Background(), flagTimeout)
	defer cancel()

	// Handle signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigCh
		cancel()
	}()

	imageName := flagImage
	if flagDockerfile != "" {
		// Build image
		log.Info("Building image from Dockerfile", "dockerfile", flagDockerfile)
		imageName = fmt.Sprintf("pg-startup-profiler-test:%d", time.Now().Unix())
		// For now, shell out to docker build
		return fmt.Errorf("--dockerfile not yet implemented, please build image first and use --image")
	}

	// Check image exists
	exists, err := dockerClient.ImageExists(ctx, imageName)
	if err != nil {
		return fmt.Errorf("failed to check image: %w", err)
	}
	if !exists {
		return fmt.Errorf("image not found: %s", imageName)
	}

	log.Info("Profiling container startup", "image", imageName)

	// Create timeline
	timeline := report.NewTimeline()
	parser := logs.NewParser(r)

	// Create container
	env := []string{"POSTGRES_PASSWORD=postgres"}
	container, err := dockerClient.CreateContainer(ctx, imageName, env)
	if err != nil {
		return fmt.Errorf("failed to create container: %w", err)
	}
	defer func() {
		dockerClient.StopContainer(context.Background(), container.ID)
		dockerClient.RemoveContainer(context.Background(), container.ID)
	}()

	// Start log streaming
	logEvents := make(chan logs.Event, 100)
	logDone := make(chan error, 1)
	go func() {
		err := dockerClient.StreamLogs(ctx, container.ID, func(line string, ts time.Time) {
			parser.ParseLine(line, logEvents)
		})
		logDone <- err
	}()

	// Start container and record time
	startTime, err := dockerClient.StartContainer(ctx, container.ID)
	if err != nil {
		return fmt.Errorf("failed to start container: %w", err)
	}

	timeline.AddEvent(report.Event{
		Type:      report.EventTypeDocker,
		Name:      "container_start",
		Timestamp: startTime,
	})

	// Wait for ready or timeout
	ready := false
	for !ready {
		select {
		case event := <-logEvents:
			timeline.AddEvent(report.Event{
				Type:       report.EventTypeLog,
				Name:       event.Name,
				Timestamp:  event.Timestamp,
				Captures:   event.Captures,
				MarksReady: event.MarksReady,
			})
			if event.MarksReady {
				ready = true
			}
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for container to be ready")
		case err := <-logDone:
			if err != nil && !ready {
				return fmt.Errorf("log streaming error: %w", err)
			}
		}
	}

	// Finalize timeline
	timeline.Finalize()

	// Output results
	if flagJSON {
		return report.PrintJSON(os.Stdout, imageName, timeline, flagVerbose)
	}
	report.PrintTable(os.Stdout, imageName, timeline)
	return nil
}
```

**Step 2: Update main.go imports**

Ensure go.mod is updated and run:

```bash
cd nix/packages/pg-startup-profiler && go mod tidy
```

**Step 3: Commit**

```bash
git add nix/packages/pg-startup-profiler/
git commit -m "feat(pg-startup-profiler): add profile command"
```

---

## Task 10: Nix Package Integration

**Files:**
- Create: `nix/packages/pg-startup-profiler.nix`
- Modify: `nix/packages/default.nix`
- Modify: `nix/apps.nix`

**Step 1: Create Nix package**

```nix
# nix/packages/pg-startup-profiler.nix
{ pkgs, lib, ... }:
let
  pg-startup-profiler = pkgs.buildGoModule {
    pname = "pg-startup-profiler";
    version = "0.1.0";

    src = ./pg-startup-profiler;

    vendorHash = null; # Will be updated after first build attempt

    subPackages = [ "cmd/pg-startup-profiler" ];

    # Disable CGO for simpler builds (eBPF stub for non-Linux)
    env.CGO_ENABLED = "0";

    ldflags = [
      "-s"
      "-w"
      "-X main.version=0.1.0"
    ];

    doCheck = true;

    meta = with lib; {
      description = "PostgreSQL container startup profiler";
      license = licenses.asl20;
      platforms = platforms.linux ++ platforms.darwin;
    };
  };
in
{
  inherit pg-startup-profiler;
}
```

**Step 2: Add to default.nix**

Add after line 22 (after supascan-pkgs):

```nix
pg-startup-profiler-pkgs = pkgs.callPackage ./pg-startup-profiler.nix {
  inherit (pkgs) lib;
};
```

Add to packages (after supascan):

```nix
inherit (pg-startup-profiler-pkgs) pg-startup-profiler;
```

**Step 3: Add to apps.nix**

Add to the apps attribute set:

```nix
pg-startup-profiler = mkApp "pg-startup-profiler";
```

**Step 4: Build and get vendor hash**

```bash
nix build .#pg-startup-profiler 2>&1 | grep "got:"
```

Update vendorHash in pg-startup-profiler.nix with the actual hash.

**Step 5: Commit**

```bash
git add nix/packages/pg-startup-profiler.nix nix/packages/default.nix nix/apps.nix
git commit -m "feat(pg-startup-profiler): add Nix packaging"
```

---

## Task 11: Integration Test

**Files:**
- Create: `nix/packages/pg-startup-profiler/cmd/pg-startup-profiler/profile_test.go`

**Step 1: Write integration test**

```go
// nix/packages/pg-startup-profiler/cmd/pg-startup-profiler/profile_test.go
//go:build integration

package main

import (
	"os/exec"
	"strings"
	"testing"
)

func TestProfileIntegration(t *testing.T) {
	// Skip if docker is not available
	if _, err := exec.LookPath("docker"); err != nil {
		t.Skip("docker not available")
	}

	// This test requires a pre-built image
	// In CI, this would be built first
	cmd := exec.Command("go", "run", ".", "profile", "--image", "postgres:16-alpine", "--timeout", "2m")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatalf("profile command failed: %v\nOutput: %s", err, output)
	}

	// Check output contains expected sections
	outputStr := string(output)
	if !strings.Contains(outputStr, "PostgreSQL Container Startup Profile") {
		t.Error("output missing header")
	}
	if !strings.Contains(outputStr, "Total:") {
		t.Error("output missing total duration")
	}
}
```

**Step 2: Commit**

```bash
git add nix/packages/pg-startup-profiler/cmd/pg-startup-profiler/profile_test.go
git commit -m "test(pg-startup-profiler): add integration test"
```

---

## Summary

Tasks 1-11 implement the core `pg-startup-profiler` tool with:
- Pluggable YAML rules for log pattern matching
- Docker client for container lifecycle
- Log parsing with PostgreSQL timestamp extraction
- Timeline event aggregation
- CLI table and JSON output
- eBPF tracer stub (full implementation is Task 12+)
- Nix packaging following repo patterns

The eBPF tracing (Task 12+) can be implemented later to add syscall-level visibility. The tool is functional without it using log parsing alone.
