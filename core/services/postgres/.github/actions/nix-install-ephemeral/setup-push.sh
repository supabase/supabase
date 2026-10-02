#!/usr/bin/env bash

set -euo pipefail

mkdir -p ~/.aws
umask 0277
cat >~/.aws/config <<-EOF
	[default]
	region = ${AWS_REGION:?}
EOF
cat >~/.aws/credentials <<-EOF
	[default]
	aws_access_key_id = ${AWS_ACCESS_KEY_ID:?}
	aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY:?}
	aws_session_token = ${AWS_SESSION_TOKEN:?}
EOF

printenv NIX_SIGN_SECRET_KEY >"${NIXCONFDIR:?}/nix-secret-key"

cat >"$NIXCONFDIR/upload-to-cache.sh" <<-EOF
	#!/usr/bin/env bash
	set -euo pipefail
	set -f

	if [[ ! -e  ${NIXBINDIR:?}/nix ]]; then
		# called during nix install, but nix isn't available yet
		exit
	fi

	export IFS=' '
	$NIXBINDIR/nix copy --max-jobs 5 --to 's3://nix-postgres-artifacts?secret-key=$NIXCONFDIR/nix-secret-key' \$OUT_PATHS
EOF
chmod 755 "$NIXCONFDIR/upload-to-cache.sh"

echo "post-build-hook = $NIXCONFDIR/upload-to-cache.sh"
