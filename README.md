# Ink & Voltage — Blog CMS

A production-minded full-stack blog platform: a public editorial website, an admin CMS, Laravel 13 APIs, React, MySQL, Redis, Nginx, and phpMyAdmin. The entire stack runs locally with Docker Compose.

This is an independent CMS project. It is not tied to any existing product.

## Requirements

- Docker
- Docker Compose
- Git

No other host-machine installs are required.

## Installation

```bash
git clone <this-repository>
cd blog
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up -d
```

The PHP container waits for MySQL, installs Composer dependencies if needed, generates an application key when missing, runs migrations, and seeds demo data on first boot.

If you want to run those steps yourself:

```bash
docker compose exec php php artisan key:generate
docker compose exec php php artisan migrate --seed
docker compose exec php php artisan storage:link
```

## Frontend

The `frontend` service runs Vite in development mode with hot reload. Nginx on port 80 proxies the public site and `/admin` to Vite, and proxies `/api`, `/sanctum`, `/storage`, `/sitemap.xml`, `/robots.txt`, and `/feed.xml` to Laravel.

```bash
# Optional, if you want the Vite process logs
docker compose logs -f frontend

# Frontend unit tests
docker compose exec frontend npm test
```

`VITE_API_URL` defaults to `/api` so the browser stays same-origin through Nginx.

## URLs

| Surface | URL |
| --- | --- |
| Public blog | http://localhost |
| Admin CMS | http://localhost/admin |
| API | http://localhost/api |
| phpMyAdmin | http://localhost:8081 |

Useful public routes:

- http://localhost/blog
- http://localhost/blog/how-to-learn-golang
- http://localhost/category/programming
- http://localhost/tag/golang
- http://localhost/search?q=laravel
- http://localhost/sitemap.xml
- http://localhost/robots.txt
- http://localhost/feed.xml

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

Scheduled articles are published by the `scheduler` container (`articles:publish-scheduled` every minute). Queue jobs (image processing, cache busting, sitemap refresh, newsletter) run in the `queue` container.

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
```

## Production notes

Local Docker Compose is the development topology. The application does not hard-code infrastructure beyond environment variables, so a later production shape can place Laravel behind a load balancer, keep MySQL and Redis as managed services, and move media to object storage by changing `FILESYSTEM_DISK`.
