"""
Password-reset OTP handling.

OTPs live ONLY in Django's cache (no DB model/table involved) with a 10-minute
expiry. Cache miss = expired or never issued. Two extra cache counters protect
against abuse:

- ``pwd_reset_attempts:{email}``  max 3 OTP *requests* per 10 minutes
- ``pwd_reset_verify:{email}``    max 5 wrong OTP *verifications* before the
                                  stored OTP is wiped and a fresh request is
                                  required (blocks brute-forcing the 6 digits)
"""

import secrets

import resend
from decouple import config
from django.core.cache import cache

# Sandbox sender — swap for a real address once a domain is verified in Resend.
OTP_SENDER = 'Saadanam <onboarding@resend.dev>'
OTP_SUBJECT = 'Your Saadanam password reset code'

OTP_LENGTH = 6
OTP_TTL_SECONDS = 600          # 10 minutes
MAX_REQUESTS_PER_WINDOW = 3    # OTP emails per email per TTL window
MAX_VERIFY_ATTEMPTS = 5        # wrong guesses before forcing a fresh OTP

OTP_CACHE_PREFIX = 'pwd_reset_otp:'
REQUEST_LIMIT_PREFIX = 'pwd_reset_attempts:'
VERIFY_LIMIT_PREFIX = 'pwd_reset_verify:'


def _otp_key(email):
    return f'{OTP_CACHE_PREFIX}{email}'


def _request_key(email):
    return f'{REQUEST_LIMIT_PREFIX}{email}'


def _verify_key(email):
    return f'{VERIFY_LIMIT_PREFIX}{email}'


def can_request_otp(email):
    """True if this email still has OTP-request budget in the current window."""
    return (cache.get(_request_key(email)) or 0) < MAX_REQUESTS_PER_WINDOW


def request_otp(email):
    """Generate a fresh OTP, overwrite any existing one, store it and email it.

    Caller is expected to have checked ``can_request_otp`` first so the
    request-count is only consumed on an actual send attempt.

    Raises RuntimeError if the email could not be sent (Resend failure) so the
    API returns an explicit error instead of pretending the OTP is on its way.
    """
    otp = ''.join(secrets.choice('0123456789') for _ in range(OTP_LENGTH))

    params = {
        'from': OTP_SENDER,
        'to': [email],
        'subject': OTP_SUBJECT,
        'text': (
            f'Your OTP for resetting your Saadanam password is: {otp}\n\n'
            'This code expires in 10 minutes. If you didn\'t request this, '
            'ignore this email.'
        ),
    }

    try:
        resend.api_key = config('RESEND_API_KEY', default='')
        resend.Emails.send(params)
    except Exception as exc:  # noqa: BLE001 — network/HTTP/auth errors all count
        # Don't store the OTP if delivery failed — the user can't receive it,
        # so keeping it (and burning one of their 3 attempts) is pointless.
        raise RuntimeError(f'Failed to send password reset email: {exc}') from exc

    cache.set(_otp_key(email), otp, timeout=OTP_TTL_SECONDS)
    # Count this request against the same 10-minute window as the OTP itself.
    cache.set(
        _request_key(email),
        (cache.get(_request_key(email)) or 0) + 1,
        timeout=OTP_TTL_SECONDS,
    )
    return otp


def check_otp(email, otp):
    """Return (ok, remaining_attempts). Never consumes a correct attempt and
    never deletes the stored OTP — that happens only on successful confirm."""
    stored = cache.get(_otp_key(email))
    if stored is None:
        return False, 0  # expired or never requested

    if otp == stored:
        return True, MAX_VERIFY_ATTEMPTS

    wrong = (cache.get(_verify_key(email)) or 0) + 1
    if wrong >= MAX_VERIFY_ATTEMPTS:
        # Too many wrong guesses — wipe the OTP so brute-forcing is impossible.
        # The user must request a fresh code.
        cache.delete(_otp_key(email))
        cache.delete(_verify_key(email))
        return False, 0

    cache.set(_verify_key(email), wrong, timeout=OTP_TTL_SECONDS)
    return False, MAX_VERIFY_ATTEMPTS - wrong


def consume_otp(email):
    """Called after a successful password change to invalidate the OTP."""
    cache.delete(_otp_key(email))
    cache.delete(_verify_key(email))
