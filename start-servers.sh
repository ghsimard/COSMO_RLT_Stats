#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Store the root directory
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}COSMO Stats Server Manager${NC}\n"

# Function to kill existing servers
kill_existing_servers() {
    # Kill any process running on port 4001 (backend)
    lsof -ti:4001 | xargs kill -9 2>/dev/null

    # Kill any process running on port 4000 (frontend)
    lsof -ti:4000 | xargs kill -9 2>/dev/null
}

# Function to handle script termination
cleanup() {
    echo -e "\n${BLUE}Stopping servers...${NC}"
    kill -9 $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Kill any existing servers first
kill_existing_servers

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
cd "$ROOT_DIR/cosmo-stats/backend" && PORT=4001 npx ts-node src/server.ts &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend server
echo -e "\n${GREEN}Starting frontend server...${NC}"
cd "$ROOT_DIR/cosmo-stats" && PORT=4000 npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Open the frontend in the default browser
open http://localhost:4000

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Keep script running and show status
echo -e "\n${GREEN}Servers are running!${NC}"
echo "Backend server is running on http://localhost:4001"
echo "Frontend server will open automatically in your browser (http://localhost:4000)"
echo -e "\n${BLUE}Press Ctrl+C to stop both servers${NC}"

# Wait forever
wait 