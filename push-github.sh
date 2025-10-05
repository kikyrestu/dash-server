#!/bin/bash

echo "🚀 Pushing to GitHub..."
echo "================================"

# Add all changes
git add .

# Commit with current timestamp
git commit -m "$(cat <<'EOF'
fix: System authentication module import issues

- Convert system-auth.js to TypeScript with proper types
- Move system-auth.ts to src/lib/ directory for proper module resolution
- Fix import paths in API routes from '@/system-auth' to '@/lib/system-auth'
- Add TypeScript interfaces for AuthResult, UserInfo, and TokenVerification
- Update SystemAuth class with proper TypeScript typing
- Ensure compatibility with Next.js module resolution

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to GitHub
git push origin master

echo "✅ Done! All changes pushed to GitHub!"
echo "🌐 Check your repo: https://github.com/kikyrestu/dash-server"