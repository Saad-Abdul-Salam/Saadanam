from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Shop
from .serializers import ShopSerializer


class MyShopView(generics.RetrieveUpdateAPIView):
    """Shop owner's own business/tax settings — powers the Settings page."""
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.shop