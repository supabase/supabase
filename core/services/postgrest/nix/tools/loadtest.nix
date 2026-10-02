{
  buildToolbox,
  checkedShellScript,
  git,
  jq,
  libfaketime,
  python3,
  python3Packages,
  runCommand,
  vegeta,
  withTools,
  writers,
}:
let
  runner =
    checkedShellScript
      {
        name = "postgrest-loadtest-runner";
        docs = "Run vegeta. Assume PostgREST to be running.";
        args = [
          "ARG_LEFTOVERS([additional vegeta arguments])"
          "ARG_USE_ENV([PGRST_SERVER_UNIX_SOCKET], [], [Unix socket to connect to running PostgREST instance])"
        ];
      }
      ''
        echo "Starting vegeta loadtest..."

        # ARG_USE_ENV only adds defaults or docs for environment variables
        # We manually implement a required check here
        # See also: https://github.com/matejak/argbash/issues/80
        : "''${PGRST_SERVER_UNIX_SOCKET:?PGRST_SERVER_UNIX_SOCKET is required}"

        ${vegeta}/bin/vegeta -cpus 1 attack \
                                     -dns-ttl -1 \
                                     -unix-socket "$PGRST_SERVER_UNIX_SOCKET" \
                                     -max-workers 1 \
                                     -workers 1 \
                                     -rate 0 \
                                     -duration 60s \
                                     "''${_arg_leftovers[@]}"
      '';

  loadtest =
    checkedShellScript
      {
        name = "postgrest-loadtest";
        docs = "Run the vegeta loadtests with PostgREST.";
        args = [
          "ARG_OPTIONAL_SINGLE([output], [o], [Filename to dump json output to], [./loadtest/result.bin])"
          "ARG_OPTIONAL_SINGLE([kind], [k], [Kind of loadtest], [mixed])"
          "ARG_TYPE_GROUP_SET([KIND], [KIND], [kind], [mixed,jwt-cache,jwt-cache-worst])"
          "ARG_OPTIONAL_SINGLE([monitor], [m], [Monitoring file], [./loadtest/result.csv])"
          "ARG_LEFTOVERS([additional vegeta arguments])"
        ];
        workingDir = "/";
      }
      ''
        export PGRST_DB_ANON_ROLE="postgrest_test_anonymous"
        export PGRST_DB_CONFIG="false"
        export PGRST_DB_POOL="1"
        export PGRST_DB_SCHEMAS="test"
        export PGRST_DB_TX_END="rollback-allow-override"
        export PGRST_LOG_LEVEL="crit"
        export PGRST_JWT_SECRET="reallyreallyreallyreallyverysafe"

        mkdir -p "$(dirname "$_arg_output")"
        abs_output="$(realpath "$_arg_output")"

        case "$_arg_kind" in
          jwt-cache)
            export PGRST_JWT_SECRET="@${generatedTargets}/gen_jwks.json"

            # shellcheck disable=SC2145
            ${withTools.withPg} -f test/load/fixtures.sql \
            ${withTools.withPgrst} --faketime '2000-01-01 00:00:00' -m "$_arg_monitor" \
            sh -c "cd test/load && \
            ${runner} -targets ${generatedTargets}/gen_targets.http -output \"$abs_output\" \"''${_arg_leftovers[@]}\""
            ;;

          # here we sleep purposefully to check how much memory does the schema cache consume in the final report
          mixed)
            # shellcheck disable=SC2145
            ${withTools.withPg} -f test/load/fixtures.sql \
            ${withTools.withPgrst} --timeout 2 --sleep 5 -m "$_arg_monitor" \
            sh -c "cd test/load && \
            ${runner} -targets targets.http -output \"$abs_output\" \"''${_arg_leftovers[@]}\""
            ;;
        esac

        ${vegeta}/bin/vegeta report -type=text "$_arg_output"

        if [ "$_arg_kind" != "mixed" ]; then
          # fail in case 401 happened on jwt loadtests
          unauthorized_count="$(${vegeta}/bin/vegeta report -type=json "$_arg_output" \
            | ${jq}/bin/jq -r '.status_codes["401"] // 0')"

          if [ "$unauthorized_count" -gt 0 ]; then
            last_unauthorized_body="$(${vegeta}/bin/vegeta encode "$_arg_output" \
              | ${jq}/bin/jq -rn '
                  reduce inputs as $item (null;
                    if $item.code == 401 then $item else . end
                  )
                  | if . == null then
                      empty
                    else
                      (.body | @base64d)
                    end
                ')"

            echo "loadtest failed: found $unauthorized_count 401 Unauthorized responses" >&2
            if [ -n "$last_unauthorized_body" ]; then
              printf '%s\n' "Last 401 response body:" >&2
              printf '%s\n' "$last_unauthorized_body" >&2
            fi

            exit 1
          fi
        fi
      '';

  loadtestAgainst =
    let
      name = "postgrest-loadtest-against";
    in
    checkedShellScript
      {
        inherit name;
        docs = ''
          Run the vegeta loadtest against every target branch and HEAD:
          - once on the every <target-#> branch
          - once in the current worktree

          Note that the Nix tooling is always taken from the HEAD branch, while the PostgREST binary is taken from the target branch.
          For a discussion on why this is set up like this, see https://github.com/PostgREST/postgrest/pull/5013#discussion_r3431508441.
        '';
        args = [
          "ARG_POSITIONAL_INF([target], [Commit-ish reference to compare with], 1)"
          "ARG_OPTIONAL_SINGLE([kind], [k], [Kind of loadtest], [mixed])"
        ];
        positionalCompletion = ''
          if test "$prev" == "${name}"; then
            __gitcomp_nl "$(__git_refs)"
          fi
        '';
        workingDir = "/";
      }
      ''
        # Build postgrest for every target and HEAD.
        # Keeps a reference to the postgrest binary and faketime lib for every branch to run later.
        declare -A pgrst faketime
        for tgt in "''${_arg_target[@]}" HEAD; do
          # not using withTmpDir here, because we don't want to keep the directory on error
          tmpdir="$(mktemp -d)"
          trap 'rm -rf "$tmpdir"' EXIT

          ${git}/bin/git worktree add -f "$tmpdir" "$tgt" > /dev/null
          pushd "$tmpdir" > /dev/null

          build_start=$SECONDS
          echo -n "${name}: Building postgrest (nix) on $tgt... "
          # Using lib.getBin to also make this work with older checkouts, where .bin was not a thing, yet.
          nix-build --no-out-link -E 'with import ./. {}; pkgs.lib.getBin postgrestPackage' > build.log 2>&1 || {
            echo "failed, output:"
            cat build.log
            exit 1
          }
          pgrst[$tgt]="$(nix-build --no-out-link -E 'with import ./. {}; pkgs.lib.getBin postgrestPackage')/bin/postgrest"
          # To avoid glibc mismatches with back-branches, we need to take libfaketime from the target branch.
          faketime[$tgt]="$(nix-build --no-out-link -A pkgs.libfaketime)/lib/libfaketime.so.1"
          build_end=$((SECONDS - build_start))
          printf "done in %ss.\n" "$build_end"

          popd > /dev/null
          ${git}/bin/git worktree remove -f "$tmpdir" > /dev/null
          rm -rf "$tmpdir"
        done

        # Run loadtest for every target and HEAD.
        # Running the tests is separated from building them to reduce the chances of
        # other processes skewing the results between two runs.
        for tgt in "''${_arg_target[@]}" HEAD; do

        cat << EOF

        Running "$_arg_kind" loadtest on "$tgt"...

        EOF

        FAKETIME_LIB="''${faketime[$tgt]}" PGRST_CMD="''${pgrst[$tgt]}" ${loadtest} -k "$_arg_kind" -m "loadtest/$tgt.csv" --output "loadtest/$tgt.bin"

        cat << EOF

        Done running on "$tgt".

        EOF

        done
      '';

  reporter =
    checkedShellScript
      {
        name = "postgrest-loadtest-reporter";
        docs = "Create a named json report for a single result file.";
        args = [
          "ARG_POSITIONAL_SINGLE([file], [Filename of result to create report for])"
          "ARG_OPTIONAL_SINGLE([percentile], [p], [Percentile to report latency for], 50)"
          "ARG_LEFTOVERS([additional vegeta arguments])"
        ];
        workingDir = "/";
      }
      ''
        ${vegeta}/bin/vegeta encode "$_arg_file" \
          | ${jq}/bin/jq --arg percentile "$_arg_percentile" --slurp 'map(select(.url != "")) | group_by("\(.code) \(.method) \(.url)") | map({("\(.[0].code) \(.[0].method) \(.[0].url)" | sub("http://postgrest";"")): map(.latency) | sort | .[(length-1) * ($percentile | tonumber) / 100 | floor] / 10e3 }) | .[]' \
          | ${jq}/bin/jq --arg branch "$(basename "$_arg_file" .bin)" '. + {branch: $branch}'
      '';

  toMarkdown =
    writers.writePython3 "postgrest-loadtest-to-markdown"
      {
        libraries = [
          python3Packages.pandas
          python3Packages.tabulate
        ];
      }
      ''
        import sys
        import pandas as pd


        def evaluate_change(df):
            try:
                return ((df['HEAD'] / df['main'] - 1) * 100) \
                  .map(lambda r: "{icon} {ratio:.1f} %".format(
                    ratio=r,
                    # Hardcoded failure threshold for CI is 5% here.
                    icon="" if r < 5 else ":x:"
                  ))
            except KeyError:
                return None


        pd.read_json(sys.stdin) \
          .rename(columns={'latency': sys.argv[1]}) \
          .set_index(sys.argv[1]) \
          .drop(['branch']) \
          .convert_dtypes() \
          .assign(change=evaluate_change) \
          .to_markdown(
            sys.stdout,
            floatfmt='.1f',
            colglobalalign='right',
            colalign=('left',)
          )
      '';

  report =
    checkedShellScript
      {
        name = "postgrest-loadtest-report";
        docs = "Create a report of all loadtest reports as markdown.";
        args = [
          "ARG_OPTIONAL_SINGLE([group], [g], [Marker to group results])"
          "ARG_OPTIONAL_SINGLE([percentile], [p], [Percentile to report latency for], 50)"
        ];
        workingDir = "/";
      }
      ''
        echo -e "## Loadtest results $_arg_group (P$_arg_percentile)\n"

        find loadtest -type f -iname '*.bin' -exec ${reporter} -p "$_arg_percentile" {} \; \
          | ${jq}/bin/jq '[paths(scalars) as $path | {latency: $path | join("."), (.branch): getpath($path)}]' \
          | ${jq}/bin/jq --slurp 'flatten | group_by(.latency) | map(add)' \
          | ${toMarkdown} "P$_arg_percentile latency [μs]"
      '';

  report-load =
    checkedShellScript
      {
        name = "postgrest-loadtest-report-load";
        docs = "Create a report of all CPU/MEM usage as markdown.";
        args = [
          "ARG_OPTIONAL_SINGLE([group], [g], [Marker to group results])"
        ];
        workingDir = "/";
      }
      ''
        echo -e "\n\n## Loadtest elapsed seconds vs CPU/MEM usage $_arg_group\n"

        find loadtest -type f -iname '*.csv' \
          | sort -m \
          | ${mergeMonitorResults}
      '';

  generatedTargets =
    runCommand "postgrest-loadtest-targets"
      {
        nativeBuildInputs = [ (python3.withPackages (pyps: [ pyps.jwcrypto ])) ];
      }
      ''
        mkdir -p "$out"
        ${libfaketime}/bin/faketime '2000-01-01 00:00:00' python3 ${./generate_targets.py} "$out"
      '';

  mergeMonitorResults = writers.writePython3 "postgrest-merge-monitor-results" {
    libraries = [
      python3Packages.pandas
      python3Packages.tabulate
    ];
  } (builtins.readFile ./merge_monitor_result.py);
in
buildToolbox {
  name = "postgrest-loadtest";
  tools = {
    inherit
      loadtest
      loadtestAgainst
      report
      report-load
      ;
  };
}
