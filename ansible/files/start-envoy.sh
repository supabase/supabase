#!/usr/bin/env bash
set -eou pipefail

if [[ $(cat /sys/module/ipv6/parameters/disable) == 1 ]]; then
	sed -i -e "s/address: '::'/address: '0.0.0.0'/" -e 's/ipv4_compat: true/ipv4_compat: false/' /etc/envoy/lds.yaml
else
	sed -i -e "s/address: '0.0.0.0'/address: '::'/" -e 's/ipv4_compat: false/ipv4_compat: true/' /etc/envoy/lds.yaml
fi

# Workaround using `tee` to get `/dev/stdout` access logging to work, see:
# https://github.com/envoyproxy/envoy/issues/8297#issuecomment-620659781
exec /opt/envoy --config-path /etc/envoy/envoy.yaml --restart-epoch "${RESTART_EPOCH}" 2>&1 | tee
