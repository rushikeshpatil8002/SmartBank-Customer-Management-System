from django.urls import path
from apps.banking.views import AccountListCreateView, AccountDetailView, AccountStatusUpdateView

urlpatterns = [
    path('', AccountListCreateView.as_view(), name='account_list_create'),
    path('<int:pk>/', AccountDetailView.as_view(), name='account_detail'),
    path('<int:pk>/status/', AccountStatusUpdateView.as_view(), name='account_status_update'),
]
