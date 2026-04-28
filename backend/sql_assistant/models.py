from django.db import models


class QueryHistory(models.Model):
    question = models.TextField()
    sql_query = models.TextField()
    explanation = models.TextField(blank=True)
    result_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Favorite(models.Model):
    title = models.CharField(max_length=200)
    question = models.TextField()
    sql_query = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
