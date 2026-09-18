"""Smoke tests: the critical API routes must resolve.

Uses the same CRITICAL_URLS list as the deploy-time ``check_urls`` command,
so a routing regression is caught by the normal test suite as well as the
release phase.
"""

from unittest import mock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.urls import resolve, reverse

from .critical_urls import CRITICAL_URLS


class CriticalUrlSmokeTests(TestCase):
    def test_critical_urls_resolve_to_expected_views(self):
        for url, expected_name in CRITICAL_URLS:
            with self.subTest(url=url):
                match = resolve(url)
                self.assertEqual(match.url_name, expected_name)

    def test_critical_url_names_reverse_to_expected_paths(self):
        for url, expected_name in CRITICAL_URLS:
            with self.subTest(name=expected_name):
                self.assertEqual(reverse(expected_name), url)


class CheckUrlsCommandTests(TestCase):
    def test_command_passes_on_current_urlconf(self):
        # Raises CommandError (non-zero exit) if any critical route is broken.
        call_command('check_urls')

    def test_command_fails_when_route_missing(self):
        broken = CRITICAL_URLS + [('/api/auth/does-not-exist/', 'nope')]
        with mock.patch(
            'apps.core.management.commands.check_urls.CRITICAL_URLS', broken
        ):
            with self.assertRaises(CommandError):
                call_command('check_urls')
