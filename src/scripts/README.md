# Operational scripts

## Profiling

Configure the client once:

```sh
export ADMIN_URL='http://127.0.0.1:5001'
export ADMIN_API_KEY='replace-me'
export PROFILE_DIR="$PWD/profiles"
mkdir -p "$PROFILE_DIR"
```

Schedule a 30-second CPU profile in Watt:

```sh
npm run pprof -- capture profile
```

Schedule CPU profiling for a custom duration:

```sh
npm run pprof -- capture profile \
  --seconds 45
```

Manual CPU and sampled-heap captures are asynchronous and Watt-only. The runtime extension
captures and uploads the profile for the serving worker. For CPU, it suspends any automatic
profiling window and restores it afterward; heap profiling uses Watt's separate heap profiler
without stopping automatic CPU profiling. Use `list` and `download` after the requested duration;
the trigger does not hold an HTTP connection open.

Schedule a 30-second sampled heap profile:

```sh
npm run pprof -- capture heap
```

Capture a full V8 heap snapshot:

```sh
npm run pprof -- capture heap-snapshot \
  --output "$PROFILE_DIR/heap.heapsnapshot"
```

Full heap snapshots remain synchronous, are streamed directly, and are not stored in the
profiling bucket.

List today's uploaded manual CPU profiles after a trigger (UTC):

```sh
npm run pprof -- list \
  --class manual \
  --kind cpu \
  --limit 20
```

List today's automatically captured CPU profiles (UTC):

```sh
npm run pprof -- list \
  --class auto \
  --kind cpu \
  --limit 20
```

List manual sampled-heap profiles:

```sh
npm run pprof -- list \
  --class manual \
  --kind heap \
  --limit 20
```

List profiles captured yesterday or two days ago (UTC):

```sh
npm run pprof -- list --class auto --days-ago 1
npm run pprof -- list --class auto --days-ago 2
```

List profiles from an exact UTC date:

```sh
npm run pprof -- list \
  --class auto \
  --date 2026-07-12
```

List every retained profile in global newest-first order:

```sh
npm run pprof -- list \
  --class auto \
  --all-dates
```

Fetch every page for the selected date scope:

```sh
npm run pprof -- list \
  --class auto \
  --date 2026-07-12 \
  --all-pages
```

`--all-pages` follows each returned cursor until the selected date scope is exhausted. It does not
change the date scope, so combine it with `--all-dates` only when you intend to list every retained
profile.

Fetch one next page manually using the `cursor` returned by the previous command:

```sh
export PROFILE_CURSOR='paste-cursor-here'

npm run pprof -- list \
  --class auto \
  --kind cpu \
  --limit 20 \
  --cursor "$PROFILE_CURSOR"
```

Repeat the same `--date`, `--days-ago`, or `--all-dates` selector when using a cursor. Without one
of these options, `list` defaults to the current UTC date.

Download the profiles from one list page into a directory:

```sh
npm run pprof -- list \
  --class auto \
  --date 2026-07-12 \
  --download "$PROFILE_DIR"
```

Download every profile in the selected date scope:

```sh
npm run pprof -- list \
  --class auto \
  --date 2026-07-12 \
  --all-pages \
  --download "$PROFILE_DIR"
```

`--download` does not change pagination. Without `--all-pages`, it downloads only the profiles in
the returned page. Bulk filenames contain the unique capture id so separate profiles cannot
overwrite each other.

Download the selected profiles and generate Flame artifacts:

```sh
npm run pprof -- list \
  --class auto \
  --date 2026-07-12 \
  --download "$PROFILE_DIR" \
  --flame
```

Archived profiles are downloaded only through `list --download`; there is no separate stored-profile
download command. Narrow the list filters and limit when you need a single profile.

The reverse timestamp and capture identity are the first key component after class, so S3 returns profiles in global newest-first order across kinds and dates. The remaining key contains kind, reason, hostname, process/build provenance, and Watt application/worker ids. Date bounds and other filters are applied while scanning S3; no database or secondary object index is required. Stored-profile list output exposes the same provenance fields. Use a separate profiling bucket for each deployment environment.

## Offline pprof analysis

Run these commands from a checkout of the same build that produced the profile. `-trim_path=/app -source_path="$PWD"` maps deployed `/app/src/...` or `/app/dist/...` paths to the matching local source files.

Show the largest flat CPU consumers:

```sh
export PROFILE="$PROFILE_DIR/cpu.pprof.gz"

go tool pprof \
  -trim_path=/app \
  -source_path="$PWD" \
  -top \
  "$PROFILE"
```

Show the largest cumulative CPU call paths:

```sh
export PROFILE="$PROFILE_DIR/cpu.pprof.gz"

go tool pprof \
  -trim_path=/app \
  -source_path="$PWD" \
  -cum \
  -top \
  "$PROFILE"
```

Open Go's interactive web UI, then select **View > Flame Graph**:

```sh
export PROFILE="$PROFILE_DIR/cpu.pprof.gz"

go tool pprof \
  -trim_path=/app \
  -source_path="$PWD" \
  -http=127.0.0.1:8080 \
  "$PROFILE"
```

Show annotated local source for matching functions:

```sh
export PROFILE="$PROFILE_DIR/cpu.pprof.gz"

go tool pprof \
  -trim_path=/app \
  -source_path="$PWD" \
  -list='getObjectInfo|findObject' \
  "$PROFILE"
```

Analyze retained heap bytes:

```sh
export PROFILE="$PROFILE_DIR/heap.pprof.gz"

go tool pprof \
  -trim_path=/app \
  -source_path="$PWD" \
  -sample_index=inuse_space \
  -top \
  "$PROFILE"
```

Compare a current profile against a baseline:

```sh
export BASELINE="$PROFILE_DIR/cpu-baseline.pprof.gz"
export PROFILE="$PROFILE_DIR/cpu-current.pprof.gz"

go tool pprof \
  -trim_path=/app \
  -source_path="$PWD" \
  -diff_base="$BASELINE" \
  -top \
  "$PROFILE"
```

`go tool pprof` does not read V8 `.heapsnapshot` files. Open those in Chrome DevTools under **Memory > Load**.
