package report

import (
	"fmt"
	"io"
	"sort"
	"strings"
	"time"
)

func PrintTable(w io.Writer, imageName string, tl *Timeline) {
	fmt.Fprintln(w, strings.Repeat("=", 80))
	fmt.Fprintln(w, "PostgreSQL Container Startup Profile")
	fmt.Fprintln(w, strings.Repeat("=", 80))
	fmt.Fprintln(w)
	fmt.Fprintf(w, "Image:    %s\n", imageName)
	fmt.Fprintf(w, "Total:    %s\n", formatDuration(tl.TotalDuration))
	fmt.Fprintln(w)

	// Phases
	fmt.Fprintln(w, "PHASES")
	fmt.Fprintln(w, strings.Repeat("-", 80))
	fmt.Fprintf(w, "  %-30s %-12s %-8s\n", "Phase", "Duration", "Pct")
	fmt.Fprintln(w, "  "+strings.Repeat("-", 50))
	for _, p := range tl.Phases {
		fmt.Fprintf(w, "  %-30s %-12s %5.1f%%\n", p.Name, formatDuration(p.Duration), p.Percent)
	}
	fmt.Fprintln(w)

	// Init scripts (top 5)
	if len(tl.InitScripts) > 0 {
		fmt.Fprintln(w, "INIT SCRIPTS (top 5 by duration)")
		fmt.Fprintln(w, strings.Repeat("-", 80))

		// Sort by duration
		sorted := make([]ScriptTiming, len(tl.InitScripts))
		copy(sorted, tl.InitScripts)
		sort.Slice(sorted, func(i, j int) bool {
			return sorted[i].Duration > sorted[j].Duration
		})

		limit := 5
		if len(sorted) < limit {
			limit = len(sorted)
		}

		fmt.Fprintf(w, "  %-50s %s\n", "Script", "Duration")
		fmt.Fprintln(w, "  "+strings.Repeat("-", 60))
		for _, s := range sorted[:limit] {
			// Truncate path for display
			path := s.Path
			if len(path) > 48 {
				path = "..." + path[len(path)-45:]
			}
			fmt.Fprintf(w, "  %-50s %s\n", path, formatDuration(s.Duration))
		}
		fmt.Fprintln(w)
	}

	// Extensions
	if len(tl.Extensions) > 0 {
		fmt.Fprintln(w, "EXTENSIONS")
		fmt.Fprintln(w, strings.Repeat("-", 80))
		fmt.Fprintf(w, "  %-20s %s\n", "Extension", "Loaded at")
		fmt.Fprintln(w, "  "+strings.Repeat("-", 30))
		for _, e := range tl.Extensions {
			fmt.Fprintf(w, "  %-20s %s\n", e.Name, formatDuration(e.LoadTime))
		}
		fmt.Fprintln(w)
	}

	// Background workers
	if len(tl.BGWorkers) > 0 {
		fmt.Fprintln(w, "BACKGROUND WORKERS")
		fmt.Fprintln(w, strings.Repeat("-", 80))
		fmt.Fprintf(w, "  %-20s %s\n", "Worker", "Started at")
		fmt.Fprintln(w, "  "+strings.Repeat("-", 30))
		for _, bw := range tl.BGWorkers {
			fmt.Fprintf(w, "  %-20s %s\n", bw.Name, formatDuration(bw.StartedAt))
		}
		fmt.Fprintln(w)
	}
}

func PrintTableVerbose(w io.Writer, imageName string, tl *Timeline) {
	PrintTable(w, imageName, tl)

	// Event timeline (verbose)
	if len(tl.Events) > 0 {
		fmt.Fprintln(w, "EVENT TIMELINE")
		fmt.Fprintln(w, strings.Repeat("-", 80))
		for _, e := range tl.Events {
			fmt.Fprintf(w, "  [%s] %-8s %s\n",
				formatDuration(e.Duration),
				e.Type,
				truncate(e.Name, 60))
		}
	}
}

func formatDuration(d time.Duration) string {
	if d < time.Millisecond {
		return fmt.Sprintf("%.3fms", float64(d.Microseconds())/1000)
	}
	if d < time.Second {
		return fmt.Sprintf("%.0fms", float64(d.Milliseconds()))
	}
	return fmt.Sprintf("%.3fs", d.Seconds())
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
