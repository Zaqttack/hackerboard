#!/usr/bin/env bash
set -euo pipefail

name="$1"
create="${2:-}"

find_id() {
  pnpm exec wrangler d1 list --json | jq -r --arg n "$name" '.[] | select(.name == $n) | (.uuid // .database_id // .id)'
}

id=$(find_id)
if [ -z "$id" ] && [ "$create" = "--create" ]; then
  pnpm exec wrangler d1 create "$name"
  id=$(find_id)
fi
test -n "$id"

jq --arg name "$name" --arg id "$id" \
  '.name = $name | .d1_databases[0].database_name = $name | .d1_databases[0].database_id = $id' \
  wrangler.jsonc > wrangler.tmp
mv wrangler.tmp wrangler.jsonc
