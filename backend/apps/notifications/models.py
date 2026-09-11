from django.db import models


class Notification(models.Model):
    TYPE_ANNOUNCEMENT = 'announcement'
    TYPE_MAINTENANCE = 'maintenance'
    TYPE_FEATURE = 'feature'
    TYPE_WARNING = 'warning'
    TYPE_CHOICES = [
        (TYPE_ANNOUNCEMENT, 'Announcement'),
        (TYPE_MAINTENANCE, 'Maintenance'),
        (TYPE_FEATURE, 'Feature Update'),
        (TYPE_WARNING, 'Warning'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()

    sent_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='notifications_sent')
    created_at = models.DateTimeField(auto_now_add=True)

    # Empty = broadcast to everyone; otherwise only the listed shops see it.
    target_shops = models.ManyToManyField('shops.Shop', blank=True, related_name='notifications')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class NotificationRead(models.Model):
    """Tracks which shop owner has read which notification."""
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='reads')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notification_reads')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['notification', 'user']