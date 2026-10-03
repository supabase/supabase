package config

// DefaultExclusions contains the hardcoded default exclusions for the scanner.
// These represent paths, kernel parameters, and scanners that should be excluded
// by default to avoid noise and false positives in security audits.
var DefaultExclusions = Config{
	Paths: []string{
		// Virtual filesystems that don't represent persistent state
		"/proc/*", // Process information pseudo-filesystem
		"/sys/*",  // Kernel and system information
		"/dev/*",  // Device files
		"/run/*",  // Runtime data (ephemeral)

		// Temporary directories (high churn, not security-relevant)
		"/tmp/*",
		"/var/tmp/*",

		// Additional runtime directories
		"/var/run/*",
		"/var/cache/*",

		// Log files (often rotated, not configuration state)
		"/var/log/*",

		// Package manager caches
		"/var/lib/apt/lists/*",
		"/var/cache/apt/*",

		// Kernel version-specific files (change with kernel updates)
		"/boot/System.map-*",
		"/boot/config-*",
		"/boot/initrd.img-*",
		"/boot/vmlinuz-*",

		// Development headers (not security-relevant)
		"/usr/include/*",

		// Python cache files (regenerated, not security-relevant)
		"*/__pycache__/*",
		"*.pyc",

		// User cache directories (dynamic, user-specific)
		"*/.cache/*",

		// Nix build logs and var (deployment artifacts)
		"/nix/var/*",

		// Dynamic linker cache (regenerated)
		"/etc/ld.so.cache",

		// Shell history (dynamic, user-specific)
		"*/.bash_history",
		"*/.zsh_history",

		// Ansible cache (deployment artifacts)
		"*/.ansible/*",
	},

	ShallowDirs: []string{
		// Nix store - contents change with deployments, only audit top-level structure
		"/nix/store",

		// PostgreSQL data directory - contents are dynamic database state
		"/data/pgdata",

		// Deployment/provisioning tools - internal implementation details
		"/opt/saltstack",

		// Locally installed software - deep internals not security-relevant
		"/usr/local/share",
		"/usr/local/lib",
	},

	KernelParams: []string{
		// Dynamic kernel parameters that change frequently and aren't security-relevant
		"fs.dentry-state",                 // Dentry cache statistics (dynamic)
		"fs.file-nr",                      // File handle statistics (dynamic)
		"fs.inode-nr",                     // Inode statistics (dynamic)
		"fs.inode-state",                  // Inode state (dynamic)
		"fs.aio-nr",                       // Current async I/O operations (dynamic)
		"kernel.random.uuid",              // Random UUID (changes every read)
		"kernel.random.boot_id",           // Boot ID (changes per boot but not security-relevant)
		"kernel.random.entropy_avail",     // Available entropy (changes constantly)
		"kernel.ns_last_pid",              // Last PID allocated (dynamic)
		"kernel.pty.nr",                   // Current number of PTYs (dynamic)
		"net.netfilter.*_conntrack_count", // Connection tracking counts (dynamic)
		"net.netfilter.*_conntrack_max",   // Connection tracking max (dynamic)

		// RAM-dependent parameters (auto-tuned based on system memory)
		"fs.epoll.max_user_watches",             // Computed from RAM
		"net.netfilter.nf_conntrack_buckets",    // Auto-tuned based on RAM
		"net.netfilter.nf_conntrack_expect_max", // Derived from buckets
	},

	DisabledScanners: []string{
		// Scanners disabled by default for performance/noise reasons
		"port",    // Network port scanning (slow, often noisy)
		"process", // Process scanning (very dynamic, rarely relevant for config audit)
	},
}
