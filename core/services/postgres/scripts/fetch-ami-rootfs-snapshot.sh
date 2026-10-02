#!/usr/bin/env bash
set -euo pipefail

usage() {
	cat <<-EOF >&2
		Usage: fetch-ami-rootfs-snapshot.sh [-r REGION] [-o OUTPUT_DIR] POSTGRES_VERSION

		Find the amd64 and arm64 Supabase Postgres AMIs tagged with POSTGRES_VERSION,
		then download the contents of each AMI's root EBS snapshot with coldsnap.

		Options:
		  -r REGION       AWS region (default: us-east-1)
		  -o OUTPUT_DIR   Download directory (default: .snapshots)
		  -h              Show this help

		Example:
		  fetch-ami-snapshot.sh -o snapshots 17.6.1.167
	EOF
}

err() {
	echo "$*" >&2
}

region=us-east-1
output_dir=.snapshots

while getopts ":r:o:h" option; do
	case $option in
	r) region=$OPTARG ;;
	o) output_dir=$OPTARG ;;
	h) usage && exit 0 ;;
	:) err "Error: -$OPTARG requires an argument" && usage && exit 2 ;;
	*) err "Error: unknown option -$OPTARG" && usage && exit 2 ;;
	esac
done
shift $((OPTIND - 1))

if (($# != 1)); then
	usage >&2
	exit 2
fi

for command in aws coldsnap; do
	if ! command -v "$command" >/dev/null 2>&1; then
		err "Error: required command not found: $command"
		exit 1
	fi
done

postgres_version=$1
mkdir -p "$output_dir"

download_arch() {
	local output_arch=$1
	local aws_arch=$2
	local image_ids_raw image_id root_device snapshot_id output_file
	local -a image_ids

	image_ids_raw=$(aws ec2 describe-images \
		--region "$region" \
		--owners self \
		--filters \
		"Name=architecture,Values=$aws_arch" \
		"Name=state,Values=available" \
		"Name=tag:appType,Values=postgres" \
		"Name=tag:postgresVersion,Values=$postgres_version" \
		--query 'Images[].ImageId' \
		--output text)
	read -r -a image_ids <<<"$image_ids_raw"

	if ((${#image_ids[@]} == 0)); then
		err "Error: no $output_arch AMI found for PostgreSQL $postgres_version in $region"
		return 1
	fi
	if ((${#image_ids[@]} != 1)); then
		err "Error: found ${#image_ids[@]} $output_arch AMIs for PostgreSQL $postgres_version in $region: ${image_ids[*]}"
		return 1
	fi

	image_id=${image_ids[0]}
	root_device=$(aws ec2 describe-images \
		--region "$region" \
		--image-ids "$image_id" \
		--query 'Images[0].RootDeviceName' \
		--output text)

	if [[ -z $root_device ]] || [[ $root_device == None ]]; then
		err "Error: AMI $image_id has no root device"
		return 1
	fi

	snapshot_id=$(aws ec2 describe-images \
		--region "$region" \
		--image-ids "$image_id" \
		--query "Images[0].BlockDeviceMappings[?DeviceName=='$root_device'].Ebs.SnapshotId | [0]" \
		--output text)

	if [[ -z $snapshot_id ]] || [[ $snapshot_id == None ]]; then
		err "Error: root device $root_device on AMI $image_id has no EBS snapshot"
		return 1
	fi

	output_file=$output_dir/postgres-${postgres_version}-${output_arch}.img
	err "$output_arch: $image_id, $snapshot_id, $output_file"
	coldsnap --region "$region" download "$snapshot_id" "$output_file"
}

download_arch amd64 x86_64
download_arch arm64 arm64
