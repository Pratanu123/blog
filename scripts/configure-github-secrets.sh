#!/usr/bin/env bash
# Push deploy commit (if any) and configure GitHub Actions secrets for this VPS.
# Requires: gh auth login (scopes: repo, workflow)
set -euo pipefail

REPO="${REPO:-Pratanu123/blog}"
HOST="${DEPLOY_HOST:-187.127.162.32}"
USER="${DEPLOY_USER:-root}"
PORT="${DEPLOY_PORT:-22}"
PATH_ON_SERVER="${DEPLOY_PATH:-/opt/blog}"
KEY_FILE="${DEPLOY_KEY_FILE:-/root/.ssh/blog_deploy}"

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run: gh auth login -h github.com -p https -w"
  exit 1
fi

cd "$PATH_ON_SERVER"
git push -u origin HEAD

gh secret set DEPLOY_HOST --repo "$REPO" --body "$HOST"
gh secret set DEPLOY_USER --repo "$REPO" --body "$USER"
gh secret set DEPLOY_PORT --repo "$REPO" --body "$PORT"
gh secret set DEPLOY_PATH --repo "$REPO" --body "$PATH_ON_SERVER"
gh secret set DEPLOY_SSH_KEY --repo "$REPO" < "$KEY_FILE"

echo "Secrets configured on $REPO. Triggering workflow..."
gh workflow run deploy.yml --repo "$REPO" --ref "$(git rev-parse --abbrev-ref HEAD)" || true
echo "Done. Watch: https://github.com/${REPO}/actions"
