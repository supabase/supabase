{
  buildToolbox,
  cabal-install,
  checkedShellScript,
  curl,
  devCabalOptions,
  ghc,
  glibcLocales ? null,
  gnugrep,
  hpc-codecov,
  jq,
  lib,
  nginx,
  postgrest,
  python3,
  runtimeShell,
  stdenv,
  weeder,
  withTools,
}:
let
  testSpec =
    checkedShellScript
      {
        name = "postgrest-test-spec";
        docs = "Run the Haskell test suite. Use --match PATTERN for running individual specs";
        args = [ "ARG_LEFTOVERS([hspec arguments])" ];
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        ${withTools.withPg} -f test/spec/fixtures/load.sql \
          ${cabal-install}/bin/cabal v2-run ${devCabalOptions} test:spec -- "''${_arg_leftovers[@]}"
      '';

  testObservability =
    checkedShellScript
      {
        name = "postgrest-test-observability";
        docs = "Run the Haskell observability test suite.";
        args = [ "ARG_LEFTOVERS([hspec arguments])" ];
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        ${withTools.withPg} -f test/observability/fixtures/load.sql \
          ${cabal-install}/bin/cabal v2-run ${devCabalOptions} test:observability -- "''${_arg_leftovers[@]}"
      '';

  testDoctests =
    checkedShellScript
      {
        name = "postgrest-test-doctests";
        docs = "Run the Haskell doctest test suite";
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        ${cabal-install}/bin/cabal v2-run ${devCabalOptions} test:doctests
      '';

  testSpecIdempotence =
    checkedShellScript
      {
        name = "postgrest-test-spec-idempotence";
        docs = "Check that the Haskell tests can be run multiple times against the same db.";
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        ${withTools.withPg} -f test/spec/fixtures/load.sql \
          ${runtimeShell} -c " \
            ${cabal-install}/bin/cabal v2-run ${devCabalOptions} test:spec && \
            ${cabal-install}/bin/cabal v2-run ${devCabalOptions} test:spec"
      '';

  ioTestPython = python3.withPackages (ps: [
    ps.pyjwt
    ps.pytest
    ps.pytest-xdist
    ps.pyyaml
    ps.requests
    ps.requests-unixsocket
    ps.syrupy
  ]);

  testIO =
    checkedShellScript
      {
        name = "postgrest-test-io";
        docs = "Run the pytest-based IO tests. Add -k to run tests that match a given expression.";
        args = [ "ARG_LEFTOVERS([pytest arguments])" ];
        workingDir = "/";
        withEnv = postgrest.env;
        withPath = [ nginx ];
      }
      ''
        ${cabal-install}/bin/cabal v2-build ${devCabalOptions} exe:postgrest
        ${cabal-install}/bin/cabal v2-exec -- ${withTools.withPg} -f test/io/fixtures/load.sql \
          ${ioTestPython}/bin/pytest --ignore=test/io/test_big_schema.py --ignore=test/io/test_replica.py -v test/io "''${_arg_leftovers[@]}"
      '';

  testBigSchema =
    checkedShellScript
      {
        name = "postgrest-test-big-schema";
        docs = "Run a pytest-based IO test on a big schema. Add -k to run tests that match a given expression.";
        args = [ "ARG_LEFTOVERS([pytest arguments])" ];
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        ${cabal-install}/bin/cabal v2-build ${devCabalOptions} exe:postgrest
        ${cabal-install}/bin/cabal v2-exec -- ${withTools.withPg} -f test/io/fixtures/big_schema.sql \
          ${ioTestPython}/bin/pytest -v test/io/test_big_schema.py "''${_arg_leftovers[@]}"
      '';

  testReplica =
    checkedShellScript
      {
        name = "postgrest-test-replica";
        docs = "Run a pytest-based IO test on a replica. Add -k to run tests that match a given expression.";
        args = [ "ARG_LEFTOVERS([pytest arguments])" ];
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        ${cabal-install}/bin/cabal v2-build ${devCabalOptions} exe:postgrest
        ${cabal-install}/bin/cabal v2-exec -- ${withTools.withPg} --replica -f test/io/fixtures/replica.sql \
          ${ioTestPython}/bin/pytest -v test/io/test_replica.py "''${_arg_leftovers[@]}"
      '';

  dumpSchema =
    checkedShellScript
      {
        name = "postgrest-dump-schema";
        docs = "Dump the loaded schema's SchemaCache in JSON format.";
        workingDir = "/";
        withEnv = postgrest.env;
        withPath = [ jq ];
      }
      ''
        ${withTools.withPg} -f test/spec/fixtures/load.sql \
            ${cabal-install}/bin/cabal v2-run ${devCabalOptions} --verbose=0 -- \
            postgrest --dump-schema
      '';

  coverage =
    checkedShellScript
      {
        name = "postgrest-coverage";
        docs = "Run spec and io tests while collecting hpc coverage data. First runs weeder to detect dead code.";
        args = [ "ARG_LEFTOVERS([hpc report arguments])" ];
        workingDir = "/";
        redirectTixFiles = false;
        withEnv = postgrest.env;
        withTmpDir = true;
        withPath = [ nginx ];
      }
      (
        # required for `hpc markup` in CI; glibcLocales is not available e.g. on Darwin
        lib.optionalString (stdenv.isLinux && stdenv.hostPlatform.libc == "glibc") ''
          export LOCALE_ARCHIVE="${glibcLocales}/lib/locale/locale-archive"
        ''
        +

          ''
            # clean up previous coverage reports
            mkdir -p coverage
            rm -rf coverage/*

            # build once before running all the tests
            ${cabal-install}/bin/cabal v2-build ${devCabalOptions} exe:postgrest lib:postgrest test:spec test:observability

            (
              trap 'echo Found dead code: Check file list above.' ERR ;
              ${weeder}/bin/weeder --config=./test/weeder.toml
            )

            # collect all tests
            HPCTIXFILE="$tmpdir"/io.tix \
              ${withTools.withPg} -f test/io/fixtures/load.sql \
              ${cabal-install}/bin/cabal v2-exec ${devCabalOptions} -- ${ioTestPython}/bin/pytest --ignore=test/io/test_big_schema.py --ignore=test/io/test_replica.py -v test/io

            HPCTIXFILE="$tmpdir"/big_schema.tix \
              ${withTools.withPg} -f test/io/fixtures/big_schema.sql \
              ${cabal-install}/bin/cabal v2-exec ${devCabalOptions} -- ${ioTestPython}/bin/pytest -v test/io/test_big_schema.py

            HPCTIXFILE="$tmpdir"/replica.tix \
              ${withTools.withPg} --replica -f test/io/fixtures/replica.sql \
              ${cabal-install}/bin/cabal v2-exec ${devCabalOptions} -- ${ioTestPython}/bin/pytest -v test/io/test_replica.py

            HPCTIXFILE="$tmpdir"/spec.tix \
              ${withTools.withPg} -f test/spec/fixtures/load.sql \
              ${cabal-install}/bin/cabal v2-run ${devCabalOptions} test:spec

            HPCTIXFILE="$tmpdir"/observability.tix \
              ${withTools.withPg} -f test/observability/fixtures/load.sql \
              ${cabal-install}/bin/cabal v2-run ${devCabalOptions} test:observability

            # Note: No coverage for doctests, as doctests leverage GHCi and GHCi does not support hpc

            # collect all the tix files
            ${ghc}/bin/hpc sum  --union --exclude=Paths_postgrest --output="$tmpdir"/tests.tix \
              "$tmpdir"/io*.tix "$tmpdir"/big_schema*.tix "$tmpdir"/replica*.tix "$tmpdir"/spec.tix \
              "$tmpdir"/observability.tix

            # prepare the overlay
            ${ghc}/bin/hpc overlay --output="$tmpdir"/overlay.tix test/coverage.overlay
            ${ghc}/bin/hpc sum --union --output="$tmpdir"/tests-overlay.tix "$tmpdir"/tests.tix "$tmpdir"/overlay.tix

            # check nothing in the overlay is actually tested
            ${ghc}/bin/hpc map --function=inv --output="$tmpdir"/inverted.tix "$tmpdir"/tests.tix
            ${ghc}/bin/hpc combine --function=sub \
              --output="$tmpdir"/check.tix "$tmpdir"/overlay.tix "$tmpdir"/inverted.tix
            # returns zero exit code if any count="<non-zero>" lines are found, i.e.
            # something is covered by both the overlay and the tests
            if ${ghc}/bin/hpc report --xml "$tmpdir"/check.tix | ${gnugrep}/bin/grep -qP 'count="[^0]'
            then
              ${ghc}/bin/hpc markup --highlight-covered --destdir=coverage/overlay "$tmpdir"/overlay.tix || true
              ${ghc}/bin/hpc markup --highlight-covered --destdir=coverage/check "$tmpdir"/check.tix || true
              echo "ERROR: Something is covered by both the tests and the overlay:"
              echo "postgrest-coverage: To see the results, visit file://$(pwd)/coverage/check/hpc_index.html"
              exit 1
            else
              # copy the result .tix file to the coverage/ dir to make it available to postgrest-coverage-draft-overlay, too
              cp "$tmpdir"/tests-overlay.tix coverage/postgrest.tix
              # prepare codecov json report
              ${hpc-codecov}/bin/hpc-codecov --mix=.hpc --out=coverage/codecov.json coverage/postgrest.tix

              # create html and stdout reports
              ${ghc}/bin/hpc markup --destdir=coverage coverage/postgrest.tix
              echo "postgrest-coverage: To see the results, visit file://$(pwd)/coverage/hpc_index.html"
              ${ghc}/bin/hpc report coverage/postgrest.tix "''${_arg_leftovers[@]}"
            fi
          ''
      );

  coverageDraftOverlay =
    checkedShellScript
      {
        name = "postgrest-coverage-draft-overlay";
        docs = "Create a draft overlay from current coverage report.";
        workingDir = "/";
      }
      ''
        ${ghc}/bin/hpc draft --output=test/coverage.overlay coverage/postgrest.tix
        sed -i 's|^module \(.*\):|module \1/|g' test/coverage.overlay
      '';

  testMemory =
    checkedShellScript
      {
        name = "postgrest-test-memory";
        docs = "Run the memory tests.";
        workingDir = "/";
        withEnv = postgrest.env;
        withPath = [ curl ];
      }
      ''
        ${cabal-install}/bin/cabal --builddir="dist-prof" v2-build --enable-profiling --disable-shared exe:postgrest
        ${cabal-install}/bin/cabal --builddir="dist-prof" v2-exec -- ${withTools.withPg} -f test/spec/fixtures/load.sql \
          test/memory/memory-tests.sh
      '';

in
buildToolbox {
  name = "postgrest-tests";
  tools = {
    inherit
      testSpec
      testObservability
      testDoctests
      testSpecIdempotence
      testIO
      testBigSchema
      testReplica
      dumpSchema
      coverage
      coverageDraftOverlay
      testMemory
      ;
  };
}
