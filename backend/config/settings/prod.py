from .base import *  # noqa
from decouple import config

# Use the pure-Python PyMySQL driver as MySQLdb (see requirements.txt).
# Imported here (not in base) so local SQLite development never needs it.
import pymysql

pymysql.install_as_MySQLdb()

# ---------- Aiven MySQL ----------
# Aiven always requires TLS. If your Aiven service overview offers a CA
# certificate, download it, upload it somewhere Render can read (e.g. a disk
# or a secret file), and point MYSQL_SSL_CA at its path — the connection then
# also verifies the server identity. If unset, the connection is still
# TLS-encrypted but the server certificate is not verified.
DB_OPTIONS = {}
ssl_ca = config('MYSQL_SSL_CA', default='')
if ssl_ca:
    DB_OPTIONS['ssl'] = {'ca': ssl_ca}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('MYSQL_DATABASE'),
        'USER': config('MYSQL_USER'),
        'PASSWORD': config('MYSQL_PASSWORD'),
        'HOST': config('MYSQL_HOST', default='localhost'),
        'PORT': config('MYSQL_PORT', default='3306'),
        'OPTIONS': DB_OPTIONS,
        # Keep the DB session warm; Aiven free tier may idle-kill connections.
        'CONN_MAX_AGE': 60,
    }
}

DEBUG = False

# Render terminates TLS at its proxy and forwards plain HTTP — this tells
# Django the original request was https so generated URLs/redirects are right.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Basic hardening appropriate for a public host.
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
X_FRAME_OPTIONS = 'DENY'