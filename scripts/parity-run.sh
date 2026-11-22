#!/usr/bin/env bash
#
# parity-run.sh — Start the three parity servers, run the e2e parity suite
# against BOTH targets, and clean up.
#
# Usage:
#   ./scripts/parity-run.sh
#   PARITY_TARGET=react|monolith ./scripts/parity-run.sh
#
# Each server gets a fresh temp DB so tests are isolated and repeatable.
# Stale processes on the three ports are killed first.
#
# Targets:
#   Monolith (SSR):  PORT=18480  DB_PATH=/tmp/parity-monolith.db  REDIS db 0
#   Backend (JSON):  PORT=18481  DB_PATH=/tmp/parity-backend.db   REDIS db 1
#   Frontend (Vite): PORT=5173   proxies /api → localhost:18481

set -euo pipefail

# --- Resolve script dir ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MONOLITO_DIR="/home/elses/Desktop/migracion/monolito-ref"
BACKEND_DIR="/home/elses/Desktop/migracion/EcommerceReact/backend"

# --- Ports ---
MONOLITo_PORT=18480
BACKEND_PORT=18481
FRONTEND_PORT=5173

# --- PIDs ---
PIDS=()

cleanup() {
  local exit_code=$?
  echo "=== Cleaning up processes ==="
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  # Extra safety: kill any stragglers on our ports.
  for port in "$MONOLITo_PORT" "$BACKEND_PORT" "$FRONTEND_PORT"; do
    pids_on_port=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids_on_port" ]; then
      echo "$pids_on_port" | xargs kill -9 2>/dev/null || true
    fi
  done
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

# --- Kill stale processes ---
echo "=== Killing stale processes on ports $MONOLITo_PORT, $BACKEND_PORT, $FRONTEND_PORT ==="
for port in "$MONOLITo_PORT" "$BACKEND_PORT" "$FRONTEND_PORT"; do
  pids_on_port=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids_on_port" ]; then
    echo "$pids_on_port" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  fi
done

# --- Remove old temp DBs ---
rm -f /tmp/parity-monolith.db /tmp/parity-monolith.db-wal /tmp/parity-monolith.db-shm
rm -f /tmp/parity-backend.db /tmp/parity-backend.db-wal /tmp/parity-backend.db-shm

# --- Build monolith (needed for static assets: cart.js, auth.js) ---
echo "=== Building monolith ==="
cd "$MONOLITO_DIR"
npm run build 2>&1 | tail -3

# --- Seed both databases ---
echo "=== Seeding monolith DB ==="
cd "$MONOLITO_DIR"
PORT=18480 DB_PATH=/tmp/parity-monolith.db REDIS_URL=redis://localhost:6379/0 JWT_SECRET=parity-local-test-secret-0123456789abcdef npx tsx scripts/seed.ts 2>&1 | tail -3

echo "=== Seeding backend DB ==="
cd "$BACKEND_DIR"
PORT=18481 DB_PATH=/tmp/parity-backend.db REDIS_URL=redis://localhost:6379/1 JWT_SECRET=parity-local-test-secret-0123456789abcdef npx tsx scripts/seed.ts 2>&1 | tail -3

# --- Start monolith (SSR, built) ---
echo "=== Starting monolith on :$MONOLITo_PORT ==="
cd "$MONOLITO_DIR"
PORT=$MONOLITo_PORT \
  DB_PATH=/tmp/parity-monolith.db \
  REDIS_URL=redis://localhost:6379/0 \
  JWT_SECRET=parity-local-test-secret-0123456789abcdef \
  node dist/app.js > /tmp/parity-monolith.log 2>&1 &
MONOLITo_PID=$!
PIDS+=("$MONOLITo_PID")

# --- Start backend (JSON API) ---
echo "=== Starting backend on :$BACKEND_PORT ==="
cd "$BACKEND_DIR"
PORT=$BACKEND_PORT \
  DB_PATH=/tmp/parity-backend.db \
  REDIS_URL=redis://localhost:6379/1 \
  JWT_SECRET=parity-local-test-secret-0123456789abcdef \
  npx tsx src/app.ts > /tmp/parity-backend.log 2>&1 &
BACKEND_PID=$!
PIDS+=("$BACKEND_PID")

# --- Start React frontend (Vite dev with proxy) ---
echo "=== Starting frontend on :$FRONTEND_PORT ==="
cd "$PROJECT_DIR"
VITE_API_PROXY_URL=http://localhost:$BACKEND_PORT PORT=$FRONTEND_PORT npx vite --host 127.0.0.1 > /tmp/parity-frontend.log 2>&1 &
FRONTEND_PID=$!
PIDS+=("$FRONTEND_PID")

# --- Wait for readiness ---
echo "=== Waiting for servers to be ready ==="
for i in $(seq 1 60); do
  mono_ok=""; back_ok=""; fe_ok=""
  curl -sf http://localhost:$MONOLITo_PORT/ > /dev/null 2>&1 && mono_ok="OK"
  curl -sf http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1 && back_ok="OK"
  curl -sf http://localhost:$FRONTEND_PORT > /dev/null 2>&1 && fe_ok="OK"
  echo "  Attempt $i: monolith=$mono_ok backend=$back_ok frontend=$fe_ok"
  [ -n "$mono_ok" ] && [ -n "$back_ok" ] && [ -n "$fe_ok" ] && break
  sleep 1
done

# --- Run parity tests ---
PARITY_TARGET="${PARITY_TARGET:-both}"

if [ "$PARITY_TARGET" = "react" ] || [ "$PARITY_TARGET" = "both" ]; then
  echo "--- PARITY_TARGET=react PARITY_BASE_URL=http://localhost:$FRONTEND_PORT ---"
  PARITY_TARGET=react PARITY_BASE_URL=http://localhost:$FRONTEND_PORT npx playwright test e2e/parity.spec.ts --reporter=line 2>&1 || PARITY_REACT_EXIT=$?
  PARITY_REACT_EXIT=${PARITY_REACT_EXIT:-0}
fi

if [ "$PARITY_TARGET" = "monolith" ] || [ "$PARITY_TARGET" = "both" ]; then
  echo "--- PARITY_TARGET=monolith PARITY_BASE_URL=http://localhost:$MONOLITo_PORT ---"
  PARITY_TARGET=monolith PARITY_BASE_URL=http://localhost:$MONOLITo_PORT npx playwright test e2e/parity.spec.ts --reporter=line 2>&1 || PARITY_MONOLITH_EXIT=$?
  PARITY_MONOLITH_EXIT=${PARITY_MONOLITH_EXIT:-0}
fi

echo "=== Results ==="
[ -n "${PARITY_REACT_EXIT:-}" ] && echo "React (target): exit=$PARITY_REACT_EXIT"
[ -n "${PARITY_MONOLITH_EXIT:-}" ] && echo "Monolith (target): exit=$PARITY_MONOLITH_EXIT"

if [ "${PARITY_REACT_EXIT:-0}" -ne 0 ] || [ "${PARITY_MONOLITH_EXIT:-0}" -ne 0 ]; then
  echo "=== SOME TESTS FAILED — see logs above ==="
  exit 1
fi

echo "=== All parity tests passed ==="
