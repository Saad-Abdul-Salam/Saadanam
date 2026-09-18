"""Shared transactional email sending via Resend.

All outbound email goes through ``send_email`` so the Resend API call, the
sender identity, and API-key handling live in exactly one place.

Failure policy is up to the caller:
- password-reset OTP: failure must surface as an explicit API error (the user
  can't receive a code that was never sent), so the caller re-raises.
- account-approved notification: email is best-effort; the caller logs the
  failure and lets the main action succeed anyway.
"""

import resend
from decouple import config

# Sandbox sender — swap for a real address once a domain is verified in Resend.
DEFAULT_SENDER = 'Saadanam <onboarding@resend.dev>'


def send_email(to, subject, body, sender=DEFAULT_SENDER):
    """Send a plain-text email via Resend. Returns the Resend response dict.

    Raises on any failure (network/HTTP/auth) — callers decide whether that
    is fatal or should be logged and swallowed.
    """
    params = {
        'from': sender,
        'to': [to] if isinstance(to, str) else list(to),
        'subject': subject,
        'text': body,
    }
    resend.api_key = config('RESEND_API_KEY', default='')
    return resend.Emails.send(params)
