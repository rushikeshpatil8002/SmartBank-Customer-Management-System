from django.urls import path
from apps.customers.views import ProfileView

urlpatterns = [
    path('', ProfileView.as_view(), name='user_profile'),
]
