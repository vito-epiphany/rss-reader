#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Installing server dependencies..."
(cd server && npm install)

echo "Installing client dependencies..."
(cd client && npm install)

echo "Starting server on port 3001..."
(cd server && npm run dev) &
SERVER_PID=$!

echo "Starting client on port 5173..."
(cd client && npm run dev) &
CLIENT_PID=$!

trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM

echo ""
echo "RSS Reader is running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop."

wait
