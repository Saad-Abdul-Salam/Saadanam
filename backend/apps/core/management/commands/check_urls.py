"""Fail hard if any critical API route is missing from the URLconf.

Runs in the Render ``release`` phase (see Procfile) so a deploy is aborted
when a route is unregistered — the 404-on-prod class of bug where code is
pushed but the served build predates it, or a URL was renamed/typo'd.

Usage:
    python manage.py check_urls
"""

from django.core.management.base import BaseCommand, CommandError
from django.urls import resolve, reverse

from apps.core.critical_urls import CRITICAL_URLS


class Command(BaseCommand):
    help = 'Verify all critical API routes resolve; exits non-zero if any is missing.'

    def handle(self, *args, **options):
        errors = []

        for url, expected_name in CRITICAL_URLS:
            # 1. The full path must resolve — catches missing includes, typos,
            #    wrong prefixes, and missing trailing slashes.
            try:
                match = resolve(url)
            except Exception:
                errors.append(
                    f'{url}: does not resolve (expected url_name={expected_name!r})'
                )
                continue

            # 2. It must resolve to the route we mean — catches a path being
            #    silently shadowed by some other (e.g. catch-all) pattern.
            if match.url_name != expected_name:
                errors.append(
                    f'{url}: resolved to url_name={match.url_name!r}, '
                    f'expected {expected_name!r}'
                )

            # 3. reverse() must reproduce the literal path — catches drift
            #    between the URL name and the path the frontend calls.
            try:
                actual = reverse(expected_name)
                if actual != url:
                    errors.append(
                        f'{url}: reverse({expected_name!r}) -> {actual!r} (path drift)'
                    )
            except Exception:
                errors.append(
                    f'{url}: reverse({expected_name!r}) failed (name unregistered)'
                )

        if errors:
            for err in errors:
                self.stderr.write(self.style.ERROR(f'  {err}'))
            raise CommandError(
                f'check_urls: {len(errors)} of {len(CRITICAL_URLS)} critical '
                f'routes failed — deploy aborted.'
            )

        self.stdout.write(self.style.SUCCESS(
            f'check_urls: all {len(CRITICAL_URLS)} critical routes resolve correctly.'
        ))
