from rest_framework import serializers

from .models import Favorite, QueryHistory


class QueryRequestSerializer(serializers.Serializer):
    question = serializers.CharField()


class FollowUpRequestSerializer(serializers.Serializer):
    question = serializers.CharField()
    context = serializers.CharField(required=False, allow_blank=True)


class ExplainRequestSerializer(serializers.Serializer):
    sql = serializers.CharField()
    question = serializers.CharField(required=False, allow_blank=True)


class ExecuteSQLRequestSerializer(serializers.Serializer):
    question = serializers.CharField()
    sql = serializers.CharField()


class FavoriteRequestSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    question = serializers.CharField()
    sql_query = serializers.CharField()


class QueryHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QueryHistory
        fields = "__all__"


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = "__all__"
