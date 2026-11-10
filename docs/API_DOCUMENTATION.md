# Kisan Hardware Billing API Documentation (v1)

This REST API powers the billing, inventory management, customer credit (Udhaar) ledger, and analytics for the Hardware Shop.

- **Base URL:** `/api/v1`
- **Format:** JSON (`Content-Type: application/json`)
- **Standard Response Shape:**
  ```json
  {
    "success": true,
    "message": "Operation description",
    "data": {},
    "pagination": { "page": 1, "limit": 25, "totalCount": 100, "totalPages": 4 }
  }
  ```

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Login with `identifier` (username or phone) & `password`. Issues short-lived access token + rotating refresh token in `httpOnly` secure cookies. |
| `POST` | `/api/v1/auth/refresh` | Public | Rotates refresh token and issues fresh access token. |
| `POST` | `/api/v1/auth/logout` | Public | Invalidates active refresh token and clears cookies. |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns current authenticated user profile & permissions. |
| `POST` | `/api/v1/auth/change-password` | Authenticated | Changes password and revokes all active sessions. |
| `GET` | `/api/v1/auth/users` | Admin | Lists all staff and admin accounts. |
| `POST` | `/api/v1/auth/users` | Admin | Creates new staff user account. |
| `PATCH` | `/api/v1/auth/users/:id/toggle`| Admin | Deactivates or activates a staff user. |

---

## 2. Products & Inventory (`/api/v1/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/products` | All Staff | List products with pagination, search, category filter, and low-stock filter. Purchase prices are masked for non-admin staff. |
| `GET` | `/api/v1/products/autocomplete?q=pip` | All Staff | Ultra-fast debounce search for billing counter autocomplete (top 15 matches). |
| `GET` | `/api/v1/products/:id` | All Staff | Get detailed product specifications. |
| `POST` | `/api/v1/products` | Admin | Add new hardware item (Pipe, Motor, Tap, Submersible, etc.). |
| `PUT` | `/api/v1/products/:id` | Admin | Update product details. Generates audit log on price changes. |
| `PATCH`| `/api/v1/products/:id/stock` | Admin | Inward/Outward stock adjustment with reason. Creates immutable `StockMovement`. |
| `DELETE`| `/api/v1/products/:id` | Admin | Soft-deactivates product (`isActive = false`). |
| `POST` | `/api/v1/products/import-csv` | Admin | Bulk import products from CSV data. |

---

## 3. Customers & Udhaar Ledger (`/api/v1/customers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/customers` | All Staff | List customers with search by name/phone, filter by `hasDues=true`. |
| `GET` | `/api/v1/customers/:id` | All Staff | Customer details with recent bills and payment history. |
| `GET` | `/api/v1/customers/:id/ledger` | All Staff | Complete statement with debits, credits, and running balance. |
| `GET` | `/api/v1/customers/:id/whatsapp-reminder` | All Staff | Generates WhatsApp payment reminder deep link. |
| `POST` | `/api/v1/customers` | All Staff | Register new customer. |
| `PUT` | `/api/v1/customers/:id` | All Staff | Update customer contact and address. |

---

## 4. Billing & POS (`/api/v1/bills`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/bills` | All Staff | Search and filter invoices by date, customer, payment status, invoice number. |
| `POST` | `/api/v1/bills` | All Staff | Authoritative server-side calculated bill creation. Generates sequential invoice #, deducts inventory stock, updates customer credit ledger. Supports idempotency key. |
| `GET` | `/api/v1/bills/:id` | All Staff | Fetch bill details. |
| `GET` | `/api/v1/bills/:id/pdf` | All Staff | Streams PDF invoice generated via PDFKit directly to browser/download. |
| `GET` | `/api/v1/bills/:id/whatsapp` | All Staff | Returns formatted WhatsApp invoice text and web link. |
| `POST` | `/api/v1/bills/:id/return` | All Staff | Processes sales return / credit note. Restores stock and balances ledger. |
| `POST` | `/api/v1/bills/:id/cancel` | Admin | Cancels bill with mandatory reason. Automatically reverses stock deductions and restores customer balance. |

---

## 5. Payments Received (`/api/v1/payments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/payments` | All Staff | List all payment receipts with pagination and date filter. |
| `POST` | `/api/v1/payments` | All Staff | Record payment received from customer against outstanding Udhaar. Generates receipt sequence `REC-YYYY-XXXXX`. |

---

## 6. Reports & Analytics (`/api/v1/reports`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/reports/dashboard` | All Staff | Fast dashboard counters: Today's sales, bills count, total pending dues, low stock alerts. |
| `GET` | `/api/v1/reports/sales` | Admin | Aggregated sales timeline (daily/monthly), tax, discounts, paid amounts. |
| `GET` | `/api/v1/reports/category-sales`| Admin | Sales breakdown by product category (Pipe, Motor, Tap, Submersible, Fitting). |
| `GET` | `/api/v1/reports/gst` | Admin | GSTR-1 compliant tax breakdown: taxable turnover, CGST, SGST, IGST. |
| `GET` | `/api/v1/reports/profit` | Admin | Selling revenue vs purchase cost, gross profit, margin %. |

---

## 7. Settings & Audit Trail

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/settings` | All Staff | Get shop name, address, phone, GSTIN, bank details, and UPI ID. |
| `PUT` | `/api/v1/settings` | Admin | Update shop configuration, tax defaults, bank details, invoice prefix. |
| `GET` | `/api/v1/audit` | Admin | View immutable security and operational audit trail. |
