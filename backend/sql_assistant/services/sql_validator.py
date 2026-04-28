import re


class SQLValidator:
    BLOCKED = {"DROP", "DELETE", "UPDATE", "INSERT", "ALTER"}
    AGG_FUNCS_PATTERN = r"\b(COUNT|SUM|AVG|MIN|MAX)\s*\("
    TABLE_ALIAS_PATTERN = r"\b(?:FROM|JOIN)\s+([a-zA-Z_][\w]*)\s+(?:AS\s+)?([a-zA-Z_][\w]*)\b"
    QUALIFIED_COLUMN_PATTERN = r"\b([a-zA-Z_][\w]*)\.([a-zA-Z_][\w]*)\b"

    def validate_and_rewrite(self, sql: str, dialect: str = "postgresql") -> str:
        cleaned = re.sub(r"\s+", " ", sql.strip().strip("`"))
        upper = cleaned.upper()

        if ";" in cleaned[:-1]:
            raise ValueError("Multiple statements are not allowed.")
        if any(keyword in upper for keyword in self.BLOCKED):
            raise ValueError("Only read-only SELECT queries are allowed.")
        if not upper.startswith("SELECT"):
            raise ValueError("Query must start with SELECT.")
        if re.search(r"(--|/\*|\*/|xp_|exec\s|\bunion\s+select\b)", upper, flags=re.IGNORECASE):
            raise ValueError("Potential SQL injection pattern detected.")
        if dialect == "sqlite":
            if re.search(r"\bINTERVAL\b|\bDATE_TRUNC\s*\(|\bNOW\s*\(|\bILIKE\b", upper):
                raise ValueError(
                    "Query contains PostgreSQL-specific syntax but current database is SQLite. "
                    "Please rephrase or retry with SQLite-compatible date/filter syntax."
                )
        has_limit = bool(re.search(r"\bLIMIT\b", upper))
        if len(re.findall(r"\bLIMIT\b", upper)) > 1:
            raise ValueError("Query contains duplicate LIMIT clauses.")
        has_group_by = bool(re.search(r"\bGROUP\s+BY\b", upper))
        has_aggregate = bool(re.search(self.AGG_FUNCS_PATTERN, upper))
        is_summary_query = has_group_by or has_aggregate
        if not has_limit and not is_summary_query:
            cleaned = cleaned.rstrip(";") + " LIMIT 1000"
        return cleaned

    def ensure_schema_identifiers(self, sql: str, schema: dict) -> None:
        alias_map = {}
        for table_name, alias in re.findall(self.TABLE_ALIAS_PATTERN, sql, flags=re.IGNORECASE):
            alias_map[alias] = table_name
            alias_map[table_name] = table_name

        tables = schema.get("tables", {})
        table_columns = {
            table_name: {col.get("name") for col in table_data.get("columns", []) if col.get("name")}
            for table_name, table_data in tables.items()
        }

        for alias, column_name in re.findall(self.QUALIFIED_COLUMN_PATTERN, sql):
            table_name = alias_map.get(alias)
            if not table_name:
                continue
            available_columns = table_columns.get(table_name)
            if available_columns is None:
                raise ValueError(f"Generated SQL references unknown table '{table_name}'.")
            if column_name not in available_columns:
                raise ValueError(
                    f"Generated SQL references unknown column '{alias}.{column_name}'. "
                    f"Use real columns from table '{table_name}'."
                )

    def ensure_question_coverage(self, question: str, sql: str, dialect: str = "postgresql") -> None:
        q = question.lower()
        s = sql.lower()

        # Enforce relative-time intent (e.g. "last 12 months").
        relative_time = re.search(r"\blast\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)\b", q)
        if relative_time:
            n = relative_time.group(1)
            unit = relative_time.group(2)
            singular_unit = unit[:-1] if unit.endswith("s") else unit
            has_where = " where " in f" {s} "
            sqlite_pattern = re.search(
                rf"(date|datetime)\(\s*'now'\s*,\s*'-{n}\s+{singular_unit}s?'\s*\)",
                s,
            )
            postgres_pattern = re.search(rf"interval\s+'{n}\s+{singular_unit}s?'", s)
            current_time_anchor = (
                ("now()" in s)
                or ("current_date" in s)
                or ("date('now'" in s)
                or ("datetime('now'" in s)
                or ("julianday('now'" in s)
            )
            # Keep this permissive to avoid false negatives for valid anti-join and derived-date queries.
            if not has_where or not (sqlite_pattern or postgres_pattern or current_time_anchor):
                raise ValueError(
                    f"Generated SQL missed required relative time filter: last {n} {unit}. "
                    "Include a WHERE condition matching that time window."
                )

            # For "last N months grouped by month", avoid inclusive cutoffs that often produce N+1 buckets.
            month_grouping_requested = ("by month" in q or "grouped by month" in q)
            if singular_unit == "month" and month_grouping_requested:
                n_int = int(n)
                if dialect == "sqlite":
                    raw_month_cutoff = re.search(
                        rf"date\(\s*'now'\s*,\s*'-{n_int}\s+months?'\s*\)",
                        s,
                    )
                    uses_month_boundary_window = (
                        "start of month" in s
                        and (f"-{max(n_int - 1, 0)} month" in s or f"-{max(n_int - 1, 0)} months" in s)
                    )
                    if raw_month_cutoff and not uses_month_boundary_window:
                        raise ValueError(
                            "For 'last N months grouped by month' in SQLite, use month boundaries "
                            "(e.g., >= date('now','start of month','-(N-1) months')) to avoid N+1 buckets."
                        )
                    wrong_upper_bound = bool(
                        re.search(r"<\s*date\(\s*'now'\s*,\s*'start of month'\s*\)", s)
                    )
                    if wrong_upper_bound:
                        raise ValueError(
                            "For 'last N months grouped by month' in SQLite, use upper bound "
                            "< date('now','start of month','+1 month') so current month is included."
                        )
                else:
                    if "date_trunc('month'" not in s:
                        raise ValueError(
                            "For 'last N months grouped by month' in PostgreSQL, use date_trunc('month', ...)"
                        )

        # Enforce requested date bucketing.
        if "by month" in q or "grouped by month" in q:
            has_month_bucket = (
                "strftime('%y-%m'" in s
                or "strftime('%Y-%m'" in sql
                or "date_trunc('month'" in s
            )
            if "group by" not in s or not has_month_bucket:
                raise ValueError("Generated SQL must group by month as requested.")

        # Enforce year-over-year (same-month previous-year) comparison semantics.
        yoy_requested = bool(
            re.search(
                r"same\s+month\s+last\s+year|previous\s+year|year[-\s]*over[-\s]*year|\byoy\b|last\s+year",
                q,
            )
        )
        if yoy_requested and ("by month" in q or "grouped by month" in q or "monthly" in q):
            has_year_shift_join_sqlite = bool(
                re.search(r"date\(\s*[^)]+,\s*'-1\s+year'\s*\)", s)
            )
            has_year_shift_join_pg = bool(
                re.search(r"interval\s+'1\s+year'|-\s*interval\s+'1\s+year'", s)
            )
            has_self_join_hint = (" join " in s and ("prev" in s or "last_year" in s or "ly" in s))
            has_single_fixed_prev_year_month = bool(
                re.search(
                    r"strftime\(\s*'%y'\s*,\s*date\(\s*'now'\s*,\s*'-1\s+year'\s*\)\s*\)|"
                    r"strftime\(\s*'%Y'\s*,\s*date\(\s*'now'\s*,\s*'-1\s+year'\s*\)\s*\)",
                    s,
                )
            ) and "group by" in s

            if has_single_fixed_prev_year_month:
                raise ValueError(
                    "For month-wise previous-year comparison, align each month to its own -1 year month "
                    "(e.g., self-join on shifted month key), not a fixed month derived from now()."
                )

            if not ((has_year_shift_join_sqlite or has_year_shift_join_pg) and has_self_join_hint):
                raise ValueError(
                    "For month-wise previous-year comparison, SQL must align each month to same month last year "
                    "using a year-shifted join (or equivalent keyed correlation)."
                )

        # Enforce anti-join semantics for "no orders / haven't ordered" questions.
        is_absence_question = bool(
            re.search(
                r"(haven't|have not|hasn't|has not|without|no)\s+.*order|customers?\s+who\s+did\s+not\s+order",
                q,
            )
        )
        if is_absence_question:
            has_not_exists = "not exists" in s
            has_left_join_null = "left join" in s and " is null" in s
            if not (has_not_exists or has_left_join_null):
                raise ValueError(
                    "For 'no orders' questions, use anti-join semantics (NOT EXISTS or LEFT JOIN ... IS NULL)."
                )
            if re.search(r"\bis\s+null\s+or\b", s):
                raise ValueError(
                    "Avoid OR logic with IS NULL for absence queries; it can include customers with recent orders."
                )


sql_validator = SQLValidator()
