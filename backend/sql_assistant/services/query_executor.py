from django.db import connection


class QueryExecutor:
    def execute(self, sql: str):
        with connection.cursor() as cursor:
            if connection.vendor == "postgresql":
                cursor.execute("SET LOCAL statement_timeout = 10000;")
            cursor.execute(sql)
            rows = cursor.fetchall()
            columns = [c[0] for c in cursor.description] if cursor.description else []
        return {"columns": columns, "rows": rows}


query_executor = QueryExecutor()
