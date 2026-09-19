#!/bin/sh
set -e

cd /var/www/html

echo "Waiting for MySQL..."
attempts=0
until php -r "
try {
    new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD')
    );
    exit(0);
} catch (Throwable \$e) {
    exit(1);
}
" 2>/dev/null; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 40 ]; then
        echo "MySQL was not ready in time."
        exit 1
    fi
    sleep 2
done

echo "MySQL is ready."

if [ ! -f vendor/autoload.php ]; then
    echo "Installing PHP dependencies..."
    composer install --no-interaction --prefer-dist
fi

if [ ! -f .env ]; then
    cp .env.example .env
fi

if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    php artisan key:generate --force
fi

mkdir -p storage/app/public/media storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R ug+rwx storage bootstrap/cache || true

php artisan storage:link --force >/dev/null 2>&1 || true

if [ "$1" = "php-fpm" ]; then
    php artisan migrate --force

    user_count=$(php artisan tinker --execute="echo \App\Models\User::query()->count();" 2>/dev/null || echo "0")
    if [ "$user_count" = "0" ]; then
        echo "Seeding demo data..."
        php artisan db:seed --force
    fi

    echo "Laravel is ready."
else
    echo "Skipping migrate/seed for worker process."
fi

exec "$@"
