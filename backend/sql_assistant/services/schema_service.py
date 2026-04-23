from django.core.cache import cache
from django.db import connection


class SchemaService:
    CACHE_KEY = "sql_assistant_schema_cache_v2"
    TABLE_PREFIX = "ecommerce_"

    def _is_relevant_table(self, table_name: str) -> bool:
        return table_name.startswith(self.TABLE_PREFIX)

    def get_schema(self):
        cached = cache.get(self.CACHE_KEY)
        if cached:
            return cached

        tables = {}
        fks = []
        pks = []
        with connection.cursor() as cursor:
            if connection.vendor == "sqlite":
                cursor.execute(
                    """
                    SELECT name
                    FROM sqlite_master
                    WHERE type='table'
                      AND name NOT LIKE 'sqlite_%'
                    ORDER BY name;
                    """
                )
                table_names = [row[0] for row in cursor.fetchall() if self._is_relevant_table(row[0])]
                table_set = set(table_names)

                for table in table_names:
                    cursor.execute(f'PRAGMA table_info("{table}");')
                    pragma_cols = cursor.fetchall()
                    cursor.execute(f'PRAGMA index_list("{table}");')
                    index_list = cursor.fetchall()
                    unique_cols = set()
                    for idx in index_list:
                        # PRAGMA index_list returns (seq, name, unique, origin, partial).
                        # unique flag at index 2 is stable for supported sqlite versions.
                        if len(idx) >= 3 and idx[2] == 1:
                            index_name = idx[1]
                            cursor.execute(f'PRAGMA index_info("{index_name}");')
                            for index_col in cursor.fetchall():
                                if len(index_col) >= 3:
                                    unique_cols.add(index_col[2])

                    cols = []
                    for c in pragma_cols:
                        col_name = c[1]
                        is_nullable = c[3] == 0
                        is_pk = c[5] == 1
                        cols.append(
                            {
                                "name": col_name,
                                "type": (c[2] or "").lower(),
                                "nullable": is_nullable,
                                "unique": col_name in unique_cols or is_pk,
                            }
                        )
                        if c[5] == 1:
                            pks.append({"table": table, "column": col_name})

                    cursor.execute(f'PRAGMA foreign_key_list("{table}");')
                    pragma_fks = cursor.fetchall()
                    for fk in pragma_fks:
                        ref_table = fk[2]
                        if ref_table not in table_set:
                            continue
                        fks.append(
                            {
                                "table": table,
                                "column": fk[3],
                                "ref_table": ref_table,
                                "ref_column": fk[4],
                            }
                        )

                    cursor.execute(f'SELECT * FROM "{table}" LIMIT 3;')
                    sample_rows = cursor.fetchall()
                    sample_cols = [c[0] for c in cursor.description] if cursor.description else []
                    cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
                    row_count = cursor.fetchone()[0]
                    tables[table] = {
                        "columns": cols,
                        "row_count": row_count,
                        "sample_rows": sample_rows,
                        "sample_columns": sample_cols,
                    }
            else:
                cursor.execute(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema='public'
                      AND table_name LIKE %s
                    ORDER BY table_name;
                    """,
                    [f"{self.TABLE_PREFIX}%"],
                )
                table_names = [row[0] for row in cursor.fetchall()]

                for table in table_names:
                    cursor.execute(
                        """
                        SELECT kcu.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                          ON tc.constraint_name = kcu.constraint_name
                         AND tc.table_schema = kcu.table_schema
                         AND tc.table_name = kcu.table_name
                        WHERE tc.constraint_type='UNIQUE'
                          AND tc.table_schema='public'
                          AND tc.table_name=%s;
                        """,
                        [table],
                    )
                    unique_cols = {r[0] for r in cursor.fetchall()}

                    cursor.execute(
                        """
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns
                        WHERE table_schema='public' AND table_name=%s
                        ORDER BY ordinal_position;
                        """,
                        [table],
                    )
                    cols = [
                        {
                            "name": r[0],
                            "type": r[1],
                            "nullable": (r[2] == "YES"),
                            "unique": (r[0] in unique_cols),
                        }
                        for r in cursor.fetchall()
                    ]
                    cursor.execute(f'SELECT * FROM "{table}" LIMIT 3;')
                    sample_rows = cursor.fetchall()
                    sample_cols = [c[0] for c in cursor.description] if cursor.description else []
                    cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
                    row_count = cursor.fetchone()[0]
                    tables[table] = {
                        "columns": cols,
                        "row_count": row_count,
                        "sample_rows": sample_rows,
                        "sample_columns": sample_cols,
                    }

                cursor.execute(
                    """
                    SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
                    FROM information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                    WHERE constraint_type = 'FOREIGN KEY'
                      AND tc.table_schema='public'
                      AND tc.table_name LIKE %s
                      AND ccu.table_name LIKE %s;
                    """,
                    [f"{self.TABLE_PREFIX}%", f"{self.TABLE_PREFIX}%"],
                )
                fks = [
                    {"table": r[0], "column": r[1], "ref_table": r[2], "ref_column": r[3]}
                    for r in cursor.fetchall()
                ]
                cursor.execute(
                    """
                    SELECT tc.table_name, kcu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.constraint_type='PRIMARY KEY'
                      AND tc.table_schema='public'
                      AND tc.table_name LIKE %s;
                    """,
                    [f"{self.TABLE_PREFIX}%"],
                )
                pks = [{"table": r[0], "column": r[1]} for r in cursor.fetchall()]
                pk_set = {(pk["table"], pk["column"]) for pk in pks}
                for table, table_data in tables.items():
                    for col in table_data["columns"]:
                        if (table, col["name"]) in pk_set:
                            col["unique"] = True

        result = {"tables": tables, "relationships": {"primary_keys": pks, "foreign_keys": fks}}
        cache.set(self.CACHE_KEY, result, 300)
        return result

    def refresh_schema(self):
        cache.delete(self.CACHE_KEY)
        return self.get_schema()

    def get_schema_summary(self):
        schema = self.get_schema()
        lines = ["Database schema:"]
        for table, data in schema["tables"].items():
            cols = ", ".join([f'{c["name"]} ({c["type"]})' for c in data["columns"]])
            lines.append(f"- {table}: {cols}")
        lines.append("Foreign keys:")
        for fk in schema["relationships"]["foreign_keys"]:
            lines.append(f'- {fk["table"]}.{fk["column"]} -> {fk["ref_table"]}.{fk["ref_column"]}')
        return "\n".join(lines)

    def get_suggestions(self):
        return [
            "Total revenue by month for the last 12 months",
            "Top 10 customers by total spend",
            "Top 20 products by quantity sold",
            "Average order value by customer tier",
            "Cancellation rate by month",
            "Products with highest average review rating (min 20 reviews)",
            "Revenue by category for this quarter",
            "Daily orders for the last 30 days",
            "Countries with the most customers",
            "Repeat customers with more than 10 orders",
        ]


schema_service = SchemaService()
