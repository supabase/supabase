package scanners

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/supabase/supascan/internal/spec"
)

// GroupScanner scans all groups from /etc/group.
type GroupScanner struct {
	groupPath string // For testing (default: "/etc/group")
	stats     ScanStats
}

func (s *GroupScanner) Name() string {
	return "groups"
}

func (s *GroupScanner) IsDynamic() bool {
	return false // Groups are relatively static
}

func (s *GroupScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting group scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("group"); err != nil {
		return s.stats, err
	}

	// Get groups
	groups, err := s.getGroups(opts)
	if err != nil {
		return s.stats, err
	}

	// Add each group to writer
	for groupname, group := range groups {
		if err := writer.Add(group); err != nil {
			return s.stats, fmt.Errorf("failed to write group spec for %s: %w", groupname, err)
		}
	}

	opts.Logger.Info("Group scan complete", "groups_found", len(groups))

	return s.stats, nil
}

// getGroups reads and parses /etc/group
func (s *GroupScanner) getGroups(opts ScanOptions) (map[string]spec.GroupSpec, error) {
	groupPath := s.groupPath
	if groupPath == "" {
		groupPath = "/etc/group"
	}

	file, err := os.Open(groupPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open %s: %w", groupPath, err)
	}
	defer file.Close()

	groups := make(map[string]spec.GroupSpec)
	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse group line: groupname:password:gid:users
		fields := strings.Split(line, ":")
		if len(fields) != 4 {
			// Skip malformed lines
			opts.Logger.Debug("Skipping malformed group line", "line", lineNum, "content", line)
			continue
		}

		groupname := fields[0]
		gidStr := fields[2]

		// Parse GID
		gid, err := strconv.Atoi(gidStr)
		if err != nil {
			opts.Logger.Debug("Invalid GID, skipping group", "groupname", groupname, "gid", gidStr)
			continue
		}

		groups[groupname] = spec.GroupSpec{
			Name:   groupname,
			Exists: true,
			GID:    gid,
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading %s: %w", groupPath, err)
	}

	return groups, nil
}
