#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Stopping existing processes..."

# Kill any running uvicorn (backend) processes for this project
pkill -f "uvicorn chat_app.backend.server:app" 2>/dev/null && echo "    Stopped backend" || echo "    No backend running"

# Kill any running vite (frontend) processes for this project
pkill -f "vite.*chat_app/frontend" 2>/dev/null && echo "    Stopped frontend" || echo "    No frontend running"

# Brief pause to let ports free up
sleep 1

echo "==> Starting backend (FastAPI on port 8000)..."
source "$SCRIPT_DIR/venv/bin/activate"
uvicorn chat_app.backend.server:app --reload --port 8000 &
BACKEND_PID=$!

echo "==> Starting frontend (Vite on port 5173)..."
cd "$SCRIPT_DIR/chat_app/frontend"
npm run dev &
FRONTEND_PID=$!

cd "$SCRIPT_DIR"

echo ""
echo "==> Both servers started"
echo "    Backend  : http://127.0.0.1:8000  (PID $BACKEND_PID)"
echo "    Frontend : http://localhost:5173   (PID $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop both."

# Trap Ctrl+C to cleanly kill both child processes
trap 'echo ""; echo "==> Shutting down..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; wait; echo "Done."; exit 0' INT TERM

wait
