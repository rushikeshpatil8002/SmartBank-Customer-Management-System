from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_ADMIN = 'ADMIN'
    ROLE_STAFF = 'STAFF'
    ROLE_CUSTOMER = 'CUSTOMER'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_STAFF, 'Bank Staff'),
        (ROLE_CUSTOMER, 'Customer'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_CUSTOMER,
        help_text="Role determining platform authorization"
    )

    @property
    def is_admin_role(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser

    @property
    def is_staff_role(self):
        return self.role in [self.ROLE_STAFF, self.ROLE_ADMIN] or self.is_staff or self.is_superuser

    @property
    def is_customer_role(self):
        return self.role == self.ROLE_CUSTOMER

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
