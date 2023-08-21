#!/usr/bin/env bash
CLI_LOCATION="$(pwd)/cli"
echo "Building plugin in $(pwd)"

# Rootless Docker usage requires a custom build of the CLI until a fix PR has been merged.
# PR: https://github.com/SteamDeckHomebrew/cli/pull/6
# Fixed code: https://github.com/XanderXAJ/decky-cli/tree/fix-rootless-bind-mount-permission
$CLI_LOCATION/decky plugin build $(pwd)
