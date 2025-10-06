#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🖥️ Starting Server Dashboard Frontend..."
cd "$SCRIPT_DIR/frontend" && npm start
