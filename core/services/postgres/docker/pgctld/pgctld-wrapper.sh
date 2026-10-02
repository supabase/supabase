#!/bin/sh
# Wrapper invoked as /usr/local/bin/pgctld by the multigres-operator's pod
# spec (Command: ["/usr/local/bin/pgctld"]). Two responsibilities:
#
# 1. Inject --postgres-config-template so unmodified k8s manifests and local
#    provisioner commands work without extra flags. Variant-specific template
#    path is supplied via POSTGRES_CONFIG_TEMPLATE_PATH; vanilla pg17 default
#    if unset.
#
# 2. Bridge postgres's JSON log file to the container's stdout so kubelet +
#    Vector can ship it without a sidecar or a tail-F daemon:
#
#      log_destination = 'jsonlog'       (postgresql-jsonlog.conf)
#      log_directory   = /var/log/postgresql
#      log_filename    = postgresql.log  -> postgres writes postgresql.json
#
#    Symlink that .json path at /proc/1/fd/1. The kernel resolves the symlink
#    when postgres opens the file for append — at that point this script has
#    exec'd pgctld, so pgctld is PID 1 and its fd 1 is the container's
#    stdout stream (inherited from the container runtime). Postgres's writes
#    land on stdout, kubelet captures, Vector ships to Logflare.
#
#    Rotation is disabled in postgresql-jsonlog.conf (log_rotation_age=0,
#    log_rotation_size=0), so postgres never tries to rename the symlink.
set -e

mkdir -p /var/log/postgresql 2>/dev/null || true
ln -sf /proc/1/fd/1 /var/log/postgresql/postgresql.json

exec /nix/var/nix/profiles/default/bin/pgctld \
	--postgres-config-template "${POSTGRES_CONFIG_TEMPLATE_PATH:-/etc/pgctld-custom/postgresql.conf.tmpl}" \
	"$@"
