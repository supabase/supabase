package main

import (
	"fmt"
	"os"
	"slices"
)

// Vulnerabilities with no upstream fix — remove entries once fixed.
var ignore = map[string]string{
	"GO-2026-4518": "pgproto3/v2 DoS, no fix available (EOL). Transitive via pgconn v1 + pop/v6.",
	"GO-2026-5004": "pgx/v4 SQL injection via dollar-quoted placeholder confusion, no fix available. Transitive via pop/v6.",
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "vulncheck-filter: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	res, err := Parse(os.Stdin)
	if err != nil {
		return err
	}

	vulns := res.Vulns
	vulns = slices.DeleteFunc(vulns, func(v *Vulnerability) bool {
		reason, ok := ignore[v.ID]
		if ok {
			fmt.Fprintf(os.Stderr, "ignoring %s: %s\n", v.ID, reason)
		}
		return ok
	})
	if len(vulns) == 0 {
		return nil
	}

	fmt.Fprintf(os.Stderr, "\n")
	for idx, vuln := range vulns {
		msg := "Vulnerability #%d: %v\n%v"
		fmt.Fprintf(os.Stderr, msg, idx+1, vuln.ID, vuln.Text+"\n")
	}
	return fmt.Errorf("%d unignored vulnerability(ies) found", len(vulns))
}
