#!/bin/sh
set -e

# . is custom cp syntax meaning "copy all files, including hidden ones".
# Source: https://askubuntu.com/a/86891
cp -a /stage/. /backend/out/
