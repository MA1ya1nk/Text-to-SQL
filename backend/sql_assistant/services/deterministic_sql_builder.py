class DeterministicSQLBuilder:
    def build(self, question: str, dialect: str) -> str | None:
        q = question.lower()

        if "top" in q and ("expensive product" in q or "highest price product" in q):
            if dialect == "sqlite":
                return (
                    "SELECT p.name, p.price, c.name AS category_name "
                    "FROM ecommerce_product p "
                    "LEFT JOIN ecommerce_category c ON p.category_id = c.id "
                    "ORDER BY p.price DESC LIMIT 5"
                )
            return (
                "SELECT p.name, p.price, c.name AS category_name "
                "FROM ecommerce_product p "
                "LEFT JOIN ecommerce_category c ON p.category_id = c.id "
                "ORDER BY p.price DESC LIMIT 5"
            )

        if "top" in q and "customer" in q and ("spend" in q or "revenue" in q):
            return (
                "SELECT c.id, c.first_name, c.last_name, "
                "SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent)) AS total_spend "
                "FROM ecommerce_customer c "
                "JOIN ecommerce_order o ON o.customer_id = c.id "
                "JOIN ecommerce_orderitem oi ON oi.order_id = o.id "
                "GROUP BY c.id, c.first_name, c.last_name "
                "ORDER BY total_spend DESC LIMIT 10"
            )

        if "revenue" in q and ("month" in q or "monthly" in q):
            if dialect == "sqlite":
                return (
                    "SELECT strftime('%Y-%m', o.order_date) AS sale_month, "
                    "SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent)) AS total_revenue "
                    "FROM ecommerce_orderitem oi "
                    "JOIN ecommerce_order o ON o.id = oi.order_id "
                    "GROUP BY strftime('%Y-%m', o.order_date) "
                    "ORDER BY sale_month"
                )
            return (
                "SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS sale_month, "
                "SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent)) AS total_revenue "
                "FROM ecommerce_orderitem oi "
                "JOIN ecommerce_order o ON o.id = oi.order_id "
                "GROUP BY TO_CHAR(o.order_date, 'YYYY-MM') "
                "ORDER BY sale_month"
            )

        return None


deterministic_sql_builder = DeterministicSQLBuilder()
