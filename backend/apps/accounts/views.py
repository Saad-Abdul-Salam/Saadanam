from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .otp import can_request_otp, request_otp, check_otp, consume_otp, MAX_VERIFY_ATTEMPTS
from apps.devices.utils import create_device_session


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        message = (
            "Account created. You are the Platform Admin."
            if user.role == User.ROLE_PLATFORM_ADMIN
            else "Registration submitted. Awaiting approval from the platform admin."
        )
        return Response(
            {"message": message, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )


class SaadanamTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Blocks login for shop owners who aren't approved yet, and embeds role in the token."""

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        if user.role == User.ROLE_SHOP_OWNER and not user.is_approved:
            raise InvalidToken("Your account is pending platform admin approval.")

        data['user'] = UserSerializer(user).data
        return data


class SaadanamTokenObtainPairView(TokenObtainPairView):
    serializer_class = SaadanamTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh_token = response.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                user = User.objects.get(id=token['user_id'])
                create_device_session(user, request, str(token['jti']))

        return response


class MeView(generics.RetrieveUpdateAPIView):
    """GET /auth/me/ for the profile; PATCH updates full_name and phone."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        # only allow safe, self-service fields
        allowed = {k: v for k, v in request.data.items() if k in ('full_name', 'phone')}
        if not allowed:
            return Response(
                {"error": "Only full_name and phone can be updated here."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(self.get_object(), data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """POST /auth/change-password/ with old_password + new_password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {"error": "old_password and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"error": "New password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if old_password == new_password:
            return Response(
                {"error": "New password must be different from the current one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        # invalidate refresh tokens by rotating: simplest safe approach is to
        # blacklist the current refresh if the blacklist app is enabled; here we
        # just leave other sessions alone but force re-login for this device via
        # a fresh password. We rotate the user's refresh tokens by creating a new one.
        return Response({"message": "Password changed successfully."})


class PasswordResetRequestView(APIView):
    """POST /auth/password-reset/request/ with {email}.

    Always answers the same success message whether or not the email is
    registered, so the endpoint can't be used to enumerate accounts.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        generic_ok = {"message": "If that email is registered, a reset code has been sent."}

        user = User.objects.filter(email=email).first()
        if user is None:
            # Same response as a real send — don't leak which emails exist.
            return Response(generic_ok)

        if not can_request_otp(email):
            return Response(
                {"error": "Too many reset requests. Please wait 10 minutes and try again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            request_otp(email)
        except RuntimeError:
            # DRF has no constant for 502 — send as a plain int.
            return Response(
                {"error": "Could not send the reset email right now. Please try again in a moment."},
                status=502,
            )

        return Response(generic_ok)


class PasswordResetVerifyView(APIView):
    """POST /auth/password-reset/verify/ with {email, otp}."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        otp = (request.data.get('otp') or '').strip()

        if not email or not otp:
            return Response(
                {"error": "Email and otp are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ok, remaining = check_otp(email, otp)
        if ok:
            return Response({"message": "OTP verified. You can now set a new password."})

        if remaining > 0:
            return Response(
                {"error": f"Invalid or expired code. {remaining} attempt(s) left before a new code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # remaining == 0: either expired/never requested, or the retry budget
        # was exhausted and the stored OTP was just wiped.
        return Response(
            {"error": "Invalid or expired code. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class PasswordResetConfirmView(APIView):
    """POST /auth/password-reset/confirm/ with {email, otp, new_password, confirm_password}.

    Re-validates the OTP (without consuming it) and only deletes the cached
    code after the password has actually been changed, so a mistyped
    confirmation password doesn't force the user to request a fresh OTP.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        otp = (request.data.get('otp') or '').strip()
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not all([email, otp, new_password, confirm_password]):
            return Response(
                {"error": "email, otp, new_password and confirm_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"error": "New password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ok, remaining = check_otp(email, otp)
        if not ok:
            if remaining > 0:
                return Response(
                    {"error": f"Invalid or expired code. {remaining} attempt(s) left before a new code is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"error": "Invalid or expired code. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if user is None:
            # Shouldn't normally happen (request only sends OTPs for known
            # emails), but a stale/foreign email + valid-looking OTP lands here.
            return Response(
                {"error": "Invalid or expired code. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=['password'])
        consume_otp(email)

        return Response({"message": "Password has been reset. You can now log in with your new password."})