from django.urls import path
from apps.transactions.views import (
    TransactionListView, TransactionDetailView,
    DepositView, WithdrawalView, TransferView,
    ExportStatementCSVView
)

urlpatterns = [
    path('', TransactionListView.as_view(), name='transaction_list'),
    path('deposit/', DepositView.as_view(), name='transaction_deposit'),
    path('withdraw/', WithdrawalView.as_view(), name='transaction_withdraw'),
    path('transfer/', TransferView.as_view(), name='transaction_transfer'),
    path('export-csv/', ExportStatementCSVView.as_view(), name='statement_export_csv'),
    path('<int:pk>/', TransactionDetailView.as_view(), name='transaction_detail'),
]
