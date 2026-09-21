#!/usr/bin/env bash
# Deploy / refresh the blog stack on this server.
# Intended path: /opt/blog
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/blog}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

echo "==> Deploying blog from $(pwd) (branch: $BRANCH)"

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env — copy from .env.example and configure production values first."
  exit 1
fi

if [ ! -f backend/.env ]; then
  echo "Missing $APP_DIR/backend/.env — copy from backend/.env.example first."
  exit 1
fi

if [ "${SKIP_GIT:-0}" != "1" ]; then
  # Avoid dirty-tree failures during automated deploys (env files stay local/untracked).
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  echo "==> SKIP_GIT=1 — leaving working tree unchanged"
fi

echo "==> Building and starting containers"
docker compose "${COMPOSE_FILES[@]}" up -d --build --remove-orphans

echo "==> Waiting for PHP container"
for i in $(seq 1 60); do
  if docker compose "${COMPOSE_FILES[@]}" exec -T php php -v >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Clearing Laravel caches"
docker compose "${COMPOSE_FILES[@]}" exec -T php php artisan config:clear || true
docker compose "${COMPOSE_FILES[@]}" exec -T php php artisan cache:clear || true
docker compose "${COMPOSE_FILES[@]}" exec -T php php artisan route:clear || true
docker compose "${COMPOSE_FILES[@]}" exec -T php php artisan view:clear || true

echo "==> Deploy finished"
docker compose "${COMPOSE_FILES[@]}" ps
