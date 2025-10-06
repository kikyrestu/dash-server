#!/bin/bash

# Deploy Server Dashboard with PAM Authentication to GitHub
# This script helps deploy the enhanced dashboard to GitHub repository

echo "🚀 Server Dashboard with PAM Authentication - GitHub Deployment"
echo "=============================================================="

# Check if git is configured
if ! git config user.name > /dev/null 2>&1; then
    echo "❌ Git user not configured. Please run:"
    echo "   git config --global user.name 'Your Name'"
    echo "   git config --global user.email 'your.email@example.com'"
    exit 1
fi

# Check current directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Please run this script from the server-dash root directory"
    exit 1
fi

echo "📋 Project Summary:"
echo "   • PAM Authentication System ✅"
echo "   • Dual Authentication Modes (System Auto + Dashboard) ✅"
echo "   • Enhanced Login UI ✅"
echo "   • Security Improvements ✅"
echo "   • System Integration ✅"
echo ""

# Show current status
echo "📊 Current Git Status:"
git status --short

echo ""
echo "📝 Recent Commits:"
git log --oneline -3

echo ""
echo "🔗 Repository Information:"
echo "   GitHub Repository: https://github.com/kikyrestu/dash-server"
echo "   Remote URL: $(git remote get-url origin 2>/dev/null || echo 'Not configured')"

echo ""
echo "🚀 To complete the deployment:"
echo "1. Ensure the GitHub repository exists: https://github.com/kikyrestu/dash-server"
echo "2. Configure GitHub authentication (Personal Access Token or SSH key)"
echo "3. Run: git push -u origin main"
echo ""
echo "📖 GitHub Authentication Options:"
echo "   • Personal Access Token: https://github.com/settings/tokens"
echo "   • SSH Key: ssh-keygen -t ed25519 -C 'your.email@example.com'"
echo ""
echo "✨ Features Ready for Deployment:"
echo "   🔐 PAM Authentication with OS credentials"
echo "   🔄 Automatic fallback authentication"
echo "   🎨 Enhanced login interface"
echo "   🛡️ Enhanced security features"
echo "   📊 Full dashboard functionality"
echo "   🌐 WebSocket real-time updates"
echo ""
echo "📋 Next Steps:"
echo "1. Create GitHub repository if it doesn't exist"
echo "2. Set up authentication (token/SSH key)"
echo "3. Run: git push -u origin main"
echo "4. Access your deployed dashboard"

# Optionally attempt to push with error handling
echo ""
read -p "🤔 Would you like to attempt pushing now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Attempting to push to GitHub..."
    if git push -u origin main; then
        echo "✅ Successfully pushed to GitHub!"
        echo "🌐 Repository: https://github.com/kikyrestu/dash-server"
        echo "📖 View your code: https://github.com/kikyrestu/dash-server"
    else
        echo "❌ Push failed. Please check:"
        echo "   • GitHub repository exists"
        echo "   • Authentication is configured"
        echo "   • Network connection is available"
        echo ""
        echo "💡 Try manual push: git push -u origin main"
    fi
else
    echo "👍 You can push manually later with: git push -u origin main"
fi

echo ""
echo "🎉 PAM Authentication System is ready for deployment!"
