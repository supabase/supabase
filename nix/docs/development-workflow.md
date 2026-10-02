# PostgreSQL Development Workflow

This document outlines the workflow for developing and testing PostgreSQL in an ec2 instance using the tools provided in this repo.

## Prerequisites

- Nix installed and configured
- AWS credentials configured with aws-vault (you must set up aws-vault beforehand)
- GitHub access to the repository

## Workflow Steps

### 1. Trigger Remote Build and Cache

To build, test, and cache your changes in the Supabase Nix binary cache:

```bash
# From your branch
nix run .#trigger-nix-build
```

This will:

- Trigger a GitHub Actions workflow
- Build PostgreSQL and extensions
- Run nix flake check tests (evaluation of nix code, pg_regress and migrations tests)
- Cache the results in the Supabase Nix binary cache
- Watch the workflow progress until completion

The workflow will run on the branch you're currently on.

If you're on a feature different branch, you'll be prompted to confirm before proceeding.

### 2. Build AMI

After the build is complete and cached, build the AMI:

```bash
# Build AMI for PostgreSQL 15
aws-vault exec <profile-name> -- nix run .#build-test-ami 15

# Or for PostgreSQL 17
aws-vault exec <profile-name> -- nix run .#build-test-ami 17

# Or for PostgreSQL orioledb-17
aws-vault exec  <profile-name> -- nix run .#build-test-ami orioledb-17
```

This will:

- Build two AMI stages using Packer
- Clean up temporary instances after AMI builds
- Output the final AMI name (e.g., `supabase-postgres-abc123`)

**Important**: Take note of the AMI name output at the end, as you'll need it for the next step.

### 3. Run Testinfra

Run the testinfra tests against the AMI:

```bash
# Run tests against the AMI
nix run .#run-testinfra -- --aws-vault-profile <profile-name> --ami-name supabase-postgres-abc123
```

This will:

- Create a Python virtual environment
- Install required Python packages
- Create an EC2 instance from the AMI
- Run the test suite
- Automatically terminate the EC2 instance when done

The script handles:

- Setting up AWS credentials via aws-vault
- Creating and managing the Python virtual environment
- Running the tests
- Cleaning up EC2 instances
- Proper error handling and cleanup on interruption

### 4. Optional: Cleanup AMI

If you want to clean up the AMI after testing:

```bash
# Clean up the AMI
aws-vault exec <profile-name> -- nix run .#cleanup-ami supabase-postgres-abc123
```

This will:

- Deregister the AMI
- Clean up any associated resources

## Troubleshooting

### Common Issues

1. **AWS Credentials**
   - Ensure aws-vault is properly configured
   - Use the `--aws-vault-profile` argument to specify your AWS profile
   - Default profile is "staging" if not specified

2. **EC2 Instance Not Terminating**
   - The script includes multiple safeguards for cleanup
   - If instances aren't terminated, check AWS console and terminate manually

3. **Test Failures**
   - Check the test output for specific failures
   - Ensure you're using the correct AMI name
   - Verify AWS region and permissions

### Environment Variables

The following environment variables are used:

- `AWS_VAULT`: AWS Vault profile name (default: staging)
- `AWS_REGION`: AWS region (default: ap-southeast-1)
- `AMI_NAME`: Name of the AMI to test

## Best Practices

1. **Branch Management**

    - Use feature branches for development
    - Merge to develop for testing
    - Use release branches for version-specific changes

2. **Resource Cleanup**

    - Always run the cleanup step after testing
    - Monitor AWS console for any lingering resources
    - Use the cleanup-ami command when done with an AMI

3. **Testing**
    - Run tests locally before pushing changes
    - Verify AMI builds before running testinfra
    - Check test output for any warnings or errors

## Additional Commands

```bash
# Show available commands
nix run .#show-commands

# Update README with latest command information
nix run .#update-readme
```
