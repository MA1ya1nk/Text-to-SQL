from .llm_client import llm_client


class NLToSQLService:
    def generate(
        self,
        question: str,
        schema_summary: str,
        dialect: str,
        correction_hint: str = "",
    ) -> str:
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
        semantic_rules = """
- Use only tables/columns present in Schema; never invent names.
- Join tables only through declared foreign-key relationships listed in Schema.
- Respect table aliases strictly: when alias `o` maps to `ecommerce_order`, use only columns from `ecommerce_order` on `o` (e.g., `o.id`, not `o.order_id`).
- Return exactly one SELECT query and nothing else.
- Apply filters only when requested by the question.
- For categorical/text filters, use exact literals from schema summary (case-sensitive).
- If question asks "each/by per", include appropriate GROUP BY.
- If question asks top/bottom N, include ORDER BY + LIMIT N.
- If question includes a time window like "last N days/weeks/months/years", include a matching date filter in WHERE.
- If question asks grouped by month/quarter/year/day, group by the corresponding date bucket.
- Interpret "last N months grouped by month" as current month plus previous (N-1) months (exactly N buckets).
- For "last N months grouped by month", use month-boundary filters (not a raw >= now-N-months cutoff).
- SQLite pattern for "last N months grouped by month": lower bound on start-of-month with -(N-1) months and exclusive upper bound at next month start (+1 month), so current month is included.
- For "compare with same month last year" / "previous year" / "YoY": aggregate by month first, then align each month with its shifted month (e.g., current_month joined to current_month - 1 year). Do NOT compare against one fixed month tied to now().
- For "haven't/without/no orders in last N days" style questions, use anti-join semantics (prefer NOT EXISTS with a recent-window condition), not OR logic over old rows.
- If metric wording is ambiguous or impossible from schema, use the closest valid metric name.
- In this schema, discount_percent stores percentage points (e.g., 5, 10, 15), so discount math must use discount_percent/100.
- No markdown, no backticks, no explanations.
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
{semantic_rules}
{f"- Fix requirement from previous attempt: {correction_hint}" if correction_hint else ""}
"""
        return llm_client.complete(
            prompt=prompt,
            system=(
                "You are a senior text-to-SQL engine. "
                "Generate a faithful, question-specific analytical SELECT query from the provided schema only."
            ),
        ).strip()


nl_to_sql_service = NLToSQLService()
