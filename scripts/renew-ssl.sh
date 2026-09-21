#!/usr/bin/env bash
# Renew Let's Encrypt certificates and reload Docker Nginx.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/blog}"
cd "$APP_DIR"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

docker run --rm \
  -v "$APP_DIR/docker/certbot/www:/var/www/certbot" \
  -v "$APP_DIR/docker/certbot/conf:/etc/letsencrypt" \
  certbot/certbot renew --webroot -w /var/www/certbot

"${COMPOSE[@]}" exec -T nginx nginx -s reload
echo "Renewal complete (or nothing due)."
