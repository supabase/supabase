{
  coreutils,
  gawk,
  gnugrep,
  writeShellApplication,
}:
writeShellApplication {
  name = "verify-darwin-linux-builder";
  runtimeInputs = [
    coreutils
    gawk
    gnugrep
  ];
  text = ''
    set -euo pipefail

    PASS=0
    FAIL=0

    check_pass() {
      echo "  [PASS] $1"
      PASS=$((PASS + 1))
    }

    check_fail() {
      echo "  [FAIL] $1"
      echo "         $2"
      FAIL=$((FAIL + 1))
    }

    echo "Verifying darwin-linux-builder configuration..."
    echo ""

    echo "1. Checking launchd service status..."
    if sudo launchctl list org.nixos.linux-builder &>/dev/null; then
      SERVICE_OUTPUT=$(sudo launchctl list org.nixos.linux-builder 2>/dev/null || true)
      PID=$(echo "$SERVICE_OUTPUT" | grep -E "^\s*\"PID\"" | grep -oE '[0-9]+' || echo "-")
      if [[ "$PID" != "-" && -n "$PID" ]]; then
        check_pass "linux-builder service is running (PID: $PID)"
      else
        check_fail "linux-builder service is loaded but not running" \
          "Run: start-linux-builder"
      fi
    else
      check_fail "linux-builder service not found" \
        "Run: nix run .#setup-darwin-linux-builder"
    fi

    echo ""
    echo "2. Checking nix configuration..."
    NIX_CONFIG=$(nix config show 2>/dev/null || true)
    if [[ -n "$NIX_CONFIG" ]]; then
      if echo "$NIX_CONFIG" | grep -q "nix-postgres-artifacts.s3.amazonaws.com"; then
        check_pass "Substituter configured for nix-postgres-artifacts"
      else
        check_fail "Missing substituter for nix-postgres-artifacts" \
          "Expected: nix-postgres-artifacts.s3.amazonaws.com in substituters"
      fi

      if echo "$NIX_CONFIG" | grep -q "nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI="; then
        check_pass "Trusted public key configured"
      else
        check_fail "Missing trusted public key" \
          "Expected signing key for nix-postgres-artifacts in trusted-public-keys"
      fi

      if echo "$NIX_CONFIG" | grep -qE "experimental-features.*nix-command" && \
         echo "$NIX_CONFIG" | grep -qE "experimental-features.*flakes"; then
        check_pass "Experimental features enabled (nix-command, flakes)"
      else
        check_fail "Missing experimental features" \
          "Expected: nix-command and flakes in experimental-features"
      fi
    else
      check_fail "Could not read nix configuration" \
        "Run: nix config show"
    fi

    echo ""
    echo "3. Checking builder features..."
    MACHINES_FILE="/etc/nix/machines"
    if [[ -f "$MACHINES_FILE" ]]; then
      # machines file format: uri systems key maxjobs speedfactor features mandatory-features public-key
      # Features are in field 6 (1-indexed), comma-separated
      FEATURES=$(awk '{print $6}' "$MACHINES_FILE" | tr ',' ' ' || true)
      if grep -q "nixos-test" "$MACHINES_FILE"; then
        check_pass "nixos-test feature supported"
        echo "         Available features: $FEATURES"
      else
        check_fail "nixos-test feature not configured" \
          "Expected: nixos-test in $MACHINES_FILE"
      fi
    else
      check_fail "machines file not found" \
        "Expected: $MACHINES_FILE"
    fi

    echo ""
    echo "4. Testing builder responsiveness..."
    echo "   Building nixpkgs#hello for aarch64-linux (timeout: 60s)..."
    if timeout 60 nix build --system aarch64-linux nixpkgs#hello --no-link --print-out-paths 2>/dev/null; then
      check_pass "Builder is responsive and can build aarch64-linux packages"
    else
      EXIT_CODE=$?
      if [[ $EXIT_CODE -eq 124 ]]; then
        check_fail "Builder timed out after 60 seconds" \
          "The builder may be unresponsive or overloaded. Try: stop-linux-builder && start-linux-builder"
      else
        check_fail "Builder failed to build test package" \
          "Check builder logs: sudo launchctl list org.nixos.linux-builder"
      fi
    fi

    echo ""
    echo "========================================"
    echo "Verification complete: $PASS passed, $FAIL failed"
    echo "========================================"

    if [[ $FAIL -gt 0 ]]; then
      echo ""
      echo "Some checks failed. Review the failures above for guidance."
      exit 1
    else
      echo ""
      echo "All checks passed! The darwin-linux-builder is ready for use."
      exit 0
    fi
  '';
}
