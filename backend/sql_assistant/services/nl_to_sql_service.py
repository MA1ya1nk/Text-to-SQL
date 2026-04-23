from .llm_client import llm_client


class NLToSQLService:
    def generate(self, question: str, schema_summary: str, dialect: str, context: str = "") -> str:
        if dialect == "sqlite":
            dialect_rules = """
- Generate a single SQLite-compatible SELECT statement only.
- Use SQLite date/time syntax (e.g., date('now', '-1 year'), strftime('%Y-%m', order_date)).
- Do NOT use PostgreSQL-only syntax such as INTERVAL, NOW(), DATE_TRUNC, ILIKE.
"""
        else:
            dialect_rules = """
- Generate a single PostgreSQL-compatible SELECT statement only.
- You may use PostgreSQL date syntax like NOW() and INTERVAL when appropriate.
"""
        prompt = f"""
Schema:
{schema_summary}

Conversation context:
{context or "None"}

Question:
{question}

Rules:
- SQL dialect: {dialect}
{dialect_rules}
- Use joins/aggregation if needed.
- No markdown, no backticks, no commentary.
"""
        return llm_client.complete(prompt=prompt, system="You write safe SQL for analytics.").strip()


nl_to_sql_service = NLToSQLService()
