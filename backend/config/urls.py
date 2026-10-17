from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/profile/', include('apps.customers.profile_urls')),
    path('api/v1/customers/', include('apps.customers.urls')),
    path('api/v1/accounts/', include('apps.banking.urls')),
    path('api/v1/transactions/', include('apps.transactions.urls')),
    path('api/v1/beneficiaries/', include('apps.beneficiaries.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('api/v1/dashboard/', include('apps.banking.dashboard_urls')),
]
