{
  runCommand,
  gh,
  git,
  coreutils,
  lib,
}:
runCommand "trigger-nix-build"
  {
    buildInputs = [
      gh
      git
      coreutils
    ];
  }
  ''
    mkdir -p $out/bin
    cat > $out/bin/trigger-nix-build << 'EOL'
    #!/usr/bin/env bash
    set -euo pipefail

    show_help() {
      cat << EOF
    Usage: trigger-nix-build [--help]

    Trigger the nix-build workflow for the current branch and watch its progress.

    This script will:
    1. Check if you're authenticated with GitHub
    2. Get the current branch and commit
    3. Verify you're on a standard branch (develop or release/*) or prompt for confirmation
    4. Trigger the nix-build workflow
    5. Watch the workflow progress until completion

    Options:
      --help    Show this help message and exit

    Requirements:
      - GitHub CLI (gh) installed and authenticated
      - Git installed
      - Must be run from a git repository

    Example:
      trigger-nix-build
    EOF
    }

    # Handle help flag
    if [[ "$#" -gt 0 && "$1" == "--help" ]]; then
      show_help
      exit 0
    fi

    export PATH="${
      lib.makeBinPath ([
        gh
        git
        coreutils
      ])
    }:$PATH"

    # Check for required tools
    for cmd in gh git; do
      if ! command -v $cmd &> /dev/null; then
        echo "Error: $cmd is required but not found"
        exit 1
      fi
    done

    # Check if user is authenticated with GitHub
    if ! gh auth status &>/dev/null; then
      echo "Error: Not authenticated with GitHub. Please run 'gh auth login' first."
      exit 1
    fi

    # Get current branch and commit
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    COMMIT=$(git rev-parse HEAD)

    # Check if we're on a standard branch
    if [[ "$BRANCH" != "develop" && ! "$BRANCH" =~ ^release/ ]]; then
      echo "Warning: Running workflow from non-standard branch: $BRANCH"
      echo "This is supported for testing purposes."
      read -p "Continue? [y/N] " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
      fi
    fi

    # Trigger the workflow
    echo "Triggering nix-build workflow for branch $BRANCH (commit: $COMMIT)"
    gh workflow run nix-build.yml --ref "$BRANCH"

    # Wait for workflow to start and get the run ID
    echo "Waiting for workflow to start..."
    sleep 5

    # Get the latest run ID for this workflow
    RUN_ID=$(gh run list --workflow=nix-build.yml --limit 1 --json databaseId --jq '.[0].databaseId')

    if [ -z "$RUN_ID" ]; then
      echo "Error: Could not find workflow run ID"
      exit 1
    fi

    echo "Watching workflow run $RUN_ID..."
    echo "The script will automatically exit when the workflow completes."
    echo "Press Ctrl+C to stop watching (workflow will continue running)"
    echo "----------------------------------------"

    # Try to watch the run, but handle network errors gracefully
    while true; do
      if gh run watch "$RUN_ID" --exit-status; then
        break
      else
        echo "Network error while watching workflow. Retrying in 5 seconds..."
        echo "You can also check the status manually with: gh run view $RUN_ID"
        sleep 5
      fi
    done
    EOL
    chmod +x $out/bin/trigger-nix-build
  ''
