# Lather E-Market Backend (NestJS)

Scalable e-commerce backend for weather-related fashion products using NestJS + MongoDB with modular MVC-inspired structure.

## Architecture

Each module follows:
- `controllers/` (admin and user routes)
- `requests/` (DTO validations)
- `services/` (business logic)
- `repositories/` (data access)
- `resources/` (response shaping)

## Modules

- Auth (JWT)
- Users
- Categories
- Products
- Cart
- Orders
- Analytics
- Reviews (placeholder)
- Wishlist (placeholder)
- Notifications (placeholder)

## Product listing API

`GET /api/products`

Query params:
- `gender`
- `category`
- `size`
- `color`
- `price=low_to_high|high_to_low`
- `sort=asc|desc`

Additional listing routes:
- `GET /api/products/latest`
- `GET /api/products/sale`
- `GET /api/products/popular`

## Order calculations

When placing order:
- Tax: 8%
- Delivery charge: 120 (free if subtotal > 3000)

## Run

```bash
npm install
cp .env.example .env
npm run start:dev
```
