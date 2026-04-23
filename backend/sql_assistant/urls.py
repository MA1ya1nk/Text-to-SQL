from django.urls import path

from .views import (
    execute_view,
    explain_view,
    export_excel_view,
    export_view,
    favorite_detail_view,
    favorites_view,
    followup_view,
    history_view,
    preview_view,
    query_view,
    schema_refresh_view,
    schema_suggestions_view,
    schema_view,
)

urlpatterns = [
    path("schema/", schema_view),
    path("schema/refresh/", schema_refresh_view),
    path("schema/suggestions/", schema_suggestions_view),
    path("query/", query_view),
    path("query/followup/", followup_view),
    path("query/preview/", preview_view),
    path("query/execute/", execute_view),
    path("explain/", explain_view),
    path("history/", history_view),
    path("favorites/", favorites_view),
    path("favorites/<int:favorite_id>/", favorite_detail_view),
    path("export/", export_view),
    path("export/excel/", export_excel_view),
]
