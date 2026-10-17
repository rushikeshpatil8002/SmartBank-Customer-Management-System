from django.contrib import admin
from apps.banking.models import BankAccount

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'customer', 'account_type', 'balance', 'status', 'created_at')
    list_filter = ('account_type', 'status', 'currency')
    search_fields = ('account_number', 'customer__full_name', 'customer__user__username')
    readonly_fields = ('account_number', 'created_at', 'updated_at')
