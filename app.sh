#!/usr/bin/env bash

# ==============================================================================
# The Imposter Check — Management Control Script
# Usage:
#   ./app.sh start       # Start the application in the background
#   ./app.sh stop        # Stop the running application
#   ./app.sh restart     # Restart the server
#   ./app.sh status      # Check server status and health
#   ./app.sh logs        # View live server output logs
#   ./app.sh test        # Run unit tests
#   ./app.sh samples     # Generate sample input files
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$DIR/.server.pid"
LOG_FILE="$DIR/.server.log"
PORT=8000
HOST="127.0.0.1"

# ANSI Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    # Fallback: check if port 8000 is occupied by uvicorn
    PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        return 0
    fi
    return 1
}

get_pids() {
    PIDS=""
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            PIDS="$PID"
        fi
    fi
    PORT_PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PORT_PIDS" ]; then
        PIDS="$PIDS $PORT_PIDS"
    fi
    echo "$PIDS" | tr ' ' '\n' | sort -u | tr '\n' ' '
}

start_app() {
    echo -e "${CYAN}${BOLD}⚡ Starting The Imposter Check (AI Identity Forensics)...${NC}"
    
    if is_running; then
        echo -e "${YELLOW}⚠️  The application is already running on port ${PORT}!${NC}"
        status_app
        return 0
    fi

    # Determine python command
    if command -v python3 >/dev/null 2>&1; then
        PY_CMD="python3"
    elif command -v python >/dev/null 2>&1; then
        PY_CMD="python"
    else
        echo -e "${RED}❌ Python is not installed or not in PATH.${NC}"
        exit 1
    fi

    cd "$DIR"
    export PYTHONPATH="$DIR:$PYTHONPATH"

    # Start Uvicorn in background
    nohup $PY_CMD -m uvicorn backend.app.main:app --host $HOST --port $PORT --reload > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > "$PID_FILE"

    echo -e "${GREEN}✓ Process launched with PID: ${SERVER_PID}${NC}"
    echo -e "${CYAN}⏳ Waiting for server startup...${NC}"

    # Health check wait loop (max 10 seconds)
    for i in {1..10}; do
        sleep 1
        if curl -s "http://$HOST:$PORT/health" > /dev/null 2>&1; then
            echo -e "${GREEN}${BOLD}🚀 Server is ONLINE and operational!${NC}"
            echo -e "   • Web App:   ${CYAN}http://$HOST:$PORT${NC}"
            echo -e "   • API Docs:  ${CYAN}http://$HOST:$PORT/docs${NC}"
            echo -e "   • Log file:  ${DIR}/.server.log"
            return 0
        fi
    done

    echo -e "${RED}⚠️  Server took longer than expected to start. Check logs with:${NC} ${BOLD}./app.sh logs${NC}"
}

stop_app() {
    echo -e "${YELLOW}${BOLD}🛑 Stopping The Imposter Check...${NC}"
    
    PIDS=$(get_pids)
    if [ -z "$PIDS" ]; then
        echo -e "${GREEN}✓ No running instances found on port ${PORT}.${NC}"
        rm -f "$PID_FILE"
        return 0
    fi

    for PID in $PIDS; do
        if [ -n "$PID" ]; then
            echo -e "   Stopping process PID ${PID}..."
            kill -15 "$PID" 2>/dev/null || true
        fi
    done

    # Wait for process exit
    sleep 1
    for PID in $PIDS; do
        if ps -p "$PID" > /dev/null 2>&1; then
            kill -9 "$PID" 2>/dev/null || true
        fi
    done

    rm -f "$PID_FILE"
    echo -e "${GREEN}${BOLD}✓ Application successfully stopped.${NC}"
}

status_app() {
    echo -e "${PURPLE}${BOLD}🔍 The Imposter Check — Status:${NC}"
    if is_running; then
        PIDS=$(get_pids)
        echo -e "   • State:     ${GREEN}${BOLD}● RUNNING${NC}"
        echo -e "   • PIDs:      ${PIDS}"
        echo -e "   • URL:       ${CYAN}http://$HOST:$PORT${NC}"
        
        # Query Health
        HEALTH=$(curl -s "http://$HOST:$PORT/health" 2>/dev/null || echo "error")
        if [ "$HEALTH" != "error" ]; then
            echo -e "   • Health:    ${GREEN}${HEALTH}${NC}"
        else
            echo -e "   • Health:    ${YELLOW}Starting or unresponsive${NC}"
        fi
    else
        echo -e "   • State:     ${RED}${BOLD}○ STOPPED${NC}"
        echo -e "   • Start with: ${CYAN}./app.sh start${NC}"
    fi
}

view_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        echo -e "${YELLOW}No log file found at ${LOG_FILE}.${NC}"
        return 0
    fi
    echo -e "${CYAN}${BOLD}📋 Streaming live logs (${LOG_FILE}) — Press Ctrl+C to exit:${NC}"
    tail -f "$LOG_FILE"
}

run_tests() {
    echo -e "${CYAN}${BOLD}🧪 Running pytest test suite...${NC}"
    cd "$DIR"
    PYTHONPATH="$DIR" pytest tests/ -v
}

generate_samples() {
    echo -e "${CYAN}${BOLD}📦 Generating sample test media & document files...${NC}"
    cd "$DIR"
    python3 data/generate_samples.py
}

case "$1" in
    start|run)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 1
        start_app
        ;;
    status)
        status_app
        ;;
    logs|log)
        view_logs
        ;;
    test|tests)
        run_tests
        ;;
    samples)
        generate_samples
        ;;
    *)
        echo -e "${CYAN}${BOLD}The Imposter Check — Management Helper${NC}"
        echo -e "Usage: ${BOLD}$0 {start|stop|restart|status|logs|test|samples}${NC}"
        echo ""
        echo -e "Commands:"
        echo -e "  ${GREEN}start${NC}    - Launch the app server in background"
        echo -e "  ${RED}stop${NC}     - Stop all server processes"
        echo -e "  ${YELLOW}restart${NC}  - Restart the application server"
        echo -e "  ${PURPLE}status${NC}   - Check server process and health"
        echo -e "  ${CYAN}logs${NC}     - View live uvicorn server output"
        echo -e "  ${GREEN}test${NC}     - Run automated test suite"
        echo -e "  ${YELLOW}samples${NC}  - Synthesize sample input files"
        exit 1
        ;;
esac
