{
  buildToolbox,
  checkedShellScript,
  commitlint,
  lib,
  moreutils,
  treefmtNix,
  writeShellApplication,
  writeText,
}:
let
  # Rules format: [<severity>, <"always"/"never">, <value>]
  commitlintConfig = writeText "commitlint.config.mjs" ''
    export default {
      rules: {
        "type-enum": [2, "always", [
            'add',      // Add a new feature
            'amend',    // To amend an unrealease commit
            'change',   // Breaking changes
            'chore',    // Update sponsors, changelog, readme etc
            'ci',       // CI configuration files and scripts
            'docs',     // Documentation
            'fix',      // Bug fix
            'nix',      // Related to Nix
            'perf',     // Performance improvements
            'refactor', // Refactoring code
            'remove',   // Remove a feature or fix
            'test',     // Adding tests
          ]],

          'subject-case':       [2, 'never', ['pascal-case', 'start-case']],
          'subject-empty':      [2, 'never'],
          'subject-full-stop':  [2, 'never', '.'],
          'subject-max-length': [2, 'always', 80],
          'subject-min-length': [2, 'always', 5],

          'scope-case':         [2, 'always', 'lower-case'],

          'body-leading-blank': [2, 'always'],
      },
    };
  '';

  commitCheck =
    checkedShellScript
      {
        name = "postgrest-commitlint";
        docs = "Script to validate commit messages";
        workingDir = "/";
        args = [
          "ARG_OPTIONAL_SINGLE([from],, [commit ref start from], [main])"
          "ARG_OPTIONAL_SINGLE([to],, [commit ref end at], [HEAD])"
        ];
      }
      ''
        # Run commitlint with the given configuration

        ${commitlint}/bin/commitlint --config ${commitlintConfig} --from "$_arg_from" --to "$_arg_to"
      '';

  mergeDriver = writeShellApplication {
    name = "treefmt-merge-driver";
    runtimeInputs = [
      moreutils
      treefmtNix.wrapper
    ];
    text = ''
      # The first argument (%P) is the path to the original file, which is used
      # by treefmt to decide which formatters to run based on the extension.
      filename="$1"
      shift 1

      >&2 echo "Running treefmt-merge-driver for '$filename'..."

      function format() {
        cat "$1" | treefmt --stdin "$filename" | sponge "$1"
      }

      # The next three arguments %A, %O and %B are temporary files which contain
      # the three states of this file: current version, ancestor's version and
      # other branch's version.
      format "$1"
      format "$2"
      format "$3"

      git merge-file "$@"
    '';
  };

  # This addition to the git configuration is appended to .git/config in shell.nix, i.e.
  # when entering the nix-shell environment.
  # It sets up our wrapper script as the default merge-driver, which allows commands such
  # as `git rebase` to rebase transparently through formatter induced changes without
  # conflicts.
  config = writeText "git-config" ''
    [merge]
      default = treefmt
    [merge.treefmt]
      # The first argument is consumed by the merge driver script, the remaining
      # arguments are passed through as-is to `git merge-file`.
      driver = ${lib.getExe mergeDriver} %P %A %O %B -L %X -L %S -L %Y
  '';
in
buildToolbox {
  name = "postgrest-commitlint";
  tools = { inherit commitCheck; };
  extra = { inherit config; };
}
