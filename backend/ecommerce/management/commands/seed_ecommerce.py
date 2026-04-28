import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from ecommerce.models import Category, Customer, Order, OrderItem, Product, Review


class Command(BaseCommand):
    help = "Seed ecommerce data"

    @transaction.atomic
    def handle(self, *args, **options):
        fake = Faker()
        now = timezone.now()
        start = now - timedelta(days=730)

        self.stdout.write("Clearing old data...")
        Review.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Customer.objects.all().delete()

        self.stdout.write("Creating categories...")
        categories = [
            Category(name=n, description=fake.text(max_nb_chars=80))
            for n in ["Electronics", "Home", "Fashion", "Beauty", "Sports", "Books", "Toys", "Grocery"]
        ]
        Category.objects.bulk_create(categories)
        categories = list(Category.objects.all())

        self.stdout.write("Creating customers...")
        tiers = ["bronze", "silver", "gold", "platinum"]
        customers = []
        for i in range(550):
            created_at = fake.date_time_between(start_date=start, end_date=now, tzinfo=timezone.utc)
            customers.append(
                Customer(
                    email=f"user{i}@example.com",
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    city=fake.city(),
                    country=fake.country(),
                    tier=random.choices(tiers, weights=[45, 30, 20, 5], k=1)[0],
                    created_at=created_at,
                )
            )
        Customer.objects.bulk_create(customers, batch_size=500)
        customers = list(Customer.objects.all())

        self.stdout.write("Creating products...")
        products = []
        for i in range(240):
            created_at = fake.date_time_between(start_date=start, end_date=now, tzinfo=timezone.utc)
            products.append(
                Product(
                    category=random.choice(categories),
                    sku=f"SKU-{100000+i}",
                    name=fake.catch_phrase(),
                    description=fake.text(max_nb_chars=120),
                    price=Decimal(str(round(random.uniform(5, 1500), 2))),
                    stock=random.randint(0, 500),
                    rating=round(random.uniform(2.5, 5.0), 2),
                    is_active=random.random() > 0.05,
                    created_at=created_at,
                )
            )
        Product.objects.bulk_create(products, batch_size=500)
        products = list(Product.objects.all())

        self.stdout.write("Creating orders...")
        statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
        orders = []
        for _ in range(5200):
            order_date = fake.date_time_between(start_date=start, end_date=now, tzinfo=timezone.utc)
            status = random.choices(statuses, weights=[8, 20, 22, 45, 5], k=1)[0]
            shipped_at = order_date + timedelta(days=random.randint(1, 7)) if status in {"shipped", "delivered"} else None
            orders.append(
                Order(
                    customer=random.choice(customers),
                    status=status,
                    total_amount=Decimal("0.00"),
                    order_date=order_date,
                    shipped_at=shipped_at,
                )
            )
        Order.objects.bulk_create(orders, batch_size=1000)
        orders = list(Order.objects.all())

        self.stdout.write("Creating order items...")
        items = []
        order_totals = {}
        for _ in range(10500):
            order = random.choice(orders)
            product = random.choice(products)
            qty = random.randint(1, 5)
            unit = product.price
            discount = random.choice([0, 0, 0, 5, 10, 15])
            items.append(
                OrderItem(order=order, product=product, quantity=qty, unit_price=unit, discount_percent=discount)
            )
            subtotal = unit * qty * Decimal(str(1 - discount / 100))
            order_totals[order.id] = order_totals.get(order.id, Decimal("0.00")) + subtotal
        OrderItem.objects.bulk_create(items, batch_size=1000)

        for order in orders:
            order.total_amount = order_totals.get(order.id, Decimal("0.00")).quantize(Decimal("0.01"))
        Order.objects.bulk_update(orders, ["total_amount"], batch_size=1000)

        self.stdout.write("Creating reviews...")
        seen = set()
        reviews = []
        while len(reviews) < 2200:
            customer = random.choice(customers)
            product = random.choice(products)
            key = (customer.id, product.id)
            if key in seen:
                continue
            seen.add(key)
            reviews.append(
                Review(
                    customer=customer,
                    product=product,
                    rating=random.randint(1, 5),
                    title=fake.sentence(nb_words=6),
                    comment=fake.paragraph(nb_sentences=3),
                    created_at=fake.date_time_between(start_date=start, end_date=now, tzinfo=timezone.utc),
                    verified_purchase=random.random() > 0.35,
                )
            )
        Review.objects.bulk_create(reviews, batch_size=500)

        self.stdout.write(self.style.SUCCESS("Seed complete."))
