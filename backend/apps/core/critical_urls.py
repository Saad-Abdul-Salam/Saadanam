"""Single source of truth for the API routes that must always resolve.

Consumed by:
- ``manage.py check_urls`` — the Procfile ``release`` phase; fails the deploy
  if any route is missing, shadowed, or drifted (e.g. a typo, a mistyped
  prefix, or a missing trailing slash).
- ``apps.core.tests_smoke`` — asserts the same list from the normal test
  suite, so regressions are caught locally/CI, not just at deploy time.

Each entry is (exact_path, expected_url_name).
"""

CRITICAL_URLS = [
    # auth
    ('/api/auth/register/', 'register'),
    ('/api/auth/login/', 'login'),
    ('/api/auth/refresh/', 'token_refresh'),
    ('/api/auth/me/', 'me'),
    ('/api/auth/change-password/', 'change-password'),

    # password reset (OTP via email)
    ('/api/auth/password-reset/request/', 'password-reset-request'),
    ('/api/auth/password-reset/verify/', 'password-reset-verify'),
    ('/api/auth/password-reset/confirm/', 'password-reset-confirm'),
]
