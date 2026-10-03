{
  lib,
  stdenv,
  awscli2,
  jq,
  packer,
  writeShellApplication,
  ...
}:

let
  root = ../..;
  packerSources = stdenv.mkDerivation {
    name = "packer-sources";
    src = lib.fileset.toSource {
      inherit root;
      fileset = lib.fileset.unions [
        (root + "/ebssurrogate")
        (root + "/ansible")
        (root + "/migrations")
        (root + "/amazon-amd64-nix.pkr.hcl")
        (root + "/amazon-arm64-nix.pkr.hcl")
        (root + "/development-amd64.vars.pkr.hcl")
        (root + "/development-arm64.vars.pkr.hcl")
        (lib.fileset.maybeMissing (root + "/common-nix.vars.pkr.hcl"))
      ];
    };

    phases = [
      "unpackPhase"
      "installPhase"
    ];
    installPhase = ''
      mkdir -p $out
      cp -r . $out/
    '';
  };
in
writeShellApplication {
  name = "build-ami";

  runtimeInputs = [
    awscli2
    jq
    packer
  ];

  text = ''
    set -x

    # Parse required parameters
    STAGE=''${1:-stage1}
    case $STAGE in
    stage1 | stage2) ;;
    *) echo "Error: Invalid stage '$STAGE'. Must be 'stage1' or 'stage2'" >&2 && exit 1 ;;
    esac

    ARCH=$2
    case $ARCH in
    amd64 | arm64) ;;
    *) echo "Error: Invalid arch '$ARCH'. Must be 'amd64' or 'arm64'" >&2 && exit 1 ;;
    esac

    INPUT_HASH=${placeholder "out"}
    INPUT_HASH=''${INPUT_HASH#/nix/store/}
    INPUT_HASH=''${INPUT_HASH%%-*}
    shift 2

    export PACKER_LOG=''${PACKER_LOG:-''${RUNNER_DEBUG:-0}}
    on_error=ask
    if ''${CI:-false}; then
      echo "::notice::Setting packer build -on-error=abort since this is CI, this is different than non-CI runs!"
      on_error=abort
    elif ! [[ -t 0 ]]; then
      echo "stdin is not a tty, so running packer build -on-error=cleanup (default) since there's no one to ask!" >&2
      on_error=cleanup
    fi

    REGION="''${AWS_REGION:-ap-southeast-1}"

    find_stage1_ami() {
      set +e
      local arch
      case $ARCH in
      amd64) arch=x86_64 ;;
      arm64) arch=arm64 ;;
      esac
      local filters=(
        "Name=architecture,Values=$arch"
        "Name=state,Values=available"
        "Name=tag:inputHash,Values=$INPUT_HASH"
        "Name=tag:postgresVersion,Values=$POSTGRES_VERSION-stage1"
        "Name=tag:sourceSha,Values=$GIT_SHA" # This is set by packer via the git-head-version var which is always passed in by the build-ami action
      )

      local ami_output
      ami_output=$(aws ec2 describe-images \
        --region "$REGION" \
        --owners self \
        --filters "''${filters[@]}" \
        --query 'Images[0].ImageId' \
        --output text 2>&1)
      local exit_code=$?
      set -e

      if [ $exit_code -ne 0 ] && [ $exit_code -ne 255 ]; then
        echo "Error querying AWS: $ami_output"
        exit 1
      fi

      if [ "$ami_output" = "None" ] || [ -z "$ami_output" ]; then
        echo ""
      else
        echo "$ami_output"
      fi
    }

    if [ "$STAGE" = "stage1" ]; then
      echo "Building stage 1..."
      echo "Checking for existing AMI..."

      if [ -n "''${BUILD_AMI_NIX_FORCE_BUILD_STAGE1:-}" ]; then
        if [ "''${BUILD_AMI_NIX_FORCE_BUILD_STAGE1:-}" == true ]; then
          echo 'BUILD_AMI_NIX_FORCE_BUILD_STAGE1 == true ... skip search for stage1 AMI' >&2
          find_stage1_ami() {
            return
          }
        else
          echo 'BUILD_AMI_NIX_FORCE_BUILD_STAGE1 != true ... will search for stage1 AMI' >&2
        fi
      fi

      AMI_ID=$(find_stage1_ami)
      if [ -n "$AMI_ID" ]; then
        echo "Found existing AMI: $AMI_ID"
        echo "STAGE1_AMI_ID=$AMI_ID"

        if [ -n "''${GITHUB_OUTPUT:-}" ]; then
          AMI_NAME=$(aws ec2 describe-images \
            --region "$REGION" \
            --image-ids "$AMI_ID" \
            --query 'Images[0].Name' \
            --output text)

          if [ -n "$AMI_NAME" ]; then
            echo "::notice title=Stage 1 AMI Found::AMI '$AMI_NAME' (ID: $AMI_ID) found in region $REGION"
          fi
        fi

        exit 0
      fi

      echo "No cached AMI found"

      cd ${packerSources}
      packer init "$@"
      packer build -on-error=$on_error \
        -var-file="development-$ARCH.vars.pkr.hcl" \
        -var "input-hash=$INPUT_HASH" \
        -var "postgres-version=$POSTGRES_VERSION" \
        -var "region=$REGION" \
        "$@"

      if [ -n "''${GITHUB_OUTPUT:-}" ]; then
        STAGE1_AMI_ID=$(find_stage1_ami)
        if [ -n "$STAGE1_AMI_ID" ]; then
          AMI_NAME=$(aws ec2 describe-images \
            --region "$REGION" \
            --image-ids "$STAGE1_AMI_ID" \
            --query 'Images[0].Name' \
            --output text)

          if [ -n "$AMI_NAME" ]; then
            echo "::notice title=Stage 1 AMI Built::AMI '$AMI_NAME' (ID: $STAGE1_AMI_ID) built in region $REGION"
          fi
        fi
      fi
    elif [ "$STAGE" = "stage2" ]; then
      echo "Building stage 2..."

      STAGE1_AMI_ID=$(find_stage1_ami)
      if [ -z "$STAGE1_AMI_ID" ]; then
        echo "Error: Stage 1 AMI not found. Please build stage 1 first."
        exit 1
      fi

      echo "Found stage 1 AMI: $STAGE1_AMI_ID"

      packer init stage2-nix-psql.pkr.hcl
      packer build -on-error=$on_error \
        -var-file="development-$ARCH.vars.pkr.hcl" \
        -var-file="common-nix.vars.pkr.hcl" \
        -var "region=$REGION" \
        -var "source_ami=$STAGE1_AMI_ID" \
        "$@"

      disk_usage_notice=$(grep '^::notice::disk_usage ' /tmp/ansible-stage2.log | tail -n 1 || true)
      disk_usage_notice_pattern='^::notice::disk_usage bytes=([0-9]+) human=([0-9]+(\.[0-9]+)?[MGT]?)$'
      if [[ $disk_usage_notice =~ $disk_usage_notice_pattern ]]; then
        disk_usage_bytes=''${BASH_REMATCH[1]}
        disk_usage_human=''${BASH_REMATCH[2]}
      else
        echo "Error: Missing or invalid disk usage notice in stage 2 log: '$disk_usage_notice'" >&2
        exit 1
      fi
      echo "::notice::AMI Disk Usage $disk_usage_human $disk_usage_bytes"
      if [[ -n ''${GITHUB_OUTPUT:-} ]]; then
        disk_usage_json=$(jq -cnr --arg bytes "$disk_usage_bytes" --arg human "$disk_usage_human" '{$bytes,$human}')
        echo "disk_usage_json=$disk_usage_json" >>"$GITHUB_OUTPUT"
      fi

      if [ -n "''${PACKER_EXECUTION_ID:-}" ]; then
        STAGE2_AMI_ID=$(aws ec2 describe-images \
          --region "$REGION" \
          --owners self \
          --filters \
            "Name=tag:packerExecutionId,Values=''${PACKER_EXECUTION_ID}" \
            "Name=state,Values=available" \
          --query 'Images[0].ImageId' \
          --output text)

        if [ -n "$STAGE2_AMI_ID" ] && [ "$STAGE2_AMI_ID" != "None" ]; then
          echo "STAGE2_AMI_ID=$STAGE2_AMI_ID"

          if [ -n "''${GITHUB_OUTPUT:-}" ]; then
            echo "stage2_ami_id=$STAGE2_AMI_ID" >> "$GITHUB_OUTPUT"

            AMI_NAME=$(aws ec2 describe-images \
              --region "$REGION" \
              --image-ids "$STAGE2_AMI_ID" \
              --query 'Images[0].Name' \
              --output text)

            if [ -n "$AMI_NAME" ]; then
              echo "::notice title=Stage 2 AMI Published::AMI '$AMI_NAME' (ID: $STAGE2_AMI_ID) published in region $REGION"
            fi
          fi
        fi
      fi
    fi
  '';

  meta = {
    description = "Build AMI if not cached based on input hash";
    longDescription = ''
      The input hash is computed from all source files that affect the build.
      Before building, we verify the existence of an AMI with the same hash.
      If found, the build is skipped. Otherwise, a new AMI is created and
      tagged with the input hash for future cache hits.
    '';
  };
}
