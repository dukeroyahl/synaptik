#!/usr/bin/env bash
# Build Synaptik MCP native image and deploy to ~/Test/synaptik-mcp
# Usage: ./scripts/build-native-to-test.sh [--no-clean] [--verbose] [--run-tests|--skip-tests]

set -euo pipefail

CLEAN=1
VERBOSE=0
SKIP_TESTS=1
for arg in "$@"; do
  case "$arg" in
    --no-clean) CLEAN=0 ; shift ;;
    --verbose) VERBOSE=1 ; shift ;;
    --skip-tests) SKIP_TESTS=1 ; shift ;;
    --run-tests) SKIP_TESTS=0 ; shift ;;
    *) echo "Unknown arg: $arg" >&2; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$REPO_ROOT/mcp"
TARGET_DIR="$HOME/Test"
OUTPUT_NAME="synaptik-mcp"
LOG_DIR="$HOME/.synaptik/logs"
LOG_FILE="$LOG_DIR/mcp-server.log"

printf "\n==> Building Synaptik MCP native image\n"
[ -d "$MCP_DIR" ] || { echo "Missing mcp module at $MCP_DIR" >&2; exit 1; }

cd "$MCP_DIR"

if [[ $CLEAN -eq 1 ]]; then
  ./gradlew clean
fi

ARCH=$(uname -m)
OS=$(uname -s)
CONTAINER_BUILD=false
if [[ "$OS" != "Darwin" ]]; then
  CONTAINER_BUILD=true
fi

# Use new flags instead of deprecated quarkus.package.type when possible
GRADLE_ARGS=(build -Dquarkus.native.enabled=true)
if [[ "$CONTAINER_BUILD" == true ]]; then
  GRADLE_ARGS+=( -Dquarkus.native.container-build=true )
else
  GRADLE_ARGS+=( -Dquarkus.native.container-build=false )
fi

EXTRA_BUILD_ARGS=(--no-fallback)
if [[ $VERBOSE -eq 1 ]]; then
  EXTRA_BUILD_ARGS+=(--verbose)
fi
# Join with commas per Quarkus requirement
ADDITIONAL_ARGS=$(IFS=,; echo "${EXTRA_BUILD_ARGS[*]}")
GRADLE_ARGS+=( -Dquarkus.native.additional-build-args="$ADDITIONAL_ARGS" )

if [[ $SKIP_TESTS -eq 1 ]]; then
  GRADLE_ARGS+=( -x test )
fi

printf "OS=%s ARCH=%s container-build=%s skip-tests=%s\n" "$OS" "$ARCH" "$CONTAINER_BUILD" "$SKIP_TESTS"
printf "Running: ./gradlew %s\n" "${GRADLE_ARGS[*]}"

./gradlew "${GRADLE_ARGS[@]}"

BINARY_PATH=$(find build -maxdepth 3 -type f -name '*-runner' -print -quit)
if [[ -z "$BINARY_PATH" ]]; then
  echo "Failed to find native runner binary" >&2; exit 1;
fi

mkdir -p "$TARGET_DIR"
cp "$BINARY_PATH" "$TARGET_DIR/$OUTPUT_NAME"
chmod +x "$TARGET_DIR/$OUTPUT_NAME"

mkdir -p "$LOG_DIR"

printf "\n==> Native binary deployed\n"
ls -lh "$TARGET_DIR/$OUTPUT_NAME"

cat <<EOF

Run test (stdout must stay clean):
  (printf 'Content-Length: 85\r\n\r\n{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{}}}' \
   ; printf 'Content-Length: 53\r\n\r\n{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}') | \
   "$TARGET_DIR/$OUTPUT_NAME"

Logs written to: $LOG_FILE
Tail logs: tail -f "$LOG_FILE"

Claude VS Code settings example:
"claude.mcpServers": {
  "synaptik": { "command": "$TARGET_DIR/$OUTPUT_NAME" }
}

EOF

printf "Done.\n"
