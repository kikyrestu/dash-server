#!/bin/bash

# Script to push changes to GitHub
# Usage: ./push-to-github.sh "commit message"

# Check if commit message is provided
if [ -z "$1" ]; then
    echo "Error: Please provide a commit message"
    echo "Usage: ./push-to-github.sh \"Your commit message\""
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: Not a git repository"
    exit 1
fi

# Add all changes
echo "Adding changes to git..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "No changes to commit"
    exit 0
fi

# Commit changes
echo "Committing changes..."
git commit -m "$1

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
echo "Pushing to GitHub..."
git push origin master

echo "✅ Changes pushed to GitHub successfully!"