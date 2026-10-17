from django.contrib import admin
from apps.customers.models import CustomerProfile

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'phone_number', 'created_at')
    search_fields = ('full_name', 'user__username', 'phone_number')
    list_filter = ('created_at',)
