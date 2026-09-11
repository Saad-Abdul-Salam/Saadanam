from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    purchaseId = serializers.IntegerField(source='purchase_id', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'category', 'amount', 'date', 'note', 'purchaseId']