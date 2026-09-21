# Production deployment — Ink & Voltage

Canonical domain: **https://inkandvoltage.com**  
www redirects to apex.  
VPS: **187.127.162.32** (Hostinger, Ubuntu 26.04 LTS)  
App path: `/opt/blog`

This stack uses the **existing Docker Compose architecture** (Docker Nginx → Vite frontend + PHP-FPM Laravel). No host-level Nginx and no Kubernetes.

---

## 1. DNS (Hostinger)

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `187.127.162.32` |
| CNAME | `www` | `inkandvoltage.com` |

Wait until both resolve before requesting SSL:

```bash
dig +short inkandvoltage.com A
dig +short www.inkandvoltage.com CNAME
curl -I http://inkandvoltage.com
```

---

## 2. VPS requirements

- Docker Engine + Compose plugin
- Git
- Outbound HTTPS (image pulls, Let's Encrypt)
- Inbound **80** and **443** open

Docker install (if needed): https://docs.docker.com/engine/install/ubuntu/

---

## 3. Environment variables

Do **not** commit `.env` or `backend/.env`.

Root `.env` (Compose + prod overrides) should include at least:

```bash
APP_NAME=BlogCMS
APP_ENV=production
APP_DEBUG=false
APP_URL=https://inkandvoltage.com

DB_DATABASE=blog
DB_USERNAME=blog_user
DB_PASSWORD=<strong-secret>
MYSQL_ROOT_PASSWORD=<strong-secret>

REDIS_HOST=redis
REDIS_PORT=6379

SANCTUM_STATEFUL_DOMAINS=inkandvoltage.com,www.inkandvoltage.com
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=true
CORS_ALLOWED_ORIGINS=https://inkandvoltage.com,https://www.inkandvoltage.com

VITE_API_URL=/api

# After SSL is issued:
NGINX_CONF=production.conf
# Before SSL (HTTP validation only):
# NGINX_CONF=production-http.conf
```

Mirror the same `APP_*`, DB, Redis, Sanctum, Session, and CORS values into `backend/.env`.

**Do not regenerate `APP_KEY` if one already exists** in `backend/.env`.

Frontend uses same-origin `/api` (`VITE_API_URL=/api`) — no separate API host.

---

## 4. Local development (unchanged)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up -d --build
```

- Public site via Nginx: http://localhost  
- Vite direct: http://localhost:5173  
- phpMyAdmin: http://localhost:8081  

Local Compose continues to use Vite **dev** and `docker/nginx/default.conf`.

---

## 5. Production Docker commands

```bash
cd /opt/blog
git pull origin main

# HTTP stage (default NGINX_CONF=production-http.conf)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Or use the deploy helper
./scripts/deploy.sh
```

Production frontend runs `npx vite build` then `vite preview` on port 5173 (still proxied by Docker Nginx — same request flow as local).

Note: `npm run build` (`tsc -b && vite build`) currently fails on pre-existing TypeScript issues unrelated to deployment; production Compose uses `vite build` directly until those types are fixed.

MySQL and Redis are **not** published to the host.  
phpMyAdmin is **not** started unless:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile tools up -d phpmyadmin
# then SSH tunnel: ssh -L 8081:127.0.0.1:8081 root@187.127.162.32
```

---

## 6. Database migrations

Do **not** run `migrate:fresh` / `db:wipe`.

PHP entrypoint runs `php artisan migrate --force` on PHP-FPM boot when appropriate. Manual:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec php php artisan migrate --force
```

Review pending migrations first:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec php php artisan migrate:status
```

---

## 7. Storage

- `php artisan storage:link` is handled by the PHP entrypoint.
- Uploaded media lives in Docker volume `media_storage` (persists across container recreation).

---

## 8. Nginx

| Stage | File | Purpose |
| --- | --- | --- |
| Local | `docker/nginx/default.conf` | `server_name localhost` |
| Prod HTTP | `docker/nginx/production-http.conf` | Domain + ACME path, no HTTPS yet |
| Prod HTTPS | `docker/nginx/production.conf` | HTTP→HTTPS, www→apex, TLS |

Shared routing: `docker/nginx/app-locations.conf`  
Security headers already include X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.  
**CSP is not configured** (avoid breaking the SPA).

Health: Laravel `GET /up`

---

## 9. SSL (Let's Encrypt)

1. Confirm DNS points to `187.127.162.32`.
2. Run HTTP production stack.
3. Issue certificates:

```bash
cd /opt/blog
chmod +x scripts/*.sh
SSL_EMAIL=your@email.com ./scripts/obtain-ssl.sh
```

Optional dry-run with staging CA:

```bash
SSL_EMAIL=your@email.com SSL_STAGING=1 ./scripts/obtain-ssl.sh
```

4. Script writes certs under `docker/certbot/conf`, sets `NGINX_CONF=production.conf`, reloads Nginx.

Renewal (cron recommended, twice daily is fine):

```bash
./scripts/renew-ssl.sh
```

Example crontab:

```cron
0 3,15 * * * cd /opt/blog && ./scripts/renew-ssl.sh >> /var/log/blog-ssl-renew.log 2>&1
```

Private keys must never be committed (gitignored).

---

## 10. Logs

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f nginx php frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec php tail -n 100 storage/logs/laravel.log
```

---

## 11. Restart

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
# or
./scripts/deploy.sh
```

---

## 12. Rollback

```bash
cd /opt/blog
git fetch origin
git checkout <previous-good-sha>
./scripts/deploy.sh
```

Database rollbacks are manual and must be planned; do not auto-rollback data.

---

## 13. Backups

- **MySQL**: dump from inside the network (not public 3306):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T mysql \
  mysqldump -ublog_user -p"$DB_PASSWORD" blog > backup-$(date +%F).sql
```

- **Media**: back up Docker volume `media_storage` or `storage/app/public` bind contents.
- **Certs**: `docker/certbot/conf` (secure copy off-box).

---

## 14. Verification

```bash
curl -I http://inkandvoltage.com
curl -I https://inkandvoltage.com
curl -I https://www.inkandvoltage.com   # expect redirect to apex
curl -s https://inkandvoltage.com/up
curl -s https://inkandvoltage.com/api/public/articles | head
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -t
```

---

## 15. GitHub auto-deploy

Push/merge to `main`/`master` runs `.github/workflows/deploy.yml` → SSH → `scripts/deploy.sh`.  
Ensure production `.env` on the server already has domain + `NGINX_CONF` set; deploy does not overwrite env files.
