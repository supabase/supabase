# The additional modules below have large dependencies and are therefore
# disabled by default. You can activate them by passing arguments to nix-shell,
# e.g.:
#
#    nix-shell --arg docker true
#
# We highly recommend that use the PostgREST binary cache by installing cachix
# (https://app.cachix.org/) and running `cachix use postgrest`.
{
  docker ? false,
  postgrest ? import ./default.nix { },
}:
let
  inherit (postgrest) pkgs;

  inherit (pkgs) lib;

  toolboxes = [
    postgrest.cabalTools
    postgrest.devTools
    postgrest.docs
    postgrest.gitTools
    postgrest.loadtest
    postgrest.nixpkgsTools
    postgrest.release
    postgrest.tests
    postgrest.withTools
  ]
  ++ lib.optional docker postgrest.docker;

in
lib.overrideDerivation postgrest.env (base: {
  buildInputs =
    base.buildInputs
    ++ [
      pkgs.cabal-install
      pkgs.postgresql
      postgrest.hsie.bin
      postgrest.treefmtNix.wrapper
    ]
    ++ toolboxes;

  shellHook = ''
    export HISTFILE=.history

    # Bypass proxy for all hosts, it prevents HTTP client failures used in test
    # suites. See: https://github.com/PostgREST/postgrest/issues/4633 for more info
    export NO_PROXY=*

    source ${pkgs.bash-completion}/etc/profile.d/bash_completion.sh
    source ${pkgs.git}/share/git/contrib/completion/git-completion.bash
    source ${postgrest.hsie.bash-completion}

        # Activate current shell's additional .git configuration.
        # Since there can only be a single such value, this will not cause a garbage
        # collection problem - older references to the /nix/store will be cleaned up
        # automatically when entering the nix-shell on a newer branch.
        # Git ignores files it can't find, which means that once a file has been garbage
        # collected, git will continue to work even without entering nix-shell.
        git config --local include.path ${postgrest.gitTools.config}
  ''
  + builtins.concatStringsSep "\n" (
    map (bash-completion: "source ${bash-completion}") (
      builtins.concatLists (map (toolbox: toolbox.bash-completion) toolboxes)
    )
  );
})
