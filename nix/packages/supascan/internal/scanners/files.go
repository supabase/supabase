package scanners

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"os/user"
	"path/filepath"
	"syscall"

	"github.com/supabase/supascan/internal/config"
	"github.com/supabase/supascan/internal/spec"
)

// FileScanner scans all files on the filesystem and captures permissions.
// Uses single-threaded filepath.WalkDir for memory efficiency.
type FileScanner struct {
	rootPath string // For testing (default: "/")
	stats    ScanStats
}

func (s *FileScanner) Name() string {
	return "files"
}

func (s *FileScanner) IsDynamic() bool {
	return false // File metadata is relatively static
}

func (s *FileScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting filesystem scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("file"); err != nil {
		return s.stats, err
	}

	// Default to root filesystem
	root := s.rootPath
	if root == "" {
		root = "/"
	}

	// Get config
	cfg, ok := opts.Config.(*config.Config)
	if !ok && opts.Config != nil {
		return s.stats, fmt.Errorf("config is not of type *config.Config")
	}
	if cfg == nil {
		cfg = &config.Config{} // Empty config if none provided
	}

	// WalkDir is faster than Walk (doesn't call Lstat unless needed)
	// Single-threaded scan keeps memory usage bounded
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		// Check context for cancellation (Ctrl+C support)
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		// Skip excluded paths (pseudo-filesystems, temp dirs)
		if cfg.IsPathExcluded(path) {
			if d != nil && d.IsDir() {
				return filepath.SkipDir // Don't descend into excluded dirs
			}
			return nil
		}

		// Handle shallow directories - limit recursion depth
		depth := cfg.GetShallowDirDepth(path)
		if depth >= 0 {
			if d != nil && d.IsDir() {
				if depth == 0 && cfg.ShallowDepth == 0 {
					// Depth 0 means capture this directory entry but don't recurse into it
					info, err := d.Info()
					if err == nil {
						dirSpec := s.buildDirSpec(path, info)
						if err := writer.Add(dirSpec); err != nil {
							return fmt.Errorf("failed to write dir spec: %w", err)
						}
						s.stats.FilesScanned++
					}
					opts.Logger.Debug("Captured shallow dir, skipping contents", "path", path)
					return filepath.SkipDir
				}
				if depth >= cfg.ShallowDepth {
					// This directory is at or beyond the configured shallow depth - skip it
					opts.Logger.Debug("Skipping directory beyond shallow depth", "path", path, "depth", depth, "max_depth", cfg.ShallowDepth)
					return filepath.SkipDir
				}
			} else if d != nil && d.Type().IsRegular() {
				// For files inside shallow dirs, skip if at or beyond shallow depth
				if depth > cfg.ShallowDepth {
					opts.Logger.Debug("Skipping file beyond shallow depth", "path", path, "depth", depth, "max_depth", cfg.ShallowDepth)
					return nil
				}
			}
		}

		// Handle walk errors (permission denied, etc.)
		if err != nil {
			return s.handleError(err, path, opts)
		}

		// Only process regular files (skip dirs, symlinks, etc.)
		if d == nil || !d.Type().IsRegular() {
			return nil
		}

		// Get file info
		info, err := d.Info()
		if err != nil {
			return s.handleError(err, path, opts)
		}

		// Build GOSS file spec
		fileSpec := s.buildFileSpec(path, info)

		// Add to chunked writer (auto-flushes every 1000 files)
		if err := writer.Add(fileSpec); err != nil {
			return fmt.Errorf("failed to write file spec: %w", err)
		}

		s.stats.FilesScanned++

		// Log progress every 10k files
		if s.stats.FilesScanned%10000 == 0 {
			opts.Logger.Debug("Scan progress", "files_scanned", s.stats.FilesScanned)
		}

		return nil
	})

	return s.stats, err
}

// buildFileSpec creates a GOSS file spec from os.FileInfo
func (s *FileScanner) buildFileSpec(path string, info fs.FileInfo) spec.FileSpec {
	// Extract Unix permissions and ownership
	sys := info.Sys().(*syscall.Stat_t)

	// Mode with leading zero (GOSS format: "0644" not "644")
	mode := fmt.Sprintf("0%o", info.Mode().Perm())

	// Get username/groupname from UID/GID
	owner := getUsername(sys.Uid)
	group := getGroupname(sys.Gid)

	return spec.FileSpec{
		Path:     path,
		Exists:   true,
		Mode:     mode,
		Owner:    owner,
		Group:    group,
		Filetype: "file",
	}
}

// buildDirSpec creates a GOSS file spec for a directory
func (s *FileScanner) buildDirSpec(path string, info fs.FileInfo) spec.FileSpec {
	// Extract Unix permissions and ownership
	sys := info.Sys().(*syscall.Stat_t)

	// Mode with leading zero (GOSS format: "0755" not "755")
	mode := fmt.Sprintf("0%o", info.Mode().Perm())

	// Get username/groupname from UID/GID
	owner := getUsername(sys.Uid)
	group := getGroupname(sys.Gid)

	return spec.FileSpec{
		Path:     path,
		Exists:   true,
		Mode:     mode,
		Owner:    owner,
		Group:    group,
		Filetype: "directory",
	}
}

// handleError processes errors based on strict mode
func (s *FileScanner) handleError(err error, path string, opts ScanOptions) error {
	// Permission denied is common and expected
	if os.IsPermission(err) {
		opts.Logger.Debug("Permission denied, skipping", "path", path, "error", err.Error())

		s.stats.FilesSkipped++

		if opts.Strict {
			return fmt.Errorf("permission denied: %s: %w", path, err)
		}
		return nil // Skip and continue
	}

	// Other errors might be serious
	if opts.Strict {
		return fmt.Errorf("failed to access %s: %w", path, err)
	}

	opts.Logger.Warn("Failed to access file, skipping", "path", path, "error", err.Error())

	s.stats.FilesSkipped++
	return nil
}

// getUsername returns username for UID (or UID as string if lookup fails)
func getUsername(uid uint32) string {
	u, err := user.LookupId(fmt.Sprintf("%d", uid))
	if err != nil {
		// Fall back to numeric UID if lookup fails
		return fmt.Sprintf("%d", uid)
	}
	return u.Username
}

// getGroupname returns groupname for GID (or GID as string if lookup fails)
func getGroupname(gid uint32) string {
	g, err := user.LookupGroupId(fmt.Sprintf("%d", gid))
	if err != nil {
		// Fall back to numeric GID if lookup fails
		return fmt.Sprintf("%d", gid)
	}
	return g.Name
}
