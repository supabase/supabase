{
  runCommand,
  aws-vault,
  python3,
  python3Packages,
  coreutils,
}:
runCommand "run-testinfra"
  {
    buildInputs = [
      aws-vault
      python3
      python3Packages.pip
      coreutils
    ];
  }
  ''
    mkdir -p $out/bin
    cat > $out/bin/run-testinfra << 'EOL'
    #!/usr/bin/env bash
    set -euo pipefail

    show_help() {
      cat << EOF
    Usage: run-testinfra --ami-name NAME [--aws-vault-profile PROFILE]

    Run the testinfra tests locally against a specific AMI.

    This script will:
    1. Check if aws-vault is installed and configured
    2. Set up the required environment variables
    3. Create and activate a virtual environment
    4. Install required Python packages from pip
    5. Run the tests with aws-vault credentials
    6. Clean up the virtual environment

    Required flags:
      --ami-name NAME              The name of the AMI to test

    Optional flags:
      --aws-vault-profile PROFILE  AWS Vault profile to use (default: staging)
      --help                       Show this help message and exit

    Requirements:
      - aws-vault installed and configured
      - Python 3 with pip
      - Must be run from the repository root

    Examples:
      run-testinfra --ami-name supabase-postgres-abc123
      run-testinfra --ami-name supabase-postgres-abc123 --aws-vault-profile production
    EOF
    }

    # Default values
    AWS_VAULT_PROFILE="staging"
    AMI_NAME=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
      case $1 in
        --aws-vault-profile)
          AWS_VAULT_PROFILE="$2"
          shift 2
          ;;
        --ami-name)
          AMI_NAME="$2"
          shift 2
          ;;
        --help)
          show_help
          exit 0
          ;;
        *)
          echo "Error: Unexpected argument: $1"
          show_help
          exit 1
          ;;
      esac
    done

    # Check for required tools
    if ! command -v aws-vault &> /dev/null; then
      echo "Error: aws-vault is required but not found"
      exit 1
    fi

    # Check for AMI name argument
    if [ -z "$AMI_NAME" ]; then
      echo "Error: --ami-name is required"
      show_help
      exit 1
    fi

    # Set environment variables
    export AWS_REGION="ap-southeast-1"
    export AWS_DEFAULT_REGION="ap-southeast-1"
    export AMI_NAME="$AMI_NAME"  # Export AMI_NAME for pytest
    export RUN_ID="local-$(date +%s)"  # Generate a unique RUN_ID

    # Function to terminate EC2 instances
    terminate_instances() {
      echo "Terminating EC2 instances with tag testinfra-run-id=$RUN_ID..."
      aws-vault exec $AWS_VAULT_PROFILE -- aws ec2 --region ap-southeast-1 describe-instances \
        --filters "Name=tag:testinfra-run-id,Values=$RUN_ID" \
        --query "Reservations[].Instances[].InstanceId" \
        --output text | xargs -r aws-vault exec $AWS_VAULT_PROFILE -- aws ec2 terminate-instances \
        --region ap-southeast-1 --instance-ids || true
    }

    # Set up traps for various signals to ensure cleanup
    trap terminate_instances EXIT HUP INT QUIT TERM

    # Create and activate virtual environment
    VENV_DIR=$(mktemp -d)
    trap 'rm -rf "$VENV_DIR"' EXIT HUP INT QUIT TERM
    python3 -m venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"

    # Install required Python packages
    echo "Installing required Python packages..."
    pip install boto3 boto3-stubs[essential] docker ec2instanceconnectcli pytest paramiko requests

    # Function to run tests and ensure cleanup
    run_tests() {
      local exit_code=0
      echo "Running tests for AMI: $AMI_NAME using AWS Vault profile: $AWS_VAULT_PROFILE"
      aws-vault exec "$AWS_VAULT_PROFILE" -- pytest -vv -s testinfra/test_ami_nix.py || exit_code=$?
      return $exit_code
    }

    # Run tests and capture exit code
    run_tests
    test_exit_code=$?

    # Deactivate virtual environment
    deactivate

    # Explicitly call cleanup
    terminate_instances

    # Exit with the test exit code
    exit $test_exit_code
    EOL
    chmod +x $out/bin/run-testinfra
  ''
