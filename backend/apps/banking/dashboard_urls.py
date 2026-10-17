from django.urls import path
from apps.banking.views import DashboardSummaryView

urlpatterns = [
    path('', DashboardSummaryView.as_view(), name='dashboard_summary'),
]
