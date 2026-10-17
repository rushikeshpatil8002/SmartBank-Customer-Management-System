from django.urls import path
from apps.beneficiaries.views import BeneficiaryListCreateView, BeneficiaryDetailView

urlpatterns = [
    path('', BeneficiaryListCreateView.as_view(), name='beneficiary_list_create'),
    path('<int:pk>/', BeneficiaryDetailView.as_view(), name='beneficiary_detail'),
]
