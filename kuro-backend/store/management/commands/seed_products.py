import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from store.models import Product, ProductVariant


class Command(BaseCommand):
    help = 'Insercion de productos y variantes de prueba para validación y pruebas de estrés'

    # Plantillas de productos por categoría
    TEMPLATES = {
        'playeras': [
            'Playera Kuro Oversized Edition',
            'Playera Streetwear Gothic Minimal',
            'Playera Cyberpunk Neon Kanji',
            'Playera Acid Wash Vintage Acid',
            'Playera Boxy Fit Heavyweight',
            'Playera Anime Graphic Dark Aesthetic',
            'Playera Retro Wave Kuro Club',
            'Playera Techwear Urban Tactical',
            'Playera Y2K Cyber Grunge',
            'Playera Raw Cotton Monochrome',
        ],
        'sudaderas': [
            'Sudadera Hoodie Kuro Signature 400gsm',
            'Sudadera Zip Hoodie Cyberpunk Dark',
            'Sudadera Crewneck Minimalist Heavy',
            'Sudadera Oversize Kanji Graphic',
            'Sudadera Vintage Washed Charcoal',
            'Sudadera Tactical Urban Fleece',
            'Sudadera Streetwear Crop Fleece',
            'Sudadera Dual Tone Kuro Tech',
        ],
        'gorras': [
            'Gorra Snapback Kuro 3D Embroidery',
            'Gorra Dad Hat Washed Cotton Vintage',
            'Gorra Trucker Mesh Cyber Dark',
            'Gorra 5-Panel Tactical Ripstop',
            'Gorra Beanie Kuro Ribbed Knit',
            'Gorra Bucket Hat Streetwear Reversible',
        ],
        'tazas': [
            'Taza Cerámica Kuro Dark Mode 15oz',
            'Taza Térmica Acero Inoxidable Kuro Pro',
            'Taza Mágica Sensible al Calor Kanji',
            'Taza Esmaltada Vintage Campfire',
            'Taza Mate Negro Minimalist Desk',
        ],
        'shorts_box': [
            'Shorts Box Pro Satin Edition Kuro',
            'Shorts Muay Thai Retro Slit Cut',
            'Shorts Kickboxing Flex Combat',
            'Shorts Sparring Heavyweight Black',
            'Shorts Training Breathable Mesh',
        ],
    }

    PRICE_RANGES = {
        'playeras': (299.00, 549.00),
        'sudaderas': (649.00, 1199.00),
        'gorras': (249.00, 429.00),
        'tazas': (149.00, 299.00),
        'shorts_box': (499.00, 899.00),
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Número total de productos a generar (por defecto: 50)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Elimina los productos existentes antes de sembrar nuevos datos',
        )

    def handle(self, *args, **options):
        total_count = options['count']
        clear_existing = options['clear']

        if clear_existing:
            self.stdout.write(self.style.WARNING('Eliminando productos existentes...'))
            deleted_count, _ = Product.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Se eliminaron {deleted_count} registros.'))

        self.stdout.write(self.style.NOTICE(f'Generando hasta {total_count} productos con sus variantes...'))

        categories = list(self.TEMPLATES.keys())
        clothing_sizes = ['S', 'M', 'L', 'XL']
        accessory_sizes = ['UNI']

        created_products = 0
        created_variants = 0

        with transaction.atomic():
            for i in range(1, total_count + 1):
                category = categories[(i - 1) % len(categories)]
                template_names = self.TEMPLATES[category]
                base_name = template_names[(i - 1) % len(template_names)]

                # Nombre único con sufijo si supera la lista de plantillas
                cycle = (i - 1) // len(template_names)
                name = f"{base_name} Vol. {cycle + 1}" if cycle > 0 else base_name
                slug = slugify(f"{name}-{i}")

                min_price, max_price = self.PRICE_RANGES[category]
                price = Decimal(str(round(random.uniform(min_price, max_price), 2)))

                desc = (
                    f"{name}. Prenda y accesorio oficial de Kuro Custom E-commerce. "
                    f"Fabricado con materiales de alta densidad para máxima durabilidad, "
                    f"corte especializado y acabado premium."
                )

                product, was_created = Product.objects.get_or_create(
                    slug=slug,
                    defaults={
                        'name': name,
                        'description': desc,
                        'price': price,
                        'category': category,
                        'is_customizable': (i % 2 == 0),
                        'image': None,
                    },
                )

                if was_created:
                    created_products += 1

                # Asignar variantes de talla y stock
                target_sizes = clothing_sizes if category in ['playeras', 'sudaderas', 'shorts_box'] else accessory_sizes
                for size in target_sizes:
                    stock_qty = random.randint(25, 150)
                    _, variant_created = ProductVariant.objects.get_or_create(
                        product=product,
                        size=size,
                        defaults={'stock': stock_qty},
                    )
                    if variant_created:
                        created_variants += 1

        self.stdout.write(
            self.style.SUCCESS(
                f' Éxito: {created_products} productos creados y {created_variants} variantes registradas.\n'
                f'  Total en base de datos: {Product.objects.count()} productos y {ProductVariant.objects.count()} variantes.'
            )
        )
