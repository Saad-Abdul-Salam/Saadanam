web: cd backend && gunicorn config.wsgi:application --workers 3 --bind 0.0.0.0:$PORT --timeout 60
release: cd backend && python manage.py migrate --noinput
