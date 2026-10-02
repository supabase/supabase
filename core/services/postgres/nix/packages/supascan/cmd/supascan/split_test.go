package main

import (
	"testing"
)

func TestCategorizeFilePath(t *testing.T) {
	tests := []struct {
		path     string
		expected string
	}{
		{"/boot/grub/grub.cfg", "boot"},
		{"/boot/efi/EFI/BOOT/BOOTX64.EFI", "boot"},
		{"/data/pgdata/base", "data"},
		{"/data/50M_PLACEHOLDER", "data"},
		{"/etc/postgresql/postgresql.conf", "postgres-config"},
		{"/etc/postgres/pg_hba.conf", "postgres-config"},
		{"/etc/ssl/certs/ca-certificates.crt", "ssl"},
		{"/etc/ssl/private/server.key", "ssl"},
		{"/etc/systemd/system/postgresql.service", "systemd"},
		{"/etc/nftables.conf", "security"},
		{"/etc/nftables/supabase.conf", "security"},
		{"/etc/fail2ban/jail.local", "security"},
		{"/etc/passwd", "etc"},
		{"/etc/hosts", "etc"},
		{"/home/ubuntu/.bashrc", "home"},
		{"/home/postgres/.profile", "home"},
		{"/nix/store/abc123-package", "nix"},
		{"/nix/var/nix/profiles", "nix"},
		{"/opt/saltstack/salt", "opt"},
		{"/usr/local/bin/supascan", "usr-local"},
		{"/usr/local/share/doc", "usr-local"},
		{"/usr/bin/bash", "usr"},
		{"/usr/lib/systemd", "usr"},
		{"/var/lib/postgresql/data", "postgres-data"},
		{"/var/lib/postgresql/15/main", "postgres-data"},
		{"/var/log/syslog", "var"},
		{"/var/run/postgresql", "var"},
		{"/tmp/test", "other"},
		{"/root/.bashrc", "other"},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			result := categorizeFilePath(tt.path)
			if result != tt.expected {
				t.Errorf("categorizeFilePath(%q) = %q, want %q", tt.path, result, tt.expected)
			}
		})
	}
}

func TestCategorizeFiles(t *testing.T) {
	files := map[string]interface{}{
		"/etc/passwd":                 map[string]interface{}{"exists": true},
		"/etc/ssl/certs/ca.crt":       map[string]interface{}{"exists": true},
		"/boot/grub/grub.cfg":         map[string]interface{}{"exists": true},
		"/var/lib/postgresql/data":    map[string]interface{}{"exists": true},
		"/home/ubuntu/.bashrc":        map[string]interface{}{"exists": true},
		"/etc/fail2ban/jail.local":    map[string]interface{}{"exists": true},
		"/etc/postgresql/pg_hba.conf": map[string]interface{}{"exists": true},
	}

	categories := categorizeFiles(files)

	// Check expected categories exist
	expectedCategories := []string{"etc", "ssl", "boot", "postgres-data", "home", "security", "postgres-config"}
	for _, cat := range expectedCategories {
		if _, ok := categories[cat]; !ok {
			t.Errorf("Expected category %q not found", cat)
		}
	}

	// Check specific categorizations
	if _, ok := categories["etc"]["/etc/passwd"]; !ok {
		t.Error("/etc/passwd should be in 'etc' category")
	}
	if _, ok := categories["ssl"]["/etc/ssl/certs/ca.crt"]; !ok {
		t.Error("/etc/ssl/certs/ca.crt should be in 'ssl' category")
	}
	if _, ok := categories["security"]["/etc/fail2ban/jail.local"]; !ok {
		t.Error("/etc/fail2ban/jail.local should be in 'security' category")
	}
	if _, ok := categories["postgres-config"]["/etc/postgresql/pg_hba.conf"]; !ok {
		t.Error("/etc/postgresql/pg_hba.conf should be in 'postgres-config' category")
	}
}
