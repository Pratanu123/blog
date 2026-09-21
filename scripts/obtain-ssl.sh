#!/usr/bin/env bash
# Obtain Let's Encrypt certificates for inkandvoltage.com (webroot challenge).
# Prerequisites:
#   - DNS A/CNAME already pointing to this VPS
#   - Stack running with production-http.conf (HTTP) so ACME path is reachable
#   - Ports 80 (and later 443) open
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/blog}"
EMAIL="${SSL_EMAIL:-}"
STAGING="${SSL_STAGING:-0}"

cd "$APP_DIR"

mkdir -p docker/certbot/www docker/certbot/conf

if [ -z "$EMAIL" ]; then
  echo "Set SSL_EMAIL to a real contact email, e.g.:"
  echo "  SSL_EMAIL=you@example.com ./scripts/obtain-ssl.sh"
  exit 1
fi

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

echo "==> Ensuring HTTP stack is up (ACME webroot)"
export NGINX_CONF=production-http.conf
"${COMPOSE[@]}" up -d nginx

STAGING_FLAG=()
if [ "$STAGING" = "1" ]; then
  STAGING_FLAG=(--staging)
  echo "==> Using Let's Encrypt STAGING (not trusted by browsers)"
fi

echo "==> Requesting certificates for inkandvoltage.com + www"
docker run --rm \
  -v "$APP_DIR/docker/certbot/www:/var/www/certbot" \
  -v "$APP_DIR/docker/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly \
  --webroot \
  -w /var/www/certbot \
  "${STAGING_FLAG[@]}" \
  -d inkandvoltage.com \
  -d www.inkandvoltage.com \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "==> Switching Nginx to HTTPS config"
export NGINX_CONF=production.conf
# Persist choice for subsequent deploys
if grep -q '^NGINX_CONF=' .env 2>/dev/null; then
  sed -i 's/^NGINX_CONF=.*/NGINX_CONF=production.conf/' .env
else
  echo 'NGINX_CONF=production.conf' >> .env
fi

"${COMPOSE[@]}" up -d nginx

echo "==> Reloading Nginx"
"${COMPOSE[@]}" exec -T nginx nginx -t
"${COMPOSE[@]}" exec -T nginx nginx -s reload

echo "SSL ready. Visit https://inkandvoltage.com"
