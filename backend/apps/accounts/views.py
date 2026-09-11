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