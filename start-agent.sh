#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📊 Starting Server Dashboard Agent..."
cd "$SCRIPT_DIR/agent" && npm start
