# pg-startup-profiler Design

## Overview

A Go tool for profiling PostgreSQL container startup time with detailed breakdown of what contributes to startup latency.

## Goals

- Measure total startup time (what users perceive: container start → ready for connections)
- Provide detailed breakdown: init scripts, migrations, extensions, background workers
- Non-intrusive: no modifications to container images
- Accurate timing using eBPF tracing + PostgreSQL log timestamps
- Pluggable log pattern matching for flexibility

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    pg-startup-profiler                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Docker Client                                            │
│     └── Start container                                      │
│     └── Get container's cgroup ID for filtering              │
│                                                              │
│  2. eBPF Probes (attached to kernel)                         │
│     ├── execve    → every process/command executed           │
│     ├── openat    → every file opened (SQL, .so, config)     │
│                                                              │
│  3. Log Stream Parser                                        │
│     └── Attach to container stdout/stderr                    │
│     └── Match configurable patterns                          │
│     └── Extract PostgreSQL timestamps (accurate)             │
│                                                              │
│  4. Event Filter                                             │
│     └── Filter eBPF events to container's cgroup             │
│                                                              │
│  5. Timeline Builder                                         │
│     └── Correlate all events into unified timeline           │
│     └── Group into phases                                    │
│                                                              │
│  6. Reporter                                                 │
│     └── CLI table / JSON output                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## eBPF Probes

| Probe | Syscall | What we capture |
|-------|---------|-----------------|
| `tracepoint/syscalls/sys_enter_execve` | execve | Command, args, timestamp |
| `tracepoint/syscalls/sys_enter_openat` | openat | File path, timestamp |

Events are filtered by cgroup ID to only capture activity from the target container.

## Pluggable Log Rules

Rules defined in YAML for matching PostgreSQL log patterns:

```yaml
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
    marks_ready: true  # This indicates container is ready

  - name: "extension_load"
    regex: 'CREATE EXTENSION.*(?P<extension>\w+)'
    capture: extension

  - name: "bgworker_start"
    regex: '(?P<worker>pg_cron|pg_net).*started'
    capture: worker

timestamp:
  regex: '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \w+)'
  format: "2006-01-02 15:04:05.000 MST"
```

## Output Formats

### CLI Table (default)

```
════════════════════════════════════════════════════════════════════════════════
PostgreSQL Container Startup Profile
════════════════════════════════════════════════════════════════════════════════

Image:    pg-docker-test:17
Total:    8.234s

PHASES
────────────────────────────────────────────────────────────────────────────────
  Phase                        Duration    Pct
  ─────────────────────────────────────────────────
  Container init               0.143s      1.7%
  initdb                       2.535s     30.8%
  Init scripts                 4.912s     59.6%
  Final server start           0.644s      7.8%

INIT SCRIPTS (top 5 by duration)
────────────────────────────────────────────────────────────────────────────────
  Script                                          Duration
  ────────────────────────────────────────────────────────
  migrations/00-schema.sql                        1.203s
  migrations/20211115181400_auth-schema.sql       0.892s
  migrations/20230201034123_extensions.sql        0.445s
  ...

EXTENSIONS
────────────────────────────────────────────────────────────────────────────────
  Extension          Load time
  ──────────────────────────────
  vector             0.245s
  pgsodium           0.189s
  pg_graphql         0.156s
  ...

BACKGROUND WORKERS
────────────────────────────────────────────────────────────────────────────────
  Worker             Started at
  ──────────────────────────────
  pg_cron            8.198s
  pg_net             8.212s
```

### JSON (`--json`)

```json
{
  "image": "pg-docker-test:17",
  "total_duration_ms": 8234,
  "phases": {
    "container_init": {"duration_ms": 143, "pct": 1.7},
    "initdb": {"duration_ms": 2535, "pct": 30.8},
    "init_scripts": {"duration_ms": 4912, "pct": 59.6},
    "final_server_start": {"duration_ms": 644, "pct": 7.8}
  },
  "init_scripts": [...],
  "extensions": [...],
  "events": [...]
}
```

## CLI Interface

```bash
# Profile a Dockerfile (builds and profiles)
pg-startup-profiler --dockerfile Dockerfile-17

# Profile existing image
pg-startup-profiler --image pg-docker-test:17

# JSON output for CI
pg-startup-profiler --image pg-docker-test:17 --json

# Custom rules file
pg-startup-profiler --image pg-docker-test:17 --rules my-rules.yaml

# Verbose (include full event timeline)
pg-startup-profiler --image pg-docker-test:17 --verbose

# Compare two images
pg-startup-profiler compare --baseline pg-docker-test:17 --candidate pg-docker-test:17-slim
```

## Project Structure

```
nix/packages/pg-startup-profiler/
├── cmd/
│   └── pg-startup-profiler/
│       └── main.go              # Cobra CLI entry point
├── internal/
│   ├── docker/
│   │   └── client.go            # Docker API interactions
│   ├── ebpf/
│   │   ├── bpf_bpfel.go         # Generated eBPF Go bindings
│   │   ├── bpf_bpfel.o          # Compiled eBPF bytecode
│   │   ├── probes.c             # eBPF programs (C)
│   │   └── tracer.go            # Go wrapper for eBPF
│   ├── logs/
│   │   └── parser.go            # Log stream + pattern matching
│   ├── rules/
│   │   ├── rules.go             # YAML rule loading
│   │   └── default.go           # Embedded default rules
│   └── report/
│       ├── timeline.go          # Event correlation
│       ├── table.go             # CLI table output
│       └── json.go              # JSON output
├── rules/
│   └── default.yaml             # Default PostgreSQL patterns
├── go.mod
├── go.sum
└── README.md
```

## Nix Integration

Package definition follows existing patterns (like supascan):
- `nix/packages/pg-startup-profiler.nix` - build definition
- Registered in `nix/packages/default.nix`
- Added to `nix/apps.nix` for `nix run`

## Requirements

- Linux only (eBPF requirement)
- Elevated privileges (CAP_BPF or root) for eBPF tracing
- Docker daemon access

## Dependencies

- Go 1.21+
- cilium/ebpf (pure Go eBPF library)
- spf13/cobra (CLI framework)
- docker/docker (Docker API client)
- gopkg.in/yaml.v3 (YAML parsing)

## Safety Considerations

The tool is safe for testing contexts:
- eBPF probes are read-only observers
- No modifications to container images
- No injection into containers
- Container runs exactly as it would in production
- Only runs during explicit profiling
