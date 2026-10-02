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

// UserScanner scans all users from /etc/passwd.
type UserScanner struct {
	passwdPath string // For testing (default: "/etc/passwd")
	stats      ScanStats
}

func (s *UserScanner) Name() string {
	return "users"
}

func (s *UserScanner) IsDynamic() bool {
	return false // User accounts are relatively static
}

func (s *UserScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting user scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("user"); err != nil {
		return s.stats, err
	}

	// Get users
	users, err := s.getUsers(opts)
	if err != nil {
		return s.stats, err
	}

	// Add each user to writer
	for username, user := range users {
		if err := writer.Add(user); err != nil {
			return s.stats, fmt.Errorf("failed to write user spec for %s: %w", username, err)
		}
		s.stats.UsersScanned++
	}

	opts.Logger.Info("User scan complete", "users_found", len(users))

	return s.stats, nil
}

// getUsers reads and parses /etc/passwd
func (s *UserScanner) getUsers(opts ScanOptions) (map[string]spec.UserSpec, error) {
	passwdPath := s.passwdPath
	if passwdPath == "" {
		passwdPath = "/etc/passwd"
	}

	file, err := os.Open(passwdPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open %s: %w", passwdPath, err)
	}
	defer file.Close()

	users := make(map[string]spec.UserSpec)
	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse passwd line: username:password:uid:gid:comment:home:shell
		fields := strings.Split(line, ":")
		if len(fields) != 7 {
			// Skip malformed lines
			opts.Logger.Debug("Skipping malformed passwd line", "line", lineNum, "content", line)
			continue
		}

		username := fields[0]
		uidStr := fields[2]
		gidStr := fields[3]
		home := fields[5]
		shell := fields[6]

		// Parse UID
		uid, err := strconv.Atoi(uidStr)
		if err != nil {
			opts.Logger.Debug("Invalid UID, skipping user", "username", username, "uid", uidStr)
			continue
		}

		// Parse GID
		gid, err := strconv.Atoi(gidStr)
		if err != nil {
			opts.Logger.Debug("Invalid GID, skipping user", "username", username, "gid", gidStr)
			continue
		}

		users[username] = spec.UserSpec{
			Username: username,
			Exists:   true,
			UID:      uid,
			GID:      gid,
			Home:     home,
			Shell:    shell,
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading %s: %w", passwdPath, err)
	}

	return users, nil
}
