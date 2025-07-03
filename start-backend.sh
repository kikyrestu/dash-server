#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🔧 Starting Server Dashboard Backend..."
cd "$SCRIPT_DIR/backend" && npm start
