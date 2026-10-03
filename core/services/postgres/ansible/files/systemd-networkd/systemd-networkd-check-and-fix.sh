#!/bin/bash

# Check for occurrences of an NDisc log error
# NOTE: --since timer flag must match the cadence of systemd timer unit. Risk of repeat matches and restart loop
journalctl --no-pager --unit systemd-networkd --since "1 minutes ago" --grep "Could not set NDisc route" >/dev/null
NDISC_ERROR=$?

if systemctl is-active --quiet systemd-networkd.service && [ "${NDISC_ERROR}" == 0 ]; then
	echo "$(date) systemd-network running but NDisc routes are broken. Restarting systemd.networkd.service"
	/usr/bin/systemctl restart systemd-networkd.service
	exit # no need to check further
fi

# check for routes
ROUTES=$(ip -6 route list)

if ! echo "${ROUTES}" | grep default >/dev/null || ! echo "${ROUTES}" | grep "::1 dev lo" >/dev/null; then
	echo "IPv6 routing table messed up. Restarting systemd.networkd.service"
	/usr/bin/systemctl restart systemd-networkd.service
fi
