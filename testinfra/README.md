# Testinfra Integration Tests

## Prerequisites

- Docker
- Packer
- yq
- Python deps:

```sh
pip3 install boto3 boto3-stubs[essential] docker ec2instanceconnectcli pytest pytest-testinfra[paramiko,docker] requests
```

## Running locally

```sh
set -euo pipefail
# cwd: repo root

# build AMI
AWS_PROFILE=supabase-dev packer build \
  -var-file=development-arm64.vars.pkr.hcl \
  -var-file=common.vars.pkr.hcl \
  -var "ansible_arguments=" \
  -var "postgres-version=ci-ami-test" \
  -var "region=ap-southeast-1" \
  -var 'ami_regions=["ap-southeast-1"]' \
  amazon-arm64.pkr.hcl

# run tests
AWS_PROFILE=supabase-dev pytest -vv -s testinfra/test_*.py
```
