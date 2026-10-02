{
  buildToolbox,
  cabal-install,
  checkedShellScript,
  devCabalOptions,
  postgrest,
}:
let
  build =
    checkedShellScript
      {
        name = "postgrest-build";
        docs = "Build PostgREST interactively using cabal-install.";
        args = [ "ARG_LEFTOVERS([Cabal arguments])" ];
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        exec ${cabal-install}/bin/cabal v2-build ${devCabalOptions} "''${_arg_leftovers[@]}"
      '';

  clean =
    checkedShellScript
      {
        name = "postgrest-clean";
        docs = "Clean the PostgREST project, including all cabal-install artifacts.";
        workingDir = "/";
      }
      ''
        # clean old coverage data, too
        rm -rf .hpc coverage
        # clean old hie files
        find . -name "*.hie" -type f -delete
        exec ${cabal-install}/bin/cabal v2-clean
      '';

  update =
    checkedShellScript
      {
        name = "postgrest-cabal-update";
        docs = "Update cabal's package list from hackage.haskell.org";
        workingDir = "/";
      }
      ''
        exec ${cabal-install}/bin/cabal v2-update
      '';

  run =
    checkedShellScript
      {
        name = "postgrest-run";
        docs = "Run PostgREST after building it interactively with cabal-install";
        args = [
          "ARG_USE_ENV([PGRST_DB_ANON_ROLE], [], [PostgREST anonymous role. (default: 'postgrest_test_anonymous')])"
          "ARG_USE_ENV([PGRST_DB_POOL], [1], [PostgREST pool size])"
          "ARG_USE_ENV([PGRST_DB_POOL_ACQUISITION_TIMEOUT], [1], [PostgREST pool timeout])"
          "ARG_USE_ENV([PGRST_JWT_SECRET], [reallyreallyreallyreallyverysafe], [PostgREST JWT secret])"
          "ARG_USE_ENV([PGRST_ADMIN_SERVER_PORT], [3001], [PostgREST admin server port])"
          "ARG_LEFTOVERS([PostgREST arguments])"
        ];
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        # when there's a default, argbash conflates empty string with unset, so we do this workaround to be able to do `PGRST_DB_ANON_ROLE="" <command>` for manual testing
        if [[ ! ''${PGRST_DB_ANON_ROLE+x} ]]; then
          PGRST_DB_ANON_ROLE="postgrest_test_anonymous"
        fi
        export PGRST_DB_ANON_ROLE
        export PGRST_DB_POOL
        export PGRST_DB_POOL_ACQUISITION_TIMEOUT
        export PGRST_JWT_SECRET
        export PGRST_ADMIN_SERVER_PORT

        exec ${cabal-install}/bin/cabal v2-run ${devCabalOptions} --verbose=0 -- \
          postgrest "''${_arg_leftovers[@]}"
      '';

  runProfiled =
    checkedShellScript
      {
        name = "postgrest-profiled-run";
        docs = "Run a profiled build of postgREST. This will generate a postgrest.prof file that can be used to do optimization.";
        args = [
          "ARG_USE_ENV([PGRST_DB_ANON_ROLE], [], [PostgREST anonymous role. (default: 'postgrest_test_anonymous')])"
          "ARG_USE_ENV([PGRST_DB_POOL], [1], [PostgREST pool size])"
          "ARG_USE_ENV([PGRST_DB_POOL_ACQUISITION_TIMEOUT], [1], [PostgREST pool timeout])"
          "ARG_USE_ENV([PGRST_JWT_SECRET], [reallyreallyreallyreallyverysafe], [PostgREST JWT secret])"
          "ARG_LEFTOVERS([PostgREST arguments])"
        ];
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        # when there's a default, argbash conflates empty string with unset, so we do this workaround to be able to do `PGRST_DB_ANON_ROLE="" <command>` for manual testing
        if [[ ! ''${PGRST_DB_ANON_ROLE+x} ]]; then
          PGRST_DB_ANON_ROLE="postgrest_test_anonymous"
        fi
        export PGRST_DB_ANON_ROLE
        export PGRST_DB_POOL
        export PGRST_DB_POOL_ACQUISITION_TIMEOUT
        export PGRST_JWT_SECRET

        exec ${cabal-install}/bin/cabal --builddir="dist-prof" v2-run --enable-profiling --disable-shared exe:postgrest -- \
          +RTS -p -h -RTS "''${_arg_leftovers[@]}"
      '';

  repl =
    checkedShellScript
      {
        name = "postgrest-repl";
        docs = "Interact with PostgREST modules using the cabal repl";
        args = [ "ARG_LEFTOVERS([cabal v2-repl arguments])" ];
        workingDir = "/";
        withEnv = postgrest.env;
      }
      ''
        exec ${cabal-install}/bin/cabal v2-repl "''${_arg_leftovers[@]}"
      '';
in
buildToolbox {
  name = "postgrest-cabal";
  tools = {
    inherit
      build
      clean
      update
      run
      runProfiled
      repl
      ;
  };
}
