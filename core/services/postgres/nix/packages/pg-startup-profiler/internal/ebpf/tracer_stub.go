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
