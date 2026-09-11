# Saadanam

Saadanam is a multi-tenant billing & shop-management platform. Shop owners get a
full POS/billing suite (products, sales, purchases, customers, suppliers,
expenses, reports), while a Platform Admin approves shops, monitors devices,
broadcasts notifications and handles support tickets.

Two roles exist:

- **platform_admin** — manages the whole platform
- **shop_owner** — runs one shop (all data is scoped to their shop)

---

## Tech Stack

**Backend** (`backend/`)
- Python / Django 5.0.9 + Django REST Framework 3.15.2
- JWT auth (`djangorestframework-simplejwt`)
- SQLite for dev, MySQL 8.0 for production (via docker-compose)
- Pillow (logo uploads), user-agents (device session labels)

**Frontend** (`frontend/`)
- React 18 + Vite 5 + Tailwind CSS 3
- react-router-dom 7, recharts (charts), motion/gsap/ogl (animations)
- lucide-react (icons), axios (API client)

---

## Project Structure

```
backend/
  config/            settings (base/dev/prod), urls, wsgi/asgi
  apps/              14 Django apps:
    core             TenantModel base (shop-scoped tables + audit fields)
    accounts         custom User (roles, approvals, JWT auth)
    shops            Shop profile + tax settings
    devices          login device sessions
    products         products, price history, bulk CSV import
    billing          sales / POS, invoices
    purchases        purchases (auto stock-in + linked expense)
    customers        customers + credit ledger
    suppliers        suppliers + outstanding ledger
    expenses         manual expenses
    notifications    broadcasts + targeted notifications
    feedback         support tickets
    platform_admin   shop approvals, suspensions, dashboard
    reports          charts, today-stats, analytics, CSV exports
frontend/
  src/api/           axios API modules (one per backend app)
  src/context/       Auth, Shop, Data, Theme
  src/pages/         auth/, shop/ (owner), platform-admin/
  src/components/    ui/, invoice/, landing animations
```

---

## API Overview

Base URL: `/api/`

**Auth** (`apps/accounts`)
- `POST /auth/register/` — register (first user = Platform Admin)
- `POST /auth/login/` — JWT login (+ device session)
- `POST /auth/refresh/` — refresh access token
- `GET /auth/me/` — current user
- `PATCH /auth/me/` — update profile
- `POST /auth/change-password/` — change password

**Shops**
- `GET/PATCH /shops/me/` — owner's own shop / settings (logo upload supported)

**Devices**
- `GET /devices/my-devices/` — owner's active sessions
- `POST /devices/<id>/logout/` — owner logout
- `GET /devices/shop-devices/` — admin: all shops' sessions
- `POST /devices/<id>/force-logout/` — admin force-logout

**Products**
- `GET/POST /products/` — list / create
- `GET/PATCH/DELETE /products/<pk>/` — detail / update / delete
- `PATCH /products/<id>/quick-price/` — dashboard quick price update (logs price history)
- `POST /products/bulk-import/` — CSV import (name, price, stock, minStock, cost)

**Billing**
- `GET /billing/sales/` — all sales (newest first)
- `GET /billing/sales/export/` — CSV export
- `GET/DELETE /billing/sales/<pk>/` — detail / delete (restores stock + balances)
- `POST /billing/finalize-sale/` — create sale (cart, discount, tax, payment)

**Purchases**
- `GET/POST /purchases/` — list / create (+ auto expense, + stock, + cost update)
- `GET/PATCH/DELETE /purchases/<pk>/` — detail / update / delete (reverses stock + expense)

**Customers**
- `GET/POST /customers/` — list / create
- `GET /customers/walkin/` — get-or-create the Walk-in Customer
- `GET /customers/export/` — CSV download
- `GET/PATCH/DELETE /customers/<pk>/` — detail (delete blocked if sales exist)
- `POST /customers/<id>/adjust-balance/` — "They Paid" / "They Owe More"
- `GET /customers/<id>/ledger/` — ledger entries

**Suppliers**
- `GET/POST /suppliers/` — list / create
- `GET /suppliers/export/` — CSV download
- `GET/PATCH/DELETE /suppliers/<pk>/` — detail
- `POST /suppliers/<id>/adjust-balance/` — "We Paid" / "We Owe More"
- `GET /suppliers/<id>/ledger/` — ledger entries

**Expenses**
- `GET/POST /expenses/` — list / create
- `GET/PATCH/DELETE /expenses/<pk>/` — detail (purchase-linked ones cannot be deleted here)

**Notifications**
- `GET /notifications/` — owner's feed (broadcasts + targeted)
- `GET /notifications/unread-count/` — unread count for the visible feed
- `POST /notifications/mark-all-read/`
- `POST /notifications/<id>/read/`
- `GET/POST /notifications/broadcast/` — admin: history + send (optional shop_ids targets)

**Feedback / Support**
- `GET/POST /feedback/` — owner's tickets
- `GET /feedback/all/` — admin inbox
- `GET /feedback/unseen-count/` — sidebar dot
- `POST /feedback/<id>/reply/` — both sides reply
- `POST /feedback/<id>/resolve/` — admin marks resolved

