from django.contrib import admin

from .models import Favorite, QueryHistory

admin.site.register(QueryHistory)
admin.site.register(Favorite)
