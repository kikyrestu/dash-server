# GitHub Push Instructions

## Quick Push Commands

### Method 1: Using the provided script
```bash
# Add all changes and commit with a message
git add .
git commit -m "Your commit message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin master
```

### Method 2: One-liner command
```bash
git add . && git commit -m "Your commit message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" && git push origin master
```

## Setup Remote Repository

If you haven't set up the remote repository yet:

1. Create a new repository on GitHub
2. Copy the repository URL (e.g., `https://github.com/username/repository.git`)
3. Add the remote to your local repository:
   ```bash
   git remote add origin https://github.com/username/repository.git
   ```

## After Each Fix or Change

After making any changes to the project, use one of the methods above to push to GitHub. Make sure to:

1. **Add all changes**: `git add .`
2. **Commit with descriptive message**: Include what you fixed or changed
3. **Push to remote**: `git push origin master`

## Example Usage

```bash
# After fixing a bug
git add .
git commit -m "Fixed WebSocket connection issue

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin master

# After adding a new feature
git add .
git commit -m "Added database management functionality

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin master
```

## Handling the dash-server Subdirectory

The `dash-server/` directory is a separate Git repository. You have two options:

### Option 1: Commit as submodule (Recommended)
```bash
# First, commit and push changes in dash-server
cd dash-server
git add .
git commit -m "Update dashboard server"
git push origin main
cd ..

# Then add as submodule
git submodule add https://github.com/username/dash-server-repo.git dash-server
git commit -m "Add dash-server as submodule"
git push origin master
```

### Option 2: Include in main repository (Not recommended for existing repos)
```bash
# Remove the .git directory from dash-server
rm -rf dash-server/.git

# Then add the files
git add dash-server/
git commit -m "Add dash-server files"
git push origin master
```