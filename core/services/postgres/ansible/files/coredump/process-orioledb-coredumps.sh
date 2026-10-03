#!/bin/bash
# Process PostgreSQL/OrioleDB core dumps captured by systemd-coredump into a
# text summary.
#
# Key ideas:
#  - Only cores of the postgres binary are processed; any other core left
#    untouched
#  - No environment variables are ever collected. The GDB extraction (see
#    cmds.gdb, matching OrioleDB's own CI debugging script) does run
#    `thread apply all bt full`, which prints local variable values and can
#    surface fragments of in-memory data (buffer/tuple pointers etc.) - this
#    is a deliberate, reviewed trade-off in favor of debuggability, not an
#    oversight.
#  - Cores are deleted after a successful run or quarantined (metadata only)
#    after MAX_ATTEMPTS failures.

set -euo pipefail

STATE_DIR=/var/lib/orioledb-coredumps/state
OUTPUT_DIR=/var/lib/orioledb-coredumps/diagnostics
QUARANTINE_DIR=/var/lib/orioledb-coredumps/quarantine

MAX_ATTEMPTS=3
EXTRACTION_TIMEOUT=120
MAX_AGE_DAYS=7
MAX_TOTAL_BYTES=$((300 * 1024 * 1024)) # independent of systemd-coredump's own MaxUse

GDB_DEBUG_DIR=/var/lib/postgresql/.nix-profile/lib/debug
GDB_CMDS_FILE=/usr/local/sbin/orioledb-coredump-cmds.gdb
PGDATA_CURRENT_LOGFILES=/var/lib/postgresql/data/current_logfiles

log() {
	echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
}

# Only ever run under orioledb-coredump.service, so this always executes with
# the unit's hardening (privs, sandboxing) rather than whatever an interactive
# shell happens to have.
if [[ -z ${INVOCATION_ID:-} ]]; then
	echo "This script must be run through orioledb-coredump.service" >&2
	exit 1
fi

# orioledb.so has no fixed, predictable path either - there is no
# /usr/lib/postgresql/lib mirror of it. It lives in the same nix store
# derivation as the resolved postgres executable, just under lib/ instead
# of bin/, e.g. .../postgresql-and-plugins-17_20/{bin/.postgres-wrapped,
# lib/orioledb.so} - so derive it from $exe rather than guessing a path.
orioledb_lib_path() {
	local exe_dir
	exe_dir=$(dirname "$(dirname "$1")")
	printf '%s/lib/orioledb.so' "$exe_dir"
}

# coredumpctl on this systemd version (255.4) has no "rm"/"delete" verb - the
# only reliable way to remove a core is to delete its on-disk Filename path
# directly. Returns success only if the path is actually gone afterward.
delete_core() {
	local path="$1"
	[ -z "$path" ] && return 1
	rm -f -- "$path"
	[ ! -e "$path" ]
}

# The active postgresql log file has an unpredictable name and can be
# csvlog, stderr-text, or both depending on config (this AMI defaults to
# csvlog-only, e.g. /var/log/postgresql/postgresql.csv - the stderr-format
# postgresql.log stops receiving anything the moment the logging collector
# switches over at startup). PGDATA/current_logfiles is postgres's own,
# always-current record of the real path(s); prefer csvlog, fall back to
# stderr. Either format still starts each line with a literal timestamp, so
# the grep -F substring match below works unchanged either way.
current_postgres_log() {
	[ -f "$PGDATA_CURRENT_LOGFILES" ] || return 0
	awk '$1 == "csvlog" {p = $2} $1 == "stderr" && !p {p = $2} END {print p}' "$PGDATA_CURRENT_LOGFILES"
}

enforce_retention() {
	find "$OUTPUT_DIR" -maxdepth 1 -type f -mtime "+${MAX_AGE_DAYS}" -delete 2>/dev/null || true

	while true; do
		total=$(du -sb "$OUTPUT_DIR" 2>/dev/null | cut -f1)
		[ -z "$total" ] && break
		[ "$total" -le "$MAX_TOTAL_BYTES" ] && break
		oldest=$(find "$OUTPUT_DIR" -maxdepth 1 -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | head -1 | cut -d' ' -f2-)
		[ -z "$oldest" ] && break
		log "retention: removing oldest bundle $oldest to stay under ${MAX_TOTAL_BYTES} bytes"
		rm -f "$oldest"
	done
}

# Handles one candidate crash, given its PID: decide whether it's ours to
# process, extract a diagnostic bundle via GDB, then delete the raw core.
# (1) look up the crash via coredumpctl
# (2) decide keep/ignore/quarantine based on prior attempts
# (3) export the core and run GDB against it
# (4) write the bundle and delete the raw core. Returns 1 only for failures
#     worth retrying next run (main() logs those); every other outcome is
#     ignored, quarantined, or successfully processed - returns 0.
process_one() {
	local pid="$1"

	# `coredumpctl --json=short info` silently IGNORES --json on this
	# systemd version (255.4) and falls back to the old plain-text format -
	# confirmed against a real build, not just docs. jq then fails to parse
	# it as JSON at all, so every field below would come out empty (wrong
	# boot_id, no storage path, core never gets deleted) with no visible
	# error anywhere except this script's own log. `coredumpctl --json=short
	# list` (used in main()) is unaffected - only the info verb's --json
	# support is broken on this version. Query the journal directly instead
	# - COREDUMP_* fields are systemd-coredump's own structured record of
	# the crash, independent of coredumpctl's info-rendering bug, and
	# journalctl's -o json has no version-specific gap like this. Only the
	# fields actually used below are requested - COREDUMP_ENVIRON in
	# particular is deliberately left out, matching "no environment
	# variables are ever collected" above.
	local journal_json
	journal_json=$(journalctl -o json \
		MESSAGE_ID=fc2e22bc6ee647b6b90729ab34a250b1 \
		"COREDUMP_PID=${pid}" \
		--output-fields=COREDUMP_EXE,COREDUMP_SIGNAL,COREDUMP_SIGNAL_NAME,COREDUMP_TIMESTAMP,COREDUMP_FILENAME,_BOOT_ID \
		2>/dev/null | tail -n 1)
	if [ -z "$journal_json" ]; then
		log "pid ${pid}: no matching journal entry for this coredump"
		return 1
	fi

	# join() (not @tsv) because @tsv double-escapes backslashes, which would
	# corrupt systemd-coredump filenames (e.g. "\x2e") and prevent core
	# deletion - none of these fields can contain a literal tab/newline.
	local exe boot_id signal signal_name timestamp_usec filename
	IFS=$'\t' read -r exe boot_id signal signal_name timestamp_usec filename < <(
		jq -r '[.COREDUMP_EXE, ._BOOT_ID, .COREDUMP_SIGNAL, .COREDUMP_SIGNAL_NAME, .COREDUMP_TIMESTAMP, (.COREDUMP_FILENAME // "")] | join("\t")' <<<"$journal_json"
	)
	# Unlike coredumpctl info's derived "Storage: present/missing" status,
	# COREDUMP_FILENAME is just the path recorded at capture time, with no
	# guarantee it's still on disk - delete_core already treats "already
	# gone" as success (rm -f + existence check), so no separate presence
	# check is needed here.
	local storage_path="$filename"
	# PID alone isn't a safe dedup key long-term (PIDs get reused across
	# boots), so pair it with boot ID - matches "state keyed by boot ID plus
	# dump identifier" from the original design.
	local key="${boot_id}-${pid}"
	local state_file="${STATE_DIR}/${key}"

	# .done means "final decision made, never look at this dump again"
	# (processed successfully or quarantined - non-postgres cores are never
	# enumerated in the first place, see main()'s list filter).
	# .attempts only counts *failed* tries, to cap retries before quarantine.
	[ -f "${state_file}.done" ] && return 0

	local attempts=0
	[ -f "${state_file}.attempts" ] && attempts=$(cat "${state_file}.attempts")
	if [ "$attempts" -ge "$MAX_ATTEMPTS" ]; then
		log "pid ${pid}: exceeded ${MAX_ATTEMPTS} attempts, discarding core (metadata kept in ${QUARANTINE_DIR})"
		jq . <<<"$journal_json" >"${QUARANTINE_DIR}/${key}.info"
		if delete_core "$storage_path"; then
			log "pid ${pid}: raw core deleted"
		else
			log "pid ${pid}: WARNING - could not delete raw core at '${storage_path}'"
		fi
		touch "${state_file}.done"
		return 0
	fi

	# From here on we're committed to actually processing this dump, so
	# count it as an attempt before doing any of the risky (slow, can fail)
	# work below - a crash/timeout past this point still gets retried, up
	# to MAX_ATTEMPTS
	echo $((attempts + 1)) >"${state_file}.attempts"

	# coredumpctl stores the core compressed; pull a private, working copy
	# out into a root-only scratch dir before handing it to GDB. The trap
	# guarantees that scratch dir is removed when this function returns, no
	# matter which of the several `return`s below fires. `trap ... RETURN`
	# is NOT scoped to this function - it fires on the next return from ANY
	# function (confirmed: without the self-clearing `trap - RETURN` here,
	# main()'s own `return "$rc"` re-fires this same trap, referencing a
	# $tmpdir that's gone out of scope, which is an unbound-variable crash
	# under `set -u` - so it must clear itself once it's run.
	local tmpdir
	tmpdir=$(mktemp -d /tmp/coredump-XXXXXX)
	chmod 700 "$tmpdir"
	trap 'rm -rf "$tmpdir"; trap - RETURN' RETURN

	if ! timeout "$EXTRACTION_TIMEOUT" coredumpctl dump "$pid" --output "${tmpdir}/core" >/dev/null 2>&1; then
		log "pid ${pid}: export failed or timed out"
		return 1
	fi

	# Everything from here to the closing "}" is the diagnostic bundle
	# itself, one section at a time, redirected straight to $bundle -
	# there's no in-memory buffering of it, so a slow/hanging step just
	# shows up as a truncated file rather than blocking the whole write.
	# Timestamp from coredumpctl JSON is microseconds since the epoch, so it
	# converts straight to a UTC date/time with no string parsing - and that
	# same "YYYY-MM-DD HH:MM:SS" form is what postgres's own log line prefix
	# starts with, so it doubles as the grep key below.
	local crash_timestamp
	crash_timestamp=$(date -u -d "@$((timestamp_usec / 1000000))" '+%Y-%m-%d %H:%M:%S')

	local bundle="${OUTPUT_DIR}/${key}.txt"
	{
		echo "== OrioleDB/PostgreSQL coredump diagnostic bundle =="
		echo "generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
		echo "pid: ${pid}"
		echo "boot_id: ${boot_id}"
		echo "signal: ${signal} (${signal_name})"
		echo "crash_timestamp: ${crash_timestamp} UTC"
		echo "executable: ${exe}"
		echo

		echo "== build ids =="
		echo "postgres (${exe}):"
		readelf -n "$exe" 2>/dev/null | grep 'Build ID' || echo "  (could not read build id)"
		orioledb_lib=$(orioledb_lib_path "$exe")
		if [ -f "$orioledb_lib" ]; then
			echo "orioledb.so (${orioledb_lib}):"
			readelf -n "$orioledb_lib" 2>/dev/null | grep 'Build ID' || echo "  (could not read build id)"
		fi
		echo

		echo "== gdb backtrace (full), lwlocks, locked pages, argv, shared libraries, registers =="
		timeout "$EXTRACTION_TIMEOUT" gdb --batch -quiet \
			-ex "set debug-file-directory ${GDB_DEBUG_DIR}" \
			-ex "file ${exe}" \
			-ex "core-file ${tmpdir}/core" \
			-x "$GDB_CMDS_FILE" \
			2>&1 || echo "(gdb extraction failed or timed out)"
		echo

		echo "== postgresql.log excerpt around crash =="
		postgres_log=$(current_postgres_log)
		if [ -n "$postgres_log" ] && [ -f "$postgres_log" ]; then
			grep -F "$crash_timestamp" -A 5 -B 20 "$postgres_log" 2>/dev/null | tail -200 ||
				echo "(no log lines found matching ${crash_timestamp} in ${postgres_log})"
		else
			echo "(no crash timestamp or log file available)"
		fi
	} >"$bundle"
	chmod 600 "$bundle"

	# Bundle is written either way at this point, even if the raw-core
	# delete below fails - we don't want a delete failure to make us
	# reprocess an already-complete bundle next run.
	touch "${state_file}.done"
	if delete_core "$storage_path"; then
		log "pid ${pid}: wrote ${bundle}, deleted raw core"
	else
		log "pid ${pid}: wrote ${bundle}, but WARNING - could not delete raw core at '${storage_path}'"
	fi
}

main() {
	mkdir -p "$STATE_DIR" "$OUTPUT_DIR" "$QUARANTINE_DIR"
	chmod 700 "$STATE_DIR" "$OUTPUT_DIR" "$QUARANTINE_DIR"

	enforce_retention

	# Enumerate via coredumpctl and filter out non-postgres cores
	local rc=0
	local pid
	while read -r pid; do
		[ -z "$pid" ] && continue
		process_one "$pid" || {
			log "pid ${pid}: processing failed, will retry on next run"
			rc=1
		}
	done < <(coredumpctl --no-pager --json=short list 2>/dev/null | jq -r '.[] | select(.corefile == "present" and (.exe | endswith("/.postgres-wrapped"))) | .pid')

	return "$rc"
}

main
