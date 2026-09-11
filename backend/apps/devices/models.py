from django.db import models


class DeviceSession(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='device_sessions')

    device_label = models.CharField(max_length=200)  # e.g. "Chrome on Windows"
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    refresh_token_jti = models.CharField(max_length=255, unique=True)  # ties session to a specific refresh token

    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # False once force-logged-out or naturally expired

    class Meta:
        ordering = ['-last_active']

    def __str__(self):
        return f"{self.user.email} - {self.device_label}"