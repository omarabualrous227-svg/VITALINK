#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules/express ] || [ ! -d node_modules/ws ]; then npm install --no-audit --no-fund; fi
exec node server.js
