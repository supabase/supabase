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
