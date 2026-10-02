{
  buildToolbox,
  cabal-install,
  cachix,
  checkedShellScript,
  curl,
  devCabalOptions,
  entr,
  fd,
  gawk,
  graphviz,
  hsie,
  nix,
  stdenv,
  tests,
  treefmtNix,
  haskellPackages,
  ctags,
  openssl,
}:
let
  watch =
    checkedShellScript
      {
        name = "postgrest-watch";
        docs = ''
          Watch the project for changes and reinvoke the given command.

          Example:
            postgrest-watch postgrest-test-io
        '';
        args = [
          "ARG_POSITIONAL_SINGLE([command], [Command to run])"
          "ARG_LEFTOVERS([command arguments])"
        ];
        positionalCompletion = "_command";
        redirectTixFiles = false; # will be done by sub-command
        workingDir = "/";
      }
      ''
        while true; do
          (! ${fd}/bin/fd -H -E .git | ${entr}/bin/entr -dr "$_arg_command" "''${_arg_leftovers[@]}")
        done
      '';

  pushCachix =
    checkedShellScript
      {
        name = "postgrest-push-cachix";
        docs = ''
          Push all build artifacts to cachix.

          Requires authentication with `cachix authtoken ...`.
        '';
        args = [
          "ARG_OPTIONAL_SINGLE([system], , [System], [${stdenv.system}])"
        ];
        workingDir = "/";
      }
      ''
        ${nix}/bin/nix-instantiate --argstr system "$_arg_system" \
          | xargs ${nix}/bin/nix-store -qR --include-outputs \
          | ${cachix}/bin/cachix push postgrest
      '';

  check =
    checkedShellScript
      {
        name = "postgrest-check";
        docs = ''
          Run most checks that will also run on CI, but only against the
          latest PostgreSQL version.

          This currently excludes the memory and spec-idempotence tests,
          as those are particularly expensive.
        '';
        workingDir = "/";
      }
      ''
        ${treefmtNix.wrapper}/bin/treefmt
        ${hsie} check-aliases src/library src/executable
        ${tests}/bin/postgrest-test-spec
        ${tests}/bin/postgrest-test-observability
        ${tests}/bin/postgrest-test-doctests
        ${tests}/bin/postgrest-test-io
        ${tests}/bin/postgrest-test-big-schema
        ${tests}/bin/postgrest-test-replica
      '';

  dumpMinimalImports =
    checkedShellScript
      {
        name = "postgrest-dump-minimal-imports";
        docs = "Dump minimal imports into given directory.";
        args = [ "ARG_POSITIONAL_SINGLE([dumpdir], [Output directory])" ];
        workingDir = "/";
        withTmpDir = true;
      }
      ''
        mkdir -p "$_arg_dumpdir"
        ${cabal-install}/bin/cabal v2-build ${devCabalOptions} \
          --builddir="$tmpdir" \
          --ghc-option=-ddump-minimal-imports \
          --ghc-option=-dumpdir="$_arg_dumpdir" \
          1>&2

        # Fix OverloadedRecordFields imports
        # shellcheck disable=SC2016
        sed -E 's/\$sel:.*://g' -i "$_arg_dumpdir"/*
      '';

  hsieMinimalImports =
    checkedShellScript
      {
        name = "postgrest-hsie-minimal-imports";
        docs = "Run hsie with a provided dump of minimal imports.";
        args = [ "ARG_LEFTOVERS([hsie arguments])" ];
        withTmpDir = true;
      }
      ''
        ${dumpMinimalImports} "$tmpdir"
        ${hsie} "$tmpdir" "''${_arg_leftovers[@]}"
      '';

  hsieGraphModules =
    checkedShellScript
      {
        name = "postgrest-hsie-graph-modules";
        docs = "Create a PNG graph of modules imported within the codebase.";
        args = [ "ARG_OPTIONAL_SINGLE([outfile], [o], [Output filename], [postgrest-module-graph.png])" ];
      }
      ''
        ${hsie} graph-modules src/library src/executable | ${graphviz}/bin/dot -Tpng -o "$_arg_outfile"
      '';

  hsieGraphSymbols =
    checkedShellScript
      {
        name = "postgrest-hsie-graph-symbols";
        docs = "Create a PNG graph of symbols imported within the codebase.";
        args = [ "ARG_POSITIONAL_SINGLE([outfile], [Output filename])" ];
      }
      ''
        ${hsieMinimalImports} graph-symbols | ${graphviz}/bin/dot -Tpng -o "$_arg_outfile"
      '';

  timedCurl =
    checkedShellScript
      {
        name = "postgrest-time-curl";
        docs = "Report total and average elapsed time for repeated curl requests.";
        args = [
          "ARG_POSITIONAL_SINGLE([url], [URL to request], [http://localhost:3000/])"
          "ARG_OPTIONAL_SINGLE([runs], [n], [Number of requests], [10])"
        ];
      }
      ''
        for ((i = 0; i < "$_arg_runs"; i++)); do
          ${curl}/bin/curl -sS -o /dev/null -w '%{time_total}\n' "$_arg_url"
        done | ${gawk}/bin/awk '
          { total += $1; count++ }
          END {
            if (count) {
              print sprintf("Runs:    %d", count)
              print sprintf("Total:   %s s", total)
              print sprintf("Average: %s s", total / count)
            }
          }
        '
      '';

  parallelCurl =
    checkedShellScript
      {
        name = "postgrest-parallel-curl";
        docs = "wrapper for using <num> parallel curl requests on the same <host>";
        args = [
          "ARG_POSITIONAL_SINGLE([num], [number of parallel requests])"
          "ARG_POSITIONAL_SINGLE([host], [host])"
          "ARG_LEFTOVERS([extra arguments for curl])"
        ];
      }
      ''
        curl_command=("${curl}/bin/curl" --parallel --parallel-immediate)
        curl_command+=("''${_arg_leftovers[@]}")

        x=1
        while [ $x -le "$1" ]; do
          curl_command+=("$_arg_host")
          x=$((x + 1))
        done

        "''${curl_command[@]}"
      '';

  genCtags =
    checkedShellScript
      {
        name = "postgrest-gen-ctags";
        docs = "Generate ctags for Haskell and Python code";
        workingDir = "/";
      }
      ''
        ${haskellPackages.haskdogs}/bin/haskdogs
        ${ctags}/bin/ctags -a -R --fields=+l --languages=python --python-kinds=-iv -f ./tags test/io/
      '';

  genJwt =
    checkedShellScript
      {
        name = "postgrest-gen-jwt";
        docs = ''
          Generate a JWT. Example: postgrest-gen-jwt --exp 10 postgrest_test_author

          # This can be used to quickly prove a JWT expiry
          $ curl localhost:3000/authors_only -H "Authorization: Bearer \$(postgrest-gen-jwt --exp -31 postgrest_test_author)"
        '';
        args = [
          "ARG_POSITIONAL_SINGLE([role], [role for the jwt payload])"
          "ARG_OPTIONAL_SINGLE([secret],, [secret used to sign the JWT], [reallyreallyreallyreallyverysafe])"
          "ARG_OPTIONAL_SINGLE([exp],, [seconds for JWT expiry, it accepts negative values], [3600])"
          "ARG_OPTIONAL_SINGLE([iat],, [seconds since JWT issued, it accepts negative values], [0])"
        ];
      }
      ''
        # Based on https://stackoverflow.com/questions/59002949/how-to-create-a-json-web-token-jwt-using-openssl-shell-commands

        # Encode input using base64 as required by JWT
        base64url() {
          base64 \
            | tr -d '\n' \
            | tr '+/' '-_' \
            | tr -d '='
        }

        # Construct the header
        jwt_header=$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | base64url)

        # Construct the exp value
        expiry=$((EPOCHSECONDS + _arg_exp))

        # Construct the iat value
        issued_at=$((EPOCHSECONDS + _arg_iat))

        # Construct the payload
        payload_json=$(printf '{"role": "%s", "exp": %s, "iat": %s}' \
          "$_arg_role" "$expiry" "$issued_at")
        payload=$(printf '%s' "$payload_json" | base64url)

        # Convert secret to hex
        hexsecret=$(echo -n "$_arg_secret" | xxd -p | paste -sd "")

        # Calculate hmac signature -- note option to pass in the key as hex bytes
        hmac_signature=$(echo -n "$jwt_header.$payload" |  ${openssl}/bin/openssl dgst -sha256 -mac HMAC -macopt hexkey:"$hexsecret" -binary \
          | base64url)

        # Create the full token
        jwt="$jwt_header.$payload.$hmac_signature"

        echo -n "$jwt"
      '';

  genSecret =
    checkedShellScript
      {
        name = "postgrest-gen-secret";
        docs = "Generate a JWT secret";
      }
      ''
        export LC_CTYPE=C

        LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c32
      '';
in
buildToolbox {
  name = "postgrest-dev";
  tools = {
    inherit
      check
      timedCurl
      dumpMinimalImports
      hsieGraphModules
      hsieGraphSymbols
      hsieMinimalImports
      parallelCurl
      genCtags
      genJwt
      genSecret
      pushCachix
      watch
      ;
  };
}
