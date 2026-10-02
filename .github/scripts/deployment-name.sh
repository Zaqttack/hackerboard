#!/usr/bin/env bash
set -euo pipefail

branch="$1"

if [ "$branch" = "main" ]; then
  echo "hackerboard"
  exit 0
fi

slug=$(printf '%s' "$branch" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//' | cut -c1-40 | sed -E 's/-+$//')
echo "hackerboard-$slug"
