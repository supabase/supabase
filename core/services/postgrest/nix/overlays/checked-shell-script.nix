# Create a bash script that is checked with shellcheck. You can either use it
# directly, or use the .bin attribute to get the script in a bin/ directory,
# to be used in a path for example.
{
  argbash,
  bash,
  coreutils,
  git,
  lib,
  moreutils,
  runCommand,
  shellcheck,
  stdenv,
  writeTextFile,
}:
{
  name,
  docs,
  args ? [ ],
  positionalCompletion ? "",
  redirectTixFiles ? true,
  withEnv ? null,
  withPath ? [ ],
  withTmpDir ? false,
  workingDir ? null,
}:
text:
assert workingDir == null || lib.hasPrefix "/" workingDir;
let
  # square brackets are a pain to escape - if even possible. just don't use them...
  escape = builtins.replaceStrings [ "\n" ] [ " \\n" ];

  argsTemplate = writeTextFile {
    inherit name;
    destination = "/${name}.m4"; # destination is needed to have the proper basename for completion

    text = ''
      # BASH_ARGV0 sets $0 - which is used in parser.sh for usage information
      # stripping the /nix/store/... path for nicer display
      BASH_ARGV0="$(basename "$0")"

      # ARG_HELP([${name}], [${escape docs}])
      ${lib.strings.concatMapStrings (arg: "# " + arg) args}
      # ARG_POSITIONAL_DOUBLEDASH()
      # ARG_DEFAULTS_POS()
      # ARGBASH_GO

    '';
  };

  argsParser = runCommand "${name}-parser" { } ''
    ${argbash}/bin/argbash ${argsTemplate}/${name}.m4 > $out

    # This forces optional arguments to go *before* positional arguments,
    # which allows leftovers to pass optional arguments to sub-commands.
    # Example: This way `postgrest-watch -h` will return the help output for watch, while
    # `postgrest-watch postgrest-test-spec -h` will return the help output for test-spec.
    # Taken from: https://github.com/matejak/argbash/issues/114#issuecomment-557108274
    sed '/_positionals_count + 1/a\\t\t\t\tset -- "''${@:1:1}" "--" "''${@:2}"' $out | ${moreutils}/bin/sponge $out
  '';

  bash-completion = runCommand "${name}-completion" { } (
    ''
      ${argbash}/bin/argbash --type completion --strip all ${argsTemplate}/${name}.m4 > $out
    ''

    + lib.optionalString (positionalCompletion != "") ''
      sed 's#COMPREPLY.*compgen -o bashdefault .*$#${escape positionalCompletion}#' $out | ${moreutils}/bin/sponge $out
    ''
  );

  bin = writeTextFile {
    inherit name;
    executable = true;
    destination = "/bin/${name}";

    text = ''
      #!${bash}/bin/bash
      source ${argsParser}
      set -euo pipefail
    ''

    + lib.optionalString redirectTixFiles ''
      # storing tix files in a temporary throw away directory avoids mix/tix conflicts after changes
      hpctixdir=$(${coreutils}/bin/mktemp -d)
      export HPCTIXFILE="$hpctixdir"/postgrest.tix
      trap 'rm -rf $hpctixdir' EXIT
    ''

    + lib.optionalString (workingDir != null) ''
      cd "$(${git}/bin/git rev-parse --show-toplevel)"

      if test ! -f postgrest.cabal; then
        >&2 echo "Couldn't find postgrest.cabal. Please make sure to" \
                 "run this command somewhere in the PostgREST repo."
        exit 1
      fi

      cd "''${PWD}${workingDir}"
    ''

    + lib.optionalString withTmpDir ''
      tmpdir="$(${coreutils}/bin/mktemp -d --tmpdir=/tmp ${name}-XXX)"

      # we keep the tmpdir when an error occurs for debugging
      trap 'echo Temporary directory kept at: $tmpdir' ERR
      # remove the tmpdir when cancelled (postgrest-watch)
      trap 'rm -rf "$tmpdir"' SIGINT SIGTERM
    ''

    + lib.optionalString (withEnv != null) ''
      env="$(cat ${withEnv})"
      export PATH="$env/bin:$PATH"
    ''

    + lib.optionalString (lib.length withPath > 0) ''
      export PATH="${lib.concatMapStrings (p: p + "/bin:") withPath}$PATH"
    ''

    + "(${text})"

    + lib.optionalString withTmpDir ''

      rm -rf "$tmpdir"
    '';

    checkPhase = ''
      # check syntax
      ${stdenv.shell} -n $out/bin/${name}

      # check for shellcheck recommendations
      ${shellcheck}/bin/shellcheck -x $out/bin/${name}
    '';
  };

  script = runCommand name { inherit bin name; } "ln -s $bin/bin/$name $out";
in
script // { inherit bin bash-completion; }
