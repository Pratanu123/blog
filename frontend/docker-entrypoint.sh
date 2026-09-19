#!/bin/sh
set -e

if [ ! -d node_modules/react ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

exec "$@"
