{
  writeShellApplication,
  packer,
  awscli2,
  yq,
  jq,
  openssl,
  gitMinimal,
  coreutils,
  aws-vault,
  python3,
}:
writeShellApplication {
  name = "build-test-ami";
  runtimeInputs = [
    packer
    awscli2
    yq
    jq
    openssl
    gitMinimal
    coreutils
    aws-vault
    python3
  ];
  text = ''
    show_help() {
      cat << EOF
    Usage: build-test-ami [--help] <postgres-version>

    Build AMI images for PostgreSQL testing.

    This script will:
    1. Check for required tools and AWS authentication
    2. Build two AMI stages using Packer
    3. Clean up any temporary instances
    4. Output the final AMI name for use with run-testinfra

    Arguments:
      postgres-version    PostgreSQL major version to build (required)

    Options:
      --help    Show this help message and exit

    Requirements:
      - AWS Vault profile must be set in AWS_VAULT environment variable
      - Packer, AWS CLI, yq, jq, and OpenSSL must be installed
      - Must be run from a git repository

    Example:
      aws-vault exec <profile-name> -- nix run .#build-test-ami 15
    EOF
    }

    # Handle help flag
    if [[ "$#" -gt 0 && "$1" == "--help" ]]; then
      show_help
      exit 0
    fi

    # Check AWS Vault profile
    if [ -z "''${AWS_VAULT:-}" ]; then
      echo "Error: AWS_VAULT environment variable must be set with the profile name"
      echo "Usage: aws-vault exec <profile-name> -- nix run .#build-test-ami <postgres-version>"
      exit 1
    fi

    # Set values
    REGION="ap-southeast-1"
    POSTGRES_VERSION="$1"
    RANDOM_STRING=$(openssl rand -hex 8)
    GIT_SHA=$(git rev-parse HEAD)
    RUN_ID=$(date +%s)

    # Generate common-nix.vars.pkr.hcl
    PG_VERSION=$(yq -r ".postgres_release[\"postgres$POSTGRES_VERSION\"]" ansible/vars.yml)
    echo "postgres-version = \"$PG_VERSION\"" > common-nix.vars.pkr.hcl

    # Build AMI Stage 1
    packer init amazon-arm64-nix.pkr.hcl
    packer build \
      -var "git-head-version=$GIT_SHA" \
      -var "packer-execution-id=$RUN_ID" \
      -var-file="development-arm64.vars.pkr.hcl" \
      -var-file="common-nix.vars.pkr.hcl" \
      -var "ansible_arguments=" \
      -var "postgres-version=$RANDOM_STRING" \
      -var "region=$REGION" \
      -var 'ami_regions=["'"$REGION"'"]' \
      -var "force-deregister=true" \
      -var "ansible_arguments=-e postgresql_major=$POSTGRES_VERSION" \
      amazon-arm64-nix.pkr.hcl

    # Build AMI Stage 2
    packer init stage2-nix-psql.pkr.hcl
    packer build \
      -var "git-head-version=$GIT_SHA" \
      -var "packer-execution-id=$RUN_ID" \
      -var "postgres_major_version=$POSTGRES_VERSION" \
      -var-file="development-arm64.vars.pkr.hcl" \
      -var-file="common-nix.vars.pkr.hcl" \
      -var "postgres-version=$RANDOM_STRING" \
      -var "region=$REGION" \
      -var 'ami_regions=["'"$REGION"'"]' \
      -var "git_sha=$GIT_SHA" \
      stage2-nix-psql.pkr.hcl

    # Cleanup instances from AMI builds
    cleanup_instances() {
      echo "Terminating EC2 instances with tag testinfra-run-id=$RUN_ID..."
      aws ec2 --region $REGION describe-instances \
        --filters "Name=tag:testinfra-run-id,Values=$RUN_ID" \
        --query "Reservations[].Instances[].InstanceId" \
        --output text | xargs -r aws ec2 terminate-instances \
        --region $REGION --instance-ids || true
    }

    # Set up traps for various signals to ensure cleanup
    trap cleanup_instances EXIT HUP INT QUIT TERM

    # Create and activate virtual environment
    VENV_DIR=$(mktemp -d)
    trap 'rm -rf "$VENV_DIR"' EXIT HUP INT QUIT TERM
    python3 -m venv "$VENV_DIR"
    # shellcheck source=/dev/null
    source "$VENV_DIR/bin/activate"

    # Install required Python packages
    echo "Installing required Python packages..."
    pip install boto3 'boto3-stubs[essential]' docker ec2instanceconnectcli pytest paramiko requests

    # Run the tests with aws-vault
    echo "Running tests for AMI: $RANDOM_STRING using AWS Vault profile: $AWS_VAULT_PROFILE"
    aws-vault exec "$AWS_VAULT_PROFILE" -- pytest -vv -s testinfra/test_ami_nix.py

    # Deactivate virtual environment (cleanup is handled by trap)
    deactivate
  '';
}
