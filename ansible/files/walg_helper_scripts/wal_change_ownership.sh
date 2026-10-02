#! /usr/bin/env bash

set -euo pipefail

filename=$1

if [[ -z $filename ]]; then
	echo "Nothing supplied. Exiting."
	exit 1
fi

full_path=/tmp/wal_fetch_dir/$filename

num_paths=$(readlink -f "$full_path" | wc -l)

# Checks if supplied filename string contains multiple paths
# For example, "correct/path /var/lib/injected/path /var/lib/etc"
if [[ $num_paths -gt 1 ]]; then
	echo "Multiple paths supplied. Exiting."
	exit 1
fi

base_dir=$(readlink -f "$full_path" | cut -d'/' -f2)

# Checks if directory/ file to be manipulated
# is indeed within the /tmp directory
# For example, "/tmp/../var/lib/postgresql/..."
# will return "var" as the value for $base_dir
if [[ $base_dir != "tmp" ]]; then
	echo "Attempt to manipulate a file not in /tmp. Exiting."
	exit 1
fi

# Checks if change of ownership will be applied to a file
# If not, exit
if [[ ! -f $full_path ]]; then
	echo "Either file does not exist or is a directory.  Exiting."
	exit 1
fi

# once valid, proceed to change ownership
chown postgres:postgres "$full_path"
