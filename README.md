# Threadline: Clothing & Fashion E-Commerce

My submission for the **DartCodes Software Engineer Intern technical assessment** (scenario: *Clothing & Fashion Store*).

Threadline is a responsive online clothing store. It has a customer storefront, an admin panel, PayHere Sandbox online payments and an "Order via WhatsApp" checkout option.

| | |
|---|---|
| **Live application** |  |
| **Admin panel** |  |
| **Repository** |  |

---

## Contents
1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Running it locally](#running-it-locally)
4. [Deployment](#deployment)
5. [Architecture](#architecture)
6. [Database design](#database-design)
7. [Order lifecycle & inventory](#order-lifecycle--inventory)
8. [PayHere integration](#payhere-integration)
9. [WhatsApp order flow](#whatsapp-order-flow)
10. [Security approach](#security-approach)
11. [Key technical decisions](#key-technical-decisions)
12. [Assumptions & limitations](#assumptions--limitations)

---

## Features

### Customer store
- **Home page:** hero, new arrivals with category tabs, category tiles and a bulk-order banner.
- **Shop page:**
  - Search, and filters for category, size, colour, price range, new arrivals and sale items.
  - Sorting and pagination.
  - Filters are stored in the URL, so a filtered view can be shared, bookmarked or reached with the back button.
- **Product page:** an image gallery, colour swatches, and stock shown per size ("Only 3 left", "Sold out"). There are two ways to buy:
  - **One size:** the normal size + quantity picker.
  - **Multiple sizes:** a size/quantity grid for larger orders. For example, Black M × 10 and L × 5, then switch colour and add White M × 8. All 23 pieces go into the cart in one click.
- **Bulk discount**, applied automatically: 10% off 10+ pieces of the same style, 15% off 25+. Sizes and colours are counted together.
- **Cart:** a slide-out drawer. It's saved in the browser, so it survives a page refresh.
- **Delivery:** a flat fee, free over Rs 15,000.
- **Guest checkout** with two options: **Pay online with PayHere** or **Order via WhatsApp**.
- **Order confirmation page** and an **order tracking page** (order number + mobile number).

### Admin panel (`/admin`)
- **Dashboard:**
  - Revenue for the last 30 days.
  - Orders waiting to be confirmed or fulfilled.
  - Low-stock variants and recent orders.
  - A warning if a paid order couldn't be fulfilled from stock.
- **Orders:**
  - Filter by status and payment method, and search by order number, name, phone or email.
  - Move orders through their lifecycle.
  - Record payment for WhatsApp orders and message the customer on WhatsApp.
- **Products:**
  - Create, edit and delete products, and show or hide them in the store.
  - Upload images, then reorder or remove them.
  - A variant generator: pick sizes and colours, and every combination is created with an SKU.
- **Inventory:** every size/colour variant in one table, with inline stock editing and a low-stock view.
- **Categories:** add and rename categories. A category can't be deleted while it still has products.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, self-hosted Jost + Inter fonts |
| Database | PostgreSQL (Neon in production) |
| ORM | Prisma 7 with the `pg` driver adapter |
| Validation | Zod |
| Forms | React Hook Form |
| Cart state | Zustand (persisted to `localStorage`) |
| Admin authentication | `jose` (signed JWT in an httpOnly cookie) + `bcryptjs` |
| Image uploads | Uploadthing |
| Payments | PayHere Checkout API (Sandbox) |
| Hosting | Vercel |

---

## Running it locally

**Requirements:**
- Node.js 20.9 or newer.
- A PostgreSQL database: local, or a free [Neon](https://neon.tech) project.

```bash
git clone https://github.com/YOUR-USERNAME/threadline.git
cd threadline
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in the values (see below)
npx prisma migrate dev      # creates the tables
npx prisma db seed          # sample categories, products, variants and the admin user
npm run dev
```

Store: http://localhost:3000 · Admin: http://localhost:3000/admin

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | At least 32 random characters. Signs admin sessions and order links. |
| `APP_URL` | Public URL of the site. Used for the PayHere return, cancel and notify URLs. |
| `PAYHERE_MERCHANT_ID` | PayHere sandbox merchant ID |
| `PAYHERE_MERCHANT_SECRET` | PayHere merchant secret for the domain in `APP_URL` |
| `PAYHERE_SANDBOX` | `true` to use the sandbox |
| `WHATSAPP_NUMBER` | Business WhatsApp number in international format without `+`, e.g. `94771234567` |
| `UPLOADTHING_TOKEN` | Uploadthing API token (only needed for image uploads) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by the seed script to create the first admin account |

All of these are validated when the app starts (`src/lib/env.ts`). A missing or wrongly formatted value stops the app with a clear error.

> **Note:** PayHere can't send payment notifications to `localhost`. To test the full payment flow, use the deployed site, or a tunnel such as ngrok with `APP_URL` set to the tunnel address.

---

## Deployment

The app is deployed on **Vercel**, with the database on **Neon**.

1. **Database**
   - Create a Neon project.
   - Using the **direct** connection string, run `npx prisma migrate deploy` and then `npx prisma db seed` once.
2. **Vercel**
   - Import the GitHub repository and add the environment variables above.
   - Use Neon's **pooled** connection string for `DATABASE_URL`, and set `APP_URL` to the Vercel URL.
3. **PayHere**
   - In the sandbox dashboard, go to *Settings → Domains & Credentials* and add the Vercel domain.
   - Copy the merchant secret generated for that domain into `PAYHERE_MERCHANT_SECRET`, then redeploy.

**Testing a payment:** in the sandbox, use the Visa test card `4916217501611292` (or Mastercard `5307732125531191`). Any name, CVV and future expiry date works.

---

## Architecture

```
Browser ──► Next.js (Vercel) ───────────────────────────────► PostgreSQL (Neon)
             ├─ Server Components    render pages, read data with Prisma
             ├─ Route Handlers
             │    POST /api/orders            place an order (guest checkout)
             │    POST /api/payhere/notify    PayHere server-to-server callback
             │    GET|POST /api/uploadthing   admin image uploads
             ├─ Server Actions       admin operations, login, order tracking
             └─ proxy.ts             redirects signed-out users away from /admin
```

- **Pages read data in Server Components.** This keeps the catalogue fast and SEO-friendly, with no extra API round trip.
- **Checkout and payment confirmation are REST endpoints.** They're called by the browser and by PayHere, so they have clear contracts and status codes:

  | Code | Meaning |
  |---|---|
  | `201` | Created |
  | `400` | Malformed request |
  | `409` | Cart out of date |
  | `422` | Validation failed |

- **Admin operations are Server Actions.** Each action is still a public POST endpoint underneath, so each one checks the admin session itself.
- **Business rules live in `src/lib/services`.** Order creation, status changes and stock movements are there rather than in UI components, so the same rules apply wherever an action starts.

### Project structure
```
prisma/
  schema.prisma          database schema
  seed.ts                sample data + first admin user
src/
  proxy.ts               /admin redirect (Next.js 16 name for middleware)
  app/
    (store)/             home, shop, product, checkout, order, track
    admin/(auth)/        admin login
    admin/(panel)/       dashboard, orders, products, inventory, categories
    api/                 orders, payhere/notify, uploadthing
  components/
    ui/                  buttons, inputs, drawer
    store/               storefront components
    admin/               admin components
  lib/
    services/            order + inventory logic
    auth/                session token and cookie helpers
    payhere.ts           hash generation and notification verification
    whatsapp.ts          WhatsApp message builder
    pricing.ts           totals, bulk discount, delivery fee
    validations.ts       Zod schemas
    order-token.ts       signed order page links
    env.ts               environment variable validation
```

---

## Database design

```
Category 1───* Product 1───* ProductVariant
                                   │
Order 1───* OrderItem ─────────────┘  (variant link set to NULL if the variant is deleted)

AdminUser
```

| Table | Main fields | Notes |
|---|---|---|
| **Category** | name, slug | |
| **Product** | name, slug, description, price, compareAtPrice, images[], isActive, isNew, isFeatured | `compareAtPrice` set → shown as on sale |
| **ProductVariant** | size, colour, colourHex, sku (unique), stock | One row per size + colour, unique per product. **Stock is tracked here**, because the store sells "Black / M", not just "T-Shirt". |
| **Order** | number, customer details, paymentMethod, paymentStatus, status, subtotal, discount, shippingFee, total, stockDeducted, payherePaymentId | `number` is shown as `TL-1001`. Order status and payment status are separate: a WhatsApp order can be confirmed but not paid yet (cash on delivery). |
| **OrderItem** | productName, size, colour, sku, unitPrice, quantity, lineTotal | A **snapshot** of what was bought. Changing a price or deleting a product later doesn't change old orders. |
| **AdminUser** | email, passwordHash | bcrypt hash |

**Money is stored as whole rupees (integers).** LKR prices don't use cents, and integers avoid floating-point rounding errors.

---

## Order lifecycle & inventory

```
PENDING ──► CONFIRMED ──► PROCESSING ──► SHIPPED ──► DELIVERED
   │            │              │
   └────────────┴──────────────┴──► CANCELLED
```

- **Stock is checked when the order is placed and deducted when the order is confirmed.**
  - PayHere orders are confirmed when the payment notification is verified.
  - WhatsApp orders are confirmed when the admin confirms them after the chat.

  Many online payments are abandoned and many WhatsApp chats don't turn into sales, so holding stock at checkout would hide items from real buyers.
- **Stock can't go below zero, even with simultaneous orders.**
  - Each item is deducted with a conditional update (`stock = stock - qty WHERE stock >= qty`) inside a transaction.
  - If two people pay for the last item at the same moment, only one deduction succeeds.
  - If any item fails, nothing is deducted.
- **Cancelling a confirmed order puts its items back in stock.** A `stockDeducted` flag means stock is never deducted or returned twice, even if PayHere sends the same notification again or a button is clicked twice.
- **If an item sells out between checkout and payment:**
  - The payment is still recorded, because the customer has paid.
  - The order is flagged on the dashboard so the shop can restock, offer a substitute or refund.
- **Allowed status changes are enforced on the server.** For example:
  - A delivered order can't be cancelled.
  - A PayHere order can't be confirmed by hand before it is paid.

---

## PayHere integration

1. **The customer places the order.** `POST /api/orders`:
   - Validates the request.
   - Reloads prices and stock from the database.
   - Recalculates the totals.
   - Saves a `PENDING` order.
2. **The server builds the PayHere checkout form**, including the hash:
   ```
   hash = UPPER(MD5(merchant_id + order_id + amount + currency + UPPER(MD5(merchant_secret))))
   ```
   The merchant secret stays on the server. The browser only receives the finished hash.
3. **The browser posts the form to the PayHere checkout page.**
4. **PayHere calls `POST /api/payhere/notify`.** This is the only place an order can be marked as paid, and only after:
   - **Checking `md5sig`.** This proves the request really came from PayHere and wasn't changed.
   - **Checking the order.** It must exist, and the amount and currency must match what was charged.

   Fake or modified notifications are rejected. Repeated notifications are handled safely.
5. **PayHere sends the customer back to the order page.** That redirect alone proves nothing, so:
   - The page waits until the notification has been processed.
   - If the payment was cancelled or failed, the customer can try paying again.

## WhatsApp order flow

1. **The order is saved first**, as `PENDING` with a real order number.
2. **The confirmation page opens WhatsApp** (`wa.me/<business number>`) with a ready-to-send message. Items are grouped by product and colour, following the format in the brief:
   ```
   *Order TL-1002*
   • Black Oversized T-Shirt — M × 10, L × 5 (Rs 52,350)
   • White Oversized T-Shirt — M × 8 (Rs 27,920)

   Items: 23
   Subtotal: Rs 80,270
   Bulk discount: -Rs 8,027
   Delivery: Free
   *Total: Rs 72,243*

   *Customer*
   Nimal Silva
   0712345678
   5 Temple Road, Kandy
   ```
3. **The admin follows up.**
   - The order appears in the admin panel.
   - The admin agrees the details with the customer on WhatsApp, then clicks **Confirm order**, which deducts stock.
   - When the bank transfer or cash payment arrives, they record it.

**Why save the order before sending the message:** WhatsApp orders are tracked, counted and fulfilled the same way as online orders. The order number in the message connects the chat to the record.

---

## Security approach

| Area | What I did |
|---|---|
| **Passwords** | Hashed with bcrypt (cost 12). A wrong email and a wrong password give the same error and take the same time, so attackers can't find out which admin emails exist. |
| **Sessions** | A signed JWT stored in an **httpOnly, SameSite=Lax, Secure** cookie, valid for 8 hours. JavaScript can't read it, and it isn't sent with cross-site form posts. |
| **Admin access** | `proxy.ts` redirects signed-out users. In addition, **every admin page, Server Action and the upload endpoint calls `requireAdmin()`**, which also checks that the admin still exists in the database. The proxy is only a convenience, not the protection. |
| **Redirects after login** | The `?from=` value is only followed if it's an `/admin` path, which prevents open redirects. |
| **Payments** | The PayHere secret is only used on the server. Orders are marked paid only after a verified notification with the correct amount, never because of the browser redirect. |
| **Price tampering** | The cart only sends variant IDs and quantities. Prices, discounts, delivery and totals are always recalculated on the server. |
| **Validation** | Zod schemas on every API route and Server Action. The same schemas give instant feedback in the forms. Lengths, quantities and phone formats are limited. |
| **Customer privacy** | Order pages need a link signed with HMAC-SHA256, so order IDs can't be guessed to see someone's address. Tracking needs the order number **and** the phone number, gives the same response for "not found" and "wrong phone", and never shows the address. |
| **Uploads** | Only signed-in admins can upload, only images, up to 4 MB. Product image URLs are limited to trusted hosts. |
| **Secrets** | Kept in environment variables, validated at startup, never exposed to the browser (no `NEXT_PUBLIC_` prefix). `.env` is git-ignored; `.env.example` lists what's needed. |
| **Database** | Prisma parameterises all queries, which prevents SQL injection. |
| **Headers** | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` |

---

## Key technical decisions

- **Next.js for the full stack.** One TypeScript codebase covers the store, the admin panel and the API, so types are shared from the database to the UI.
- **PostgreSQL instead of a document database.** Orders, items, variants and stock are relational, and stock updates need transactions.
- **Variants as their own table.** Size and colour combinations each have their own SKU and stock, which is how a clothing shop actually manages inventory.
- **Deducting stock on confirmation, not at checkout** (see [Order lifecycle](#order-lifecycle--inventory)).
- **A size grid for bulk orders.** The brief mentions "larger quantity orders", and picking sizes one at a time for 20+ shirts would be painful.
- **Saving WhatsApp orders before redirecting**, so they're part of the same order management as online payments.
- **Guest checkout.** It lowers friction for customers and kept the time focused on the core order flow.
- **A simple JWT session instead of a full auth library.** There's a single admin role, and this approach is small enough to explain line by line.

---

## Assumptions & limitations

- **No customer accounts.** Customers check order status with the order number and phone number.
- **Sri Lanka only.** LKR currency, Sri Lankan mobile numbers, and a flat Rs 450 delivery fee (free over Rs 15,000).
- **One price per product.** All variants share the product's price.
- **No emails or SMS.** Updates are shown on the order and tracking pages and handled on WhatsApp.
- **No rate limiting** on login, checkout or tracking. For production I would add it at the edge (e.g. Vercel WAF or Upstash Ratelimit), because in-memory limits don't work reliably on serverless.
- **Refunds and chargebacks** from PayHere are recorded on the order but handled manually.
- **Bulk discount tiers** are set in code (`src/lib/pricing.ts`), not editable in the admin panel.
- **One admin role**, with no staff permissions or audit log.
- **Sample product photos** are free images from Unsplash. New products use images uploaded through the admin panel.

---

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / run it |
| `npm run lint` | Run ESLint |
| `npx prisma migrate dev` | Apply schema changes locally |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma db seed` | Reset sample data and create the admin user |
| `npx prisma studio` | Browse the database in the browser |
