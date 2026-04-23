from django.db import models


class Customer(models.Model):
    TIER_CHOICES = [("bronze", "Bronze"), ("silver", "Silver"), ("gold", "Gold"), ("platinum", "Platinum")]
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    city = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default="bronze")
    created_at = models.DateTimeField()

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    rating = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField()

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="orders")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    order_date = models.DateTimeField()
    shipped_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Order {self.pk}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="order_items")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.FloatField(default=0.0)

    def __str__(self):
        return f"Item {self.pk} for Order {self.order_id}"


class Review(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="reviews")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(default=5)
    title = models.CharField(max_length=200)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField()
    verified_purchase = models.BooleanField(default=False)

    class Meta:
        unique_together = ("customer", "product")

    def __str__(self):
        return f"Review {self.pk}"
