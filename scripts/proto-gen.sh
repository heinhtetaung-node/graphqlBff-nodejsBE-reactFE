#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

PROTO_DIR="$ROOT_DIR/protos"
OUT_DIR="$ROOT_DIR/shared/proto-generated"
PLUGIN="$ROOT_DIR/shared/node_modules/.bin/protoc-gen-ts_proto"

echo "Cleaning output directory..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "Generating TypeScript from proto files..."
protoc \
  --plugin="protoc-gen-ts_proto=$PLUGIN" \
  --ts_proto_out="$OUT_DIR" \
  --ts_proto_opt=outputServices=grpc-js \
  --ts_proto_opt=esModuleInterop=true \
  --ts_proto_opt=snakeToCamel=true \
  --ts_proto_opt=forceLong=string \
  --proto_path="$PROTO_DIR" \
  "$PROTO_DIR"/*.proto

echo "Generated files:"
find "$OUT_DIR" -name '*.ts' | sort

echo "Done!"