**Reports**
- `GET /reports/sales/` — daily sales + profit (?start=&end=, default 7 days)
- `GET /reports/sales/export/` — CSV download
- `GET /reports/today-stats/` — dashboard stat cards (incl. today's profit)
- `GET /reports/platform-analytics/` — admin analytics (bills, products, active shops, registrations)

**Platform Admin**
- `GET /platform-admin/dashboard/` — counts (total/active/pending/suspended shops)
- `GET /platform-admin/shops/` — all shops
- `GET /platform-admin/shops/pending/`
- `POST /platform-admin/shops/<id>/approve/`
- `POST /platform-admin/shops/<id>/reject/`
- `POST /platform-admin/shops/<id>/suspend/`
- `POST /platform-admin/shops/<id>/activate/`

Auth: JWT access (30 min) + refresh (7 days, rotating). All endpoints except
register/login/refresh require a Bearer token.

---

## Frontend Pages

**Public**
- `/` — Landing page (animated intro)
- `/login` — Login
- `/register` — Registration (shop details + tax settings)

**Shop owner** (role-gated)
- `/shop/dashboard` — stat cards + recent sales + Quick Price Update modal
- `/shop/products` — product CRUD, cost + margin, search, price history, bulk CSV import
- `/shop/billing` — POS billing (cart, customer, discount, tax, payment)
- `/shop/sales-ledger` — sales history, search, CSV export, invoice view/print, delete
- `/shop/purchases` — purchase orders (add stock + cost, auto expense)
- `/shop/customers` — customer CRUD, credit/outstanding, adjust balance, ledger, CSV export
- `/shop/suppliers` — supplier CRUD, outstanding, adjust balance, ledger, CSV export
- `/shop/expenses` — manual expenses (purchase-linked ones locked)
- `/shop/reports` — date-range sales + profit charts, summary cards, CSV export
- `/shop/devices` — my devices (list + log out)
- `/shop/notifications` — broadcast + targeted feed from admin
- `/shop/feedback` — support tickets (create, reply, status)
- `/shop/settings` — logo upload, profile edit, business info, tax settings, change password

**Platform admin** (role-gated)
- `/admin/dashboard` — platform stats
- `/admin/approvals` — approve / reject pending shops
- `/admin/shops` — all shops (search, suspend / activate)
- `/admin/devices` — all shop devices (force logout)
- `/admin/analytics` — bills, products, active-today, registrations chart
- `/admin/notifications` — send to all shops OR selected shops; history
- `/admin/feedback` — ticket inbox (reply, resolve, unseen dots)

Key components: `AppLayout`, `Sidebar`, `Topbar`, `NotificationBell`, `Modal`,
`Button`, `Input`, `Badge`, `ProtectedRoute`, `QuickPriceUpdateModal` (ui/);
`InvoiceModal` + `InvoiceDocument` for printable invoices (invoice/);
`Aurora`, `BlurText`, `ChromaGrid` for landing-page visuals.

---

## Setup & Run (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) MySQL only needed for production mode

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend runs at http://localhost:8000 (API under `/api/`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at http://localhost:5173 (proxies API calls to
http://127.0.0.1:8000/api).

### 3. Or launch both at once (Windows)

```bash
dev.bat
```

### 4. First login

1. Open http://localhost:5173/register
2. The **first** registered account automatically becomes the **Platform Admin**.
3. Later registrations become shop owners and must be **approved** by the
   platform admin (Admin → Approvals) before they can log in.

---

## Configuration

Copy the root `.env` (see `.env` in the repo) and adjust if needed:

| Variable | Purpose | Default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django secret | dev fallback |
| `DJANGO_DEBUG` | debug mode | `True` |
| `DJANGO_ALLOWED_HOSTS` | comma-separated hosts | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | comma-separated frontend origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_HOST` / `MYSQL_PORT` | production DB (see below) | — |

### Switching to MySQL (production)

The dev settings (`backend/config/settings/dev.py`) use SQLite. For production:

1. Start MySQL: `docker compose up -d db` (runs MySQL 8.0 on port 3306).
2. Set the `MYSQL_*` variables in `.env`.
3. Run the backend with the production settings:

```bash
cd backend
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py migrate
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py runserver
```

---

## Tests

```bash
cd backend
venv\Scripts\activate        # or source venv/bin/activate
python manage.py test
```

Covers registration/role assignment, login approval gating, the tax engine
(inclusive vs exclusive), stock deduction/restoration, price history, customer
& supplier ledger adjustments, purchase → expense linking, and notification
targeting.

---

## Key Features

- **Billing / POS** — cart with duplicate-item merging, stock validation,
  discounts, auto invoice numbering (`INV-00001`), tax math for inclusive or
  exclusive GST, payment + change calculation, printable invoice.
- **Products** — CRUD, quick inline price update (with price history), low-stock
  alerts, bulk CSV import (with cost column), cost price + margin display.
- **Purchases** — auto stock-in, auto "Purchase" expense, latest purchase price
  becomes the product cost (feeds profit reports).
- **Customers & Suppliers** — credit/outstanding tracking with a full ledger and
  one-click "They Paid / They Owe More" and "We Paid / We Owe More".
- **Reports** — date-range sales & profit charts, summary cards, CSV export.
  Dashboard shows today's sales, profit, stock value, pending payments.
- **CSV exports** — sales ledger, customers, suppliers, and daily sales reports.
- **Notifications** — platform admin can broadcast to all shops or target
  specific shops; owners see unread badges and read-tracking.
- **Feedback / support tickets** — two-way replies with unseen indicators.
- **Device management** — every login records the device; owners can log out
  other devices, admins can force-logout any shop's session.
- **Settings** — business info, tax config, shop logo upload, profile edit,
  and password change.

---

## Remaining Work (non-Docker)

- [ ] Email verification / password reset flow (needs an email provider).
- [ ] Per-shop notification history on the owner side is read-only — no push
      or in-app realtime yet.
- [ ] Profit reports assume latest-purchase-cost as product cost; weighted
      average cost would be more accurate for fluctuating prices.

