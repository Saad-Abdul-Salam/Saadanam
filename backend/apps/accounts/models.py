from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        email = self.normalize_email(email)

        # First-ever user on the whole platform becomes Platform Admin
        is_first_user = not self.model.objects.exists()
        if is_first_user:
            extra_fields['role'] = User.ROLE_PLATFORM_ADMIN
            extra_fields['is_staff'] = True
            extra_fields['is_superuser'] = True
            extra_fields['is_approved'] = True
        else:
            extra_fields.setdefault('role', User.ROLE_SHOP_OWNER)
            extra_fields.setdefault('is_approved', False)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields['role'] = User.ROLE_PLATFORM_ADMIN
        extra_fields['is_staff'] = True
        extra_fields['is_superuser'] = True
        extra_fields['is_approved'] = True
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_PLATFORM_ADMIN = 'platform_admin'
    ROLE_SHOP_OWNER = 'shop_owner'
    ROLE_CHOICES = [
        (ROLE_PLATFORM_ADMIN, 'Platform Admin'),
        (ROLE_SHOP_OWNER, 'Shop Owner'),
    ]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_SHOP_OWNER)

    is_approved = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.email})"