package scanners

import (
	"context"
	"fmt"
	"strconv"

	"github.com/shirou/gopsutil/v3/net"
	"github.com/supabase/supascan/internal/spec"
)

// PortScanner scans all listening ports using gopsutil.
// This is a DYNAMIC scanner - it requires opt-in via IncludeDynamic flag.
type PortScanner struct {
	stats ScanStats
}

func (s *PortScanner) Name() string {
	return "ports"
}

func (s *PortScanner) IsDynamic() bool {
	return true // Listening ports change dynamically
}

func (s *PortScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting port scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("port"); err != nil {
		return s.stats, err
	}

	// Get listening ports
	ports, err := s.getListeningPorts(ctx, opts)
	if err != nil {
		return s.stats, err
	}

	// Add each port to writer
	for portKey, port := range ports {
		if err := writer.Add(port); err != nil {
			return s.stats, fmt.Errorf("failed to write port spec for %s: %w", portKey, err)
		}
	}

	opts.Logger.Info("Port scan complete", "ports_found", len(ports))

	return s.stats, nil
}

// getListeningPorts retrieves all listening TCP/UDP ports
func (s *PortScanner) getListeningPorts(ctx context.Context, opts ScanOptions) (map[string]spec.PortSpec, error) {
	ports := make(map[string]spec.PortSpec)

	// Get TCP connections
	tcpConns, err := net.ConnectionsWithContext(ctx, "tcp")
	if err != nil {
		opts.Logger.Warn("Failed to get TCP connections, continuing with partial results", "error", err)
	} else {
		for _, conn := range tcpConns {
			// Only include listening ports
			if conn.Status != "LISTEN" {
				continue
			}

			portNum := conn.Laddr.Port
			portKey := fmt.Sprintf("tcp:%d", portNum)

			// Get IP addresses for this port
			var ips []string
			if conn.Laddr.IP != "" && conn.Laddr.IP != "::" && conn.Laddr.IP != "0.0.0.0" {
				ips = append(ips, conn.Laddr.IP)
			}

			ports[portKey] = spec.PortSpec{
				Port:      strconv.Itoa(int(portNum)),
				Listening: true,
				IP:        ips,
			}
		}
	}

	// Get UDP connections (UDP doesn't have "LISTEN" state, but we check for bound ports)
	udpConns, err := net.ConnectionsWithContext(ctx, "udp")
	if err != nil {
		opts.Logger.Warn("Failed to get UDP connections, continuing with partial results", "error", err)
	} else {
		for _, conn := range udpConns {
			portNum := conn.Laddr.Port
			portKey := fmt.Sprintf("udp:%d", portNum)

			// Get IP addresses for this port
			var ips []string
			if conn.Laddr.IP != "" && conn.Laddr.IP != "::" && conn.Laddr.IP != "0.0.0.0" {
				ips = append(ips, conn.Laddr.IP)
			}

			ports[portKey] = spec.PortSpec{
				Port:      strconv.Itoa(int(portNum)),
				Listening: true,
				IP:        ips,
			}
		}
	}

	return ports, nil
}
