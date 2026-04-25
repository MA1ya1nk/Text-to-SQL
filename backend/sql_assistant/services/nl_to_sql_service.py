from .llm_client import llm_client


class NLToSQLService:
    def generate(self, question: str, schema_summary: str, dialect: str) -> str:
        if dialect == "sqlite":
            dialect_rules = """
- Use only SQLite-compatible syntax.
- For month bucketing use strftime('%Y-%m', <date_col>).
- Do NOT use PostgreSQL-only syntax such as INTERVAL, NOW(), DATE_TRUNC, ILIKE.
"""
        else:
            dialect_rules = """
- Use only PostgreSQL-compatible syntax.
"""
        prompt = f"""
Task:
Convert the natural-language question into one accurate SQL query.

Schema (source of truth):
{schema_summary}

Question:
{question}

Rules:
- SQL dialect: {dialect}
{dialect_rules}
- Return exactly one SELECT query and nothing else.
- Use only tables/columns present in Schema.
- Choose joins based on declared foreign keys in Schema.
- Apply filters only when requested by the question.
- For categorical/text filters, use exact literals from schema summary (case-sensitive).
- If question asks "each/by per", include appropriate GROUP BY.
- If question asks top/bottom N, include ORDER BY + LIMIT N.
- Do not invent columns, tables, or values.
- No markdown, no backticks, no explanations.
"""
        return llm_client.complete(
            prompt=prompt,
            system=(
                "You are a senior text-to-SQL engine. "
                "Generate a faithful, question-specific analytical SELECT query from the provided schema only."
            ),
        ).strip()


nl_to_sql_service = NLToSQLService()
