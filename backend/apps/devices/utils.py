from user_agents import parse as parse_ua
from .models import DeviceSession


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def build_device_label(request):
    ua_string = request.META.get('HTTP_USER_AGENT', '')
    ua = parse_ua(ua_string)
    browser = ua.browser.family or 'Unknown Browser'
    os_name = ua.os.family or 'Unknown OS'
    return f"{browser} on {os_name}"


def create_device_session(user, request, refresh_token_jti):
    DeviceSession.objects.create(
        user=user,
        device_label=build_device_label(request),
        ip_address=get_client_ip(request),
        refresh_token_jti=refresh_token_jti,
    )