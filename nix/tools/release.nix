{
  buildToolbox,
  checkedShellScript,
}:
let
  release =
    checkedShellScript
      {
        name = "postgrest-release";
        docs = "Patch postgrest.cabal, CHANGELOG.md, commit and push all in one go.";
        args = [
          "ARG_OPTIONAL_BOOLEAN([skip-confirmation],,[skip confirmation when run in CI])"
        ];
        workingDir = "/";
      }
      ''
        current_branch="$(git rev-parse --abbrev-ref HEAD)"
        trap "echo You need to be on the main branch or a release branch to proceed. Exiting ..." ERR
        [[ "$current_branch" =~ ^main$|^v[0-9]+$ ]]
        trap "" ERR

        trap "echo You have uncommitted changes in postgrest.cabal. Exiting ..." ERR
        git diff --exit-code HEAD postgrest.cabal > /dev/null
        trap "" ERR

        bump () {
          current_version="$(grep -oP '^version:\s*\K.*' postgrest.cabal)"
          # shellcheck disable=SC2034
          IFS=. read -r A B C D <<< "$current_version"
          echo "Current version is $current_version"

          case "$1" in
            A)
              new_version="$((A+1)).0"
              new_docs_version="$((A+1))"
              ;;
            B)
              new_version="$A.$((B+1))"
              new_docs_version="$A"
              ;;
            devel)
              new_version="$((A+1))"
              new_docs_version="devel"
              ;;
          esac

          echo "Updating postgrest.cabal ..."
          sed -i -E "s/^(version:\s+).*$/\1$new_version/" postgrest.cabal > /dev/null
          echo "Updating docs/conf.py ..."
          sed -i -E "s/^(version = ).*$/\1\"$new_docs_version\"/" docs/conf.py > /dev/null

          echo "Updating Haskell source file links ..."
          sed -i -E "s#(github\.com/PostgREST/postgrest/blob)/main/#\1/$new_version/#g" docs/explanations/architecture.rst

          git add postgrest.cabal docs/conf.py docs/explanations/architecture.rst > /dev/null
        }

        today_date_for_changelog="$(date '+%Y-%m-%d')"
        if [[ "$current_branch" == "main" ]]; then
          bump A
        else
          bump B
        fi

        echo "Updating CHANGELOG.md ..."
        sed -i -E "s/Unreleased/&\n\n## [$new_version] - $today_date_for_changelog/" CHANGELOG.md > /dev/null
        git add CHANGELOG.md > /dev/null

        echo "Committing ..."
        git commit -m "chore: bump version to $new_version" > /dev/null

        if [[ "$current_branch" == "main" ]]; then
          bump devel

          # The order of operations is important here:
          # - bump devel is run and $A is updated to the new version
          # - the branch is created with the new A, but the commit before the devel bump
          # - the devel bump is committed
          git branch "v$A"

          echo "Committing (devel bump)..."
          git commit -m "chore: bump version to $new_version" > /dev/null
        fi

        trap "echo Remote not found. Please push manually ..." ERR
        remote="$(git remote -v | grep 'PostgREST/postgrest' | grep push | cut -f1)"
        trap "" ERR

        if [[ "$current_branch" == "main" ]]; then
          push1="git push $remote $current_branch"
          push2="git push $remote v$A"
        else
          push1="git push $remote $current_branch"
          push2=""
        fi

        if [[ "$_arg_skip_confirmation" == "on" ]]; then
          $push1
          $push2
        else
          echo "To push the version bump(s), the following will be run:"
          echo
          echo "$push1"
          echo "$push2"
          echo

          read -r -p 'Proceed? (y/N) ' REPLY
          case "$REPLY" in
            y|Y)
              $push1
              $push2
              ;;
            *)
              echo "Aborting ..."
              ;;
          esac
        fi
      '';

in
buildToolbox {
  name = "postgrest-release";
  tools = { inherit release; };
}
