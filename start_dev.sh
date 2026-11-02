#!/bin/bash

# Usage:
#   ./start_dev.sh          open the public website (index.html)
#   ./start_dev.sh owner    open the owner portal (owner.html)
case "${1:-site}" in
    site)  PAGE=index.html ;;
    owner) PAGE=owner.html ;;
    *)
        echo "Usage: $0 [site|owner]"
        exit 1
        ;;
esac

# Define the project directory
PROJECT_DIR=./ #current directory, adjust as needed
PORT=8000

# Navigate to the project directory
cd "$PROJECT_DIR" || exit

echo "Ensuring port $PORT is available..."
# More aggressive cleanup for Cloud Shell environments
if command -v fuser >/dev/null 2>&1; then
    fuser -k $PORT/tcp 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
else
    # Comprehensive fallback using pgrep to find the specific python server
    PROCESS_PIDS=$(pgrep -f "python3 -m http.server $PORT")
    if [ ! -z "$PROCESS_PIDS" ]; then
        echo "Cleaning up stale processes: $PROCESS_PIDS"
        echo "$PROCESS_PIDS" | xargs kill -9 2>/dev/null
    fi
fi

echo "Starting Madame Beauty development server..."
# Start a Python HTTP server with caching disabled to ensure changes reflect immediately
python3 -c "
from http.server import SimpleHTTPRequestHandler, test
class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()
test(HandlerClass=NoCacheHandler, port=$PORT)" &
# Capture the process ID (PID) of the server to allow for cleanup later
SERVER_PID=$!

# Trap exit signals (like Ctrl+C) to kill the background server process
trap "echo 'Stopping server...'; kill $SERVER_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

# Give the server a second to initialize before opening the browser
sleep 1

# Open the browser (works on Linux/WSL with xdg-open or macOS with open)
xdg-open http://localhost:$PORT/$PAGE 2>/dev/null || open http://localhost:$PORT/$PAGE 2>/dev/null

echo "Server is running at http://localhost:$PORT/$PAGE (PID: $SERVER_PID)"
if [ "$PAGE" = "owner.html" ]; then
    echo "Note: this static server has no booking API, so the Bookings tab will not load."
    echo "      For bookings, use 'npx wrangler dev' and open http://localhost:8787/owner.html"
fi
echo "Press Ctrl+C to stop the server."

# Wait for the background process so the terminal stays open to show logs
wait $SERVER_PID