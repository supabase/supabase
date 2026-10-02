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
