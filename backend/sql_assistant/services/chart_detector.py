from datetime import date, datetime
from decimal import Decimal


class ChartDetector:
    MEASURE_HINTS = {
        "revenue",
        "amount",
        "total",
        "price",
        "cost",
        "count",
        "qty",
        "quantity",
        "sales",
        "profit",
        "rate",
        "score",
        "rating",
        "avg",
        "average",
        "sum",
    }
    DIMENSION_HINTS = {"name", "title", "category", "type", "segment", "month", "day", "date"}

    def _is_numeric(self, value) -> bool:
        return isinstance(value, (int, float, Decimal)) and not isinstance(value, bool)

    def _is_date_like(self, value) -> bool:
        if isinstance(value, (date, datetime)):
            return True
        if not isinstance(value, str):
            return False
        text = value.strip()
        if not text:
            return False
        try:
            datetime.fromisoformat(text.replace("Z", "+00:00"))
            return True
        except Exception:
            return False

    def _is_identifier_name(self, column_name: str) -> bool:
        name = column_name.lower()
        return name == "id" or name.endswith("_id")

    def _pick_measure_column(self, columns, rows):
        row_count = len(rows)
        best_col = None
        best_score = float("-inf")
        for idx, column in enumerate(columns):
            values = [row[idx] for row in rows if idx < len(row)]
            numeric_values = [value for value in values if self._is_numeric(value)]
            if not numeric_values:
                continue

            name = column.lower()
            unique_ratio = (len(set(numeric_values)) / max(len(numeric_values), 1))
            score = 0.0
            if any(hint in name for hint in self.MEASURE_HINTS):
                score += 8.0
            if self._is_identifier_name(name):
                score -= 10.0
            if "year" in name:
                score -= 2.0
            # Highly unique numeric columns often behave like IDs rather than measures.
            if unique_ratio > 0.95 and row_count >= 8:
                score -= 2.0
            # Columns with repeated values are often better for aggregations/charts.
            if unique_ratio < 0.85:
                score += 1.5
            # Prefer columns where most rows are numeric.
            score += (len(numeric_values) / max(len(values), 1))

            if score > best_score:
                best_score = score
                best_col = column

        return best_col

    def _pick_dimension_column(self, columns, rows, preferred_date=False):
        best_col = None
        best_score = float("-inf")
        for idx, column in enumerate(columns):
            values = [row[idx] for row in rows if idx < len(row)]
            non_null_values = [value for value in values if value is not None]
            if not non_null_values:
                continue

            name = column.lower()
            date_like_count = sum(1 for value in non_null_values if self._is_date_like(value))
            string_count = sum(1 for value in non_null_values if isinstance(value, str))
            distinct_ratio = len(set(str(value) for value in non_null_values)) / max(len(non_null_values), 1)
            avg_text_len = (
                sum(len(str(value)) for value in non_null_values) / max(len(non_null_values), 1)
            )

            score = 0.0
            if preferred_date and date_like_count > 0:
                score += 7.0
            if any(hint in name for hint in self.DIMENSION_HINTS):
                score += 4.0
            if self._is_identifier_name(name):
                score -= 5.0
            if date_like_count > 0:
                score += 3.0
            if string_count > 0:
                score += 2.0
            if avg_text_len > 60:
                score -= 3.0
            # Too unique can be noisy labels; too low distinct isn't useful either.
            if 0.15 <= distinct_ratio <= 0.95:
                score += 1.5

            if score > best_score:
                best_score = score
                best_col = column

        return best_col

    def detect(self, columns, rows):
        if not columns or not rows:
            return {"type": "none", "xKey": None, "yKey": None}

        sample_rows = rows[: min(len(rows), 100)]
        y_key = self._pick_measure_column(columns, sample_rows)
        if not y_key:
            return {"type": "table", "xKey": None, "yKey": None}

        # Prefer line charts for date-like x-axis if present.
        date_dimension = self._pick_dimension_column(columns, sample_rows, preferred_date=True)
        if date_dimension:
            # If the chosen dimension really has date-like data, use line.
            dim_idx = columns.index(date_dimension)
            dim_values = [row[dim_idx] for row in sample_rows if dim_idx < len(row) and row[dim_idx] is not None]
            if dim_values and any(self._is_date_like(value) for value in dim_values):
                return {"type": "line", "xKey": date_dimension, "yKey": y_key}

        x_key = self._pick_dimension_column(columns, sample_rows, preferred_date=False)
        if x_key and x_key != y_key:
            low_rows = len(sample_rows) <= 10
            y_name = y_key.lower()
            pie_friendly = any(token in y_name for token in {"share", "percent", "ratio", "pct"})
            chart_type = "pie" if (low_rows and pie_friendly) else "bar"
            return {"type": chart_type, "xKey": x_key, "yKey": y_key}

        return {"type": "table", "xKey": None, "yKey": None}


chart_detector = ChartDetector()
