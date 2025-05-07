#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing Node.js servers on ports 4000 and 4001
echo "Killing existing servers on ports 4000 and 4001..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:4001 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "Starting backend server..."
cd "$SCRIPT_DIR/backend"
export PORT=4001
export NODE_ENV=development
npm run dev &
BACKEND_PID=$!

# Start frontend server
echo "Starting frontend server..."
cd "$SCRIPT_DIR/src"
export PORT=4000
export NODE_ENV=development
export REACT_APP_API_URL=http://localhost:4001
npm start &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 