#!/bin/bash
# Baseline Validation Check
#
# This script validates that the machine matches the committed baseline
# specifications using supascan (pre-installed via nix profile for ubuntu user).
#
# Usage: supascan_ami.sh [baselines-dir]

set -euo pipefail

BASELINES_DIR="${1:-/tmp/ansible-playbook/audit-specs/baselines/ami-build}"

echo "============================================================"
echo "Baseline Validation"
echo "============================================================"
echo ""
echo "Baselines directory: $BASELINES_DIR"
echo ""

# Check baselines directory exists
if [[ ! -d $BASELINES_DIR ]]; then
	echo "ERROR: Baselines directory not found: $BASELINES_DIR"
	exit 1
fi

# Add ubuntu user's nix profile to PATH
export PATH="/home/ubuntu/.nix-profile/bin:$PATH"

# Verify supascan is available
if ! command -v supascan &>/dev/null; then
	echo "ERROR: supascan not found in PATH"
	echo "PATH: $PATH"
	exit 1
fi

# Run supascan validate (it calls sudo goss internally for privileged checks)
exec supascan validate --verbose "$BASELINES_DIR"
