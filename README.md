# Ink & Voltage — Blog CMS

A production-minded full-stack blog platform: a public editorial website, an admin CMS, Laravel 13 APIs, React, MySQL, Redis, Nginx, and phpMyAdmin. The stack runs with Docker Compose locally and on the production VPS.

This is an independent CMS project. It is not tied to any existing product.

## Requirements

- Docker
- Docker Compose
- Git

No other host-machine installs are required for local development.

## Local installation

```bash
git clone https://github.com/Pratanu123/blog.git
cd blog
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up -d --build
```

The PHP container waits for MySQL, installs Composer dependencies if needed, generates an application key when missing, runs migrations, and seeds demo data on first boot.

Optional manual steps:

```bash
docker compose exec php php artisan key:generate
docker compose exec php php artisan migrate --seed
docker compose exec php php artisan storage:link
```

## Frontend

The `frontend` service runs Vite with hot reload. Nginx on port 80 proxies the public site and `/admin` to Vite, and proxies `/api`, `/sanctum`, `/storage`, `/sitemap.xml`, `/robots.txt`, and `/feed.xml` to Laravel.

```bash
docker compose logs -f frontend
docker compose exec frontend npm test
```

`VITE_API_URL` defaults to `/api` so the browser stays same-origin through Nginx.

## Local URLs

| Surface | URL |
| --- | --- |
| Public blog | http://localhost |
| Admin CMS | http://localhost/admin |
| API | http://localhost/api |
| phpMyAdmin | http://localhost:8081 |

Useful public routes: `/blog`, `/category/programming`, `/tag/golang`, `/search?q=laravel`, `/sitemap.xml`, `/robots.txt`, `/feed.xml`.

## Local development credentials

**Change these before any non-local deployment.**

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | superadmin@blogcms.test | password |
| Admin | admin@blogcms.test | password |
| Editor | editor@blogcms.test | password |
| Author | leo@blogcms.test | password |
| Author | maya@blogcms.test | password |

phpMyAdmin uses `blog_user` / `blog_password`. MySQL root is `root_password`. These values are development defaults only.

---

## Production server setup (this VPS)

Production uses the same Docker Compose stack with `docker-compose.prod.yml` overrides:

- MySQL and Redis stay on the Docker network only (no host ports)
- Vite binds to `127.0.0.1:5173`; phpMyAdmin is off unless the `tools` profile is enabled
- phpMyAdmin is off unless the `tools` profile is enabled
- `APP_URL` / Sanctum domains come from the root `.env`

Canonical install path on the server: **`/opt/blog`**.

### 1. Bootstrap the host

As root on a fresh Ubuntu server (Docker will be installed if missing):

```bash
git clone https://github.com/Pratanu123/blog.git /opt/blog
cd /opt/blog
chmod +x scripts/*.sh
PUBLIC_URL=http://YOUR_SERVER_IP ./scripts/server-setup.sh
```

What `scripts/server-setup.sh` does:

1. Installs Git, OpenSSH, and Docker (if needed) and enables the services
2. Clones or updates the repo at `/opt/blog`
3. Writes production `.env` and `backend/.env` with strong DB passwords and `APP_URL`
4. Creates an SSH deploy key at `/root/.ssh/blog_deploy` and authorizes it
5. Runs `scripts/deploy.sh` to build and start containers

### 2. Manual deploy / refresh

```bash
cd /opt/blog
./scripts/deploy.sh
```

This pulls the configured branch, rebuilds images, restarts containers, and clears Laravel caches.

Useful checks:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f php
curl -I http://127.0.0.1/
```

Optional phpMyAdmin (localhost only):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile tools up -d phpmyadmin
# then: ssh -L 8081:127.0.0.1:8081 root@YOUR_SERVER_IP
```

### 3. How this server was configured

| Item | Value |
| --- | --- |
| Host | Ubuntu 26.04 LTS VPS |
| Public IPv4 | `187.127.162.32` |
| App directory | `/opt/blog` |
| HTTP | port `80` via `blogcms-nginx` |
| Runtime | Docker Engine + Compose |
| Compose files | `docker-compose.yml` + `docker-compose.prod.yml` |
| Deploy user | `root` (SSH key auth for CI) |
| Deploy key | `/root/.ssh/blog_deploy` |

After bootstrap the site is served at **http://187.127.162.32** (update `APP_URL` / `SANCTUM_STATEFUL_DOMAINS` if you attach a domain later).

---

## GitHub → server auto-deploy

Merges (and pushes) to **`main`** or **`master`** trigger [.github/workflows/deploy.yml](.github/workflows/deploy.yml). The workflow SSHes into the server and runs `scripts/deploy.sh`.

### Repository secrets

In GitHub: **Settings → Secrets and variables → Actions**, create:

| Secret | Example / notes |
| --- | --- |
| `DEPLOY_HOST` | `187.127.162.32` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_PATH` | `/opt/blog` |
| `DEPLOY_SSH_KEY` | Full private key from `/root/.ssh/blog_deploy` on the server |

The matching public key must be in the server’s `/root/.ssh/authorized_keys` (the bootstrap script does this).

On the server, after `gh auth login`, you can push and set all secrets in one step:

```bash
cd /opt/blog
./scripts/configure-github-secrets.sh
```

### Flow

```text
PR merged to main/master
        │
        ▼
GitHub Actions (ubuntu-latest)
        │  SSH with DEPLOY_SSH_KEY
        ▼
/opt/blog/scripts/deploy.sh
        │  git fetch + reset --hard origin/<branch>
        │  docker compose up -d --build
        │  artisan cache clears
        ▼
Live site on the VPS
```

You can also run the workflow manually via **Actions → Deploy to server → Run workflow**.

---

## Stack

- PHP 8.3 / Laravel 13 / Sanctum / PHP-FPM
- React / TypeScript / Vite / React Router / Axios / Tailwind CSS
- MySQL 8 / Redis 7 / Nginx / phpMyAdmin
- Docker Compose services: `nginx`, `php`, `mysql`, `redis`, `phpmyadmin`, `frontend`, plus `queue` and `scheduler`

## Common commands

```bash
docker compose ps
docker compose logs -f php
docker compose exec php php artisan migrate --seed
docker compose exec php php artisan articles:publish-scheduled
docker compose exec php php artisan test
docker compose exec frontend npm test
```

On production, prefix with `-f docker-compose.yml -f docker-compose.prod.yml`.

Scheduled articles are published by the `scheduler` container. Queue jobs run in the `queue` container.

## API shape

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Article created successfully"
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

Admin APIs live under `/api/*` and require Sanctum session authentication. Public APIs live under `/api/public/*` and `/api/search`.

## Project layout

```text
backend/     Laravel API, migrations, policies, jobs
frontend/    React public site + admin CMS
docker/      Nginx, PHP, and MySQL support files
scripts/     server-setup.sh, deploy.sh
.github/     Actions deploy workflow
```
