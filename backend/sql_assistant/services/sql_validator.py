import re


class SQLValidator:
    BLOCKED = {"DROP", "DELETE", "UPDATE", "INSERT", "ALTER"}

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
        if not has_limit:
            cleaned = cleaned.rstrip(";") + " LIMIT 1000"
        return cleaned


sql_validator = SQLValidator()
