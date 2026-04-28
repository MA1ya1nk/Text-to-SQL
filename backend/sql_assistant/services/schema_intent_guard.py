import re


class SchemaIntentGuard:
    STOPWORDS = {
        "a",
        "an",
        "and",
        "are",
        "as",
        "at",
        "by",
        "for",
        "from",
        "get",
        "give",
        "how",
        "in",
        "is",
        "list",
        "me",
        "of",
        "on",
        "show",
        "the",
        "to",
        "what",
        "which",
        "with",
    }

    def _normalize_token(self, token: str) -> str:
        token = token.lower().strip()
        return re.sub(r"[^a-z0-9_]", "", token)

    def _token_variants(self, token: str):
        token = self._normalize_token(token)
        if not token:
            return set()
        variants = {token}
        if token.endswith("s") and len(token) > 3:
            variants.add(token[:-1])
        else:
            variants.add(f"{token}s")
        return variants

    def _build_schema_token_set(self, schema: dict) -> set[str]:
        tokens = set()
        for table_name, table_data in schema.get("tables", {}).items():
            for part in table_name.split("_"):
                if part:
                    tokens.update(self._token_variants(part))
            tokens.update(self._token_variants(table_name))

            for column in table_data.get("columns", []):
                col_name = column.get("name", "")
                if not col_name:
                    continue
                tokens.update(self._token_variants(col_name))
                for part in col_name.split("_"):
                    if part:
                        tokens.update(self._token_variants(part))
        return tokens

    def _table_tokens(self, table_name: str, table_data: dict) -> set[str]:
        tokens = set()
        for part in table_name.split("_"):
            if part:
                tokens.update(self._token_variants(part))
        tokens.update(self._token_variants(table_name))
        for column in table_data.get("columns", []):
            col_name = column.get("name", "")
            if not col_name:
                continue
            tokens.update(self._token_variants(col_name))
            for part in col_name.split("_"):
                if part:
                    tokens.update(self._token_variants(part))
        return tokens

    def _extract_question_tokens(self, question: str) -> set[str]:
        raw_tokens = re.split(r"[\s,.;:!?(){}\[\]<>\"'`/\\|+-]+", question.lower())
        tokens = set()
        for raw in raw_tokens:
            token = self._normalize_token(raw)
            if not token or token in self.STOPWORDS or len(token) < 2:
                continue
            tokens.add(token)
        return tokens

    def can_answer(self, question: str, schema: dict) -> bool:
        schema_tokens = self._build_schema_token_set(schema)
        if not schema_tokens:
            # If schema metadata is not available, do not block the request here.
            return True

        question_tokens = self._extract_question_tokens(question)
        if not question_tokens:
            return False

        matches = 0
        for token in question_tokens:
            if any(variant in schema_tokens for variant in self._token_variants(token)):
                matches += 1

        return matches > 0

    def matched_tables(self, question: str, schema: dict) -> list[str]:
        question_tokens = self._extract_question_tokens(question)
        if not question_tokens:
            return []

        scored = []
        for table_name, table_data in schema.get("tables", {}).items():
            table_tokens = self._table_tokens(table_name, table_data)
            score = 0
            for token in question_tokens:
                if any(variant in table_tokens for variant in self._token_variants(token)):
                    score += 1
            if score > 0:
                scored.append((score, table_name))

        scored.sort(reverse=True)
        return [table for _, table in scored[:4]]


schema_intent_guard = SchemaIntentGuard()
