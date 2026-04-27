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
    CURRENCY_HINTS = {"revenue", "amount", "price", "cost", "sales", "profit", "spend", "gmv"}
    PERCENT_HINTS = {"percent", "percentage", "ratio", "rate", "pct", "share"}

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

    def _looks_like_metric_name(self, name: str) -> bool:
        return any(hint in name for hint in self.MEASURE_HINTS)

    def _looks_like_dimension_name(self, name: str) -> bool:
        return any(hint in name for hint in self.DIMENSION_HINTS)

    def _infer_y_format(self, y_key: str) -> str:
        name = y_key.lower()
        if any(token in name for token in self.CURRENCY_HINTS):
            return "currency"
        if any(token in name for token in self.PERCENT_HINTS):
            return "percent"
        return "number"

    def _infer_x_type(self, columns, rows, x_key: str) -> str:
        idx = columns.index(x_key)
        values = [row[idx] for row in rows if idx < len(row) and row[idx] is not None]
        if values and any(self._is_date_like(v) for v in values):
            return "time"
        return "category"

    def _build_response(
        self,
        chart_type: str,
        x_key: str | None,
        y_key: str | None,
        columns=None,
        rows=None,
    ):
        x_label = x_key.replace("_", " ").title() if x_key else None
        y_label = y_key.replace("_", " ").title() if y_key else None
        x_type = self._infer_x_type(columns, rows, x_key) if x_key and columns and rows else "category"
        y_format = self._infer_y_format(y_key) if y_key else "number"
        return {
            "type": chart_type,
            "xKey": x_key,
            "yKey": y_key,
            "xLabel": x_label,
            "yLabel": y_label,
            "xType": x_type,
            "yFormat": y_format,
            "sortBy": x_key if x_key else None,
            "sortOrder": "asc",
        }

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

    def _is_measure_chartable(self, columns, rows, measure_column: str) -> bool:
        idx = columns.index(measure_column)
        values = [row[idx] for row in rows if idx < len(row)]
        numeric_values = [value for value in values if self._is_numeric(value)]
        if not numeric_values:
            return False

        numeric_ratio = len(numeric_values) / max(len(values), 1)
        # Avoid plotting mostly non-numeric measure columns.
        if numeric_ratio < 0.7:
            return False

        unique_ratio = len(set(numeric_values)) / max(len(numeric_values), 1)
        name = measure_column.lower()
        # Highly unique "numbers" with ID-like names are usually not useful as measures.
        if self._is_identifier_name(name) and unique_ratio > 0.85:
            return False
        return True

    def _pick_best_dimension_for_measure(self, columns, rows, measure_column: str):
        measure_idx = columns.index(measure_column)
        measure_name = measure_column.lower()
        row_count = len(rows)
        best_col = None
        best_score = float("-inf")

        for idx, column in enumerate(columns):
            if idx == measure_idx:
                continue
            values = [row[idx] for row in rows if idx < len(row)]
            non_null_values = [value for value in values if value is not None]
            if not non_null_values:
                continue

            name = column.lower()
            distinct_ratio = len(set(str(value) for value in non_null_values)) / max(len(non_null_values), 1)
            date_like_count = sum(1 for value in non_null_values if self._is_date_like(value))
            string_count = sum(1 for value in non_null_values if isinstance(value, str))
            numeric_count = sum(1 for value in non_null_values if self._is_numeric(value))

            score = 0.0
            has_date_like = date_like_count > 0
            if has_date_like:
                score += 6.0
            if self._looks_like_dimension_name(name):
                score += 4.0
            if self._is_identifier_name(name):
                score -= 6.0
            # Prefer human-readable dimensions over numeric columns.
            score += 2.5 * (string_count / max(len(non_null_values), 1))
            score -= 1.5 * (numeric_count / max(len(non_null_values), 1))
            # Keep dimensions at a usable granularity for charts.
            if 0.05 <= distinct_ratio <= 0.8:
                score += 2.0
            elif distinct_ratio > 0.95 and row_count >= 8:
                score -= 3.0

            # Avoid selecting semantically similar metric columns as x-axis.
            if self._looks_like_metric_name(name) and not self._looks_like_dimension_name(name):
                score -= 2.0
            if name == measure_name:
                score -= 4.0
            # Prefer stable dimensions like dates/categories for large result sets.
            if row_count > 30 and not has_date_like and distinct_ratio > 0.9:
                score -= 2.0

            if score > best_score:
                best_score = score
                best_col = column

        return best_col

    def detect(self, columns, rows, question: str = ""):
        if not columns or not rows:
            return self._build_response("none", None, None)

        sample_rows = rows[: min(len(rows), 100)]
        y_key = self._pick_measure_column(columns, sample_rows)
        if not y_key:
            return self._build_response("table", None, None)
        if not self._is_measure_chartable(columns, sample_rows, y_key):
            return self._build_response("table", None, None)

        # Prefer line charts for date-like x-axis if present.
        date_dimension = self._pick_best_dimension_for_measure(columns, sample_rows, y_key)
        if date_dimension:
            # If the chosen dimension really has date-like data, use line.
            dim_idx = columns.index(date_dimension)
            dim_values = [row[dim_idx] for row in sample_rows if dim_idx < len(row) and row[dim_idx] is not None]
            if dim_values and any(self._is_date_like(value) for value in dim_values):
                return self._build_response("line", date_dimension, y_key, columns=columns, rows=sample_rows)

        x_key = self._pick_best_dimension_for_measure(columns, sample_rows, y_key)
        if x_key and x_key != y_key:
            q = question.lower()
            if any(token in q for token in ["trend", "over time", "by month", "by day", "monthly", "daily"]):
                return self._build_response("line", x_key, y_key, columns=columns, rows=sample_rows)
            low_rows = len(sample_rows) <= 10
            y_name = y_key.lower()
            pie_friendly = any(token in y_name for token in {"share", "percent", "ratio", "pct"})
            high_cardinality = len({str(row[columns.index(x_key)]) for row in sample_rows if columns.index(x_key) < len(row)}) > 12
            chart_type = "pie" if (low_rows and pie_friendly and not high_cardinality) else "bar"
            return self._build_response(chart_type, x_key, y_key, columns=columns, rows=sample_rows)

        return self._build_response("table", None, None)


chart_detector = ChartDetector()
