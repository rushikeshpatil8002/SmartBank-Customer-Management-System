from django.contrib import admin
from apps.beneficiaries.models import Beneficiary

@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_display = ('beneficiary_name', 'customer', 'beneficiary_account', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('beneficiary_name', 'customer__full_name', 'beneficiary_account__account_number')
