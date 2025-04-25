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
    BACKEND_PID=$(lsof -ti:4001)
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Found existing backend server (PID: $BACKEND_PID). Stopping it...${NC}"
        kill -9 $BACKEND_PID 2>/dev/null
        sleep 1
    fi

    # Kill any process running on port 3000 (frontend)
    FRONTEND_PID=$(lsof -ti:3000)
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Found existing frontend server (PID: $FRONTEND_PID). Stopping it...${NC}"
        kill -9 $FRONTEND_PID 2>/dev/null
        sleep 1
    fi

    # Kill any process running on port 4000 (alternative frontend port)
    PORT_4000_PID=$(lsof -ti:4000)
    if [ ! -z "$PORT_4000_PID" ]; then
        echo -e "${YELLOW}Found process on port 4000 (PID: $PORT_4000_PID). Stopping it...${NC}"
        kill -9 $PORT_4000_PID 2>/dev/null
        sleep 1
    fi
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
cd "$ROOT_DIR/cosmo-stats/backend" && npx ts-node src/server.ts &
BACKEND_PID=$!

# Wait a moment to ensure backend is running
sleep 2

# Start frontend server
echo -e "\n${GREEN}Starting frontend server...${NC}"
cd "$ROOT_DIR/cosmo-stats" && PORT=3000 npm start &
FRONTEND_PID=$!

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Keep script running and show status
echo -e "\n${GREEN}Servers are running!${NC}"
echo "Backend server is running on http://localhost:4001"
echo "Frontend server will open automatically in your browser (http://localhost:3000)"
echo -e "\n${BLUE}Press Ctrl+C to stop both servers${NC}"

# Wait forever
wait 