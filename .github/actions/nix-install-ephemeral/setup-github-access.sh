#!/usr/bin/env bash

umask 0277
echo "access-tokens = github.com=${GITHUB_TOKEN:?}" >"$NIXCONFDIR/github.nix.conf"
echo "!include $NIXCONFDIR/github.nix.conf"
