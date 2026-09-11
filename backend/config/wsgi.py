import os
from django.core.wsgi import get_wsgi_application

# Render sets DJANGO_SETTINGS_MODULE=config.settings.prod; locally this falls
# back to the SQLite dev settings.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
application = get_wsgi_application()