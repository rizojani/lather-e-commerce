## Top-Level Structure

```text
lather-e-market-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   └── types/
│   │
│   ├── types/
│   │   └── express.d.ts
│   │
│   ├── controllers/                    # all files: *.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── admin-categories.controller.ts
│   │   ├── user-categories.controller.ts
│   │   ├── admin-products.controller.ts
│   │   ├── user-products.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── user-orders.controller.ts
│   │   ├── admin-orders.controller.ts
│   │   └── admin-analytics.controller.ts
│   │
│   ├── services/                       # all files: *.service.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── users.service.ts
│   │   ├── categories.service.ts
│   │   ├── products.service.ts
│   │   ├── cart.service.ts
│   │   ├── orders.service.ts
│   │   └── analytics.service.ts
│   │
│   ├── repositories/                   # all files: *.repository.ts
│   │   ├── users.repository.ts
│   │   ├── categories.repository.ts
│   │   ├── products.repository.ts
│   │   ├── cart.repository.ts
│   │   └── orders.repository.ts
│   │
│   ├── dto/                            # module-wise subdirectories
│   │   ├── auth/
│   │   │   ├── login.auth.dto.ts
│   │   │   └── register.auth.dto.ts
│   │   ├── users/
│   │   │   └── create-user.users.dto.ts
│   │   ├── products/
│   │   │   ├── create-product.products.dto.ts
│   │   │   └── product-list.products.dto.ts
│   │   ├── cart/
│   │   │   └── update-cart.cart.dto.ts
│   │   └── orders/
│   │       └── place-order.orders.dto.ts
│   │
│   ├── resources/
│   │   ├── auth.resource.ts
│   │   ├── user.resource.ts
│   │   └── product.resource.ts
│   │
│   ├── schemas/
│   │   ├── user.schema.ts
│   │   ├── category.schema.ts
│   │   ├── product.schema.ts
│   │   ├── cart.schema.ts
│   │   └── order.schema.ts
│   │
│   └── modules/                        # module definition files only
│       ├── auth.module.ts
│       ├── users.module.ts
│       ├── categories.module.ts
│       ├── products.module.ts
│       ├── cart.module.ts
│       ├── orders.module.ts
│       ├── analytics.module.ts
│       ├── reviews.module.ts
│       ├── wishlist.module.ts
│       └── notifications.module.ts
│
├── dist/
├── node_modules/
├── .env.example
├── FOLDER_STRUCTURE.md
├── README.md
├── nest-cli.json
├── package.json
├── package-lock.json
├── tsconfig.build.json
├── tsconfig.json
```
```
