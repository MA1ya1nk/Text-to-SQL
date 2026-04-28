from .llm_client import llm_client


class QueryExplainer:
    def explain(self, sql: str, question: str = "") -> str:
        prompt = f"""
Original business question:
{question or "Not provided"}

SQL query:
{sql}

Write a business-friendly explanation for a non-technical analyst.

Strict requirements:
- Do NOT define SQL or add tutorial content.
- Do NOT use markdown headings, bullets, or code fences.
- Keep it short (4-6 sentences total).
- Mention exactly:
  1) the business intent,
  2) the data source/tables,
  3) key filters/conditions,
  4) any sorting/grouping/limit if present.
- Use concrete wording from the query (e.g., rating = 5.0, name = 'washing machine').
- End with one practical business takeaway sentence.
"""
        return llm_client.complete(
            prompt,
            system="You explain SQL results for business analysts in clear plain English.",
        ).strip()


query_explainer = QueryExplainer()
