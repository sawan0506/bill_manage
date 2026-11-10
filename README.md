# Kisan Hardware & Sanitary Mart - Production Billing System

A complete, production-ready, security-hardened **Billing & Inventory Web Application** designed specifically for **Hardware Shops** selling pipes, hand pumps, taps, motors, submersible pumps, sanitary fittings, and irrigation equipment.

Designed with **Extreme Simplicity** for non-technical hardware store owners and counter staff:
- **Extra Large Buttons & High-Contrast Typography** (min 17-22px readable fonts)
- **1-Click Language Switcher:** Seamless English and हिंदी (Hindi) translation across all screens
- **Big "NEW BILL" (+ नया बिल) Button Always Visible**
- **Ultra-Fast 2-3 Letter Autocomplete Product Search**
- **Walk-in Customer 1-Click Autofill**
- **Flexible Payments:** Cash, UPI (with QR code on invoice), Card, Full Udhaar (Credit), and Partial Payments
- **Automatic Stock Adjustments & Low Stock Warnings**
- **Built-in Udhaar Credit Ledger & 1-Click WhatsApp Payment Reminders**
- **Printable Invoices, Instant PDF Downloads (via PDFKit), and WhatsApp Sharing**
- **Bank-Grade Security:** JWT access + rotating refresh tokens in httpOnly cookies, CSRF protection, NoSQL injection protection, rate limiting, and immutable audit logs.

---

## 1. Tech Stack

- **Frontend:** React 18, Vite, React Router 6, Axios, Tailwind CSS, Lucide React
- **Backend:** Node.js 22 LTS, Express.js 4, Mongoose 8
- **Database:** MongoDB with Mongoose (compatible with MongoDB Atlas or local MongoDB; includes automated fallback)
- **PDF Generation:** PDFKit (fast, lightweight, pure JavaScript, zero chromium dependencies)
- **Security:** bcryptjs (cost 12), jsonwebtoken, helmet, express-rate-limit, express-mongo-sanitize, hpp, compression, zod validation.

---

## 2. Folder Structure

```
d:\bill_ops\bill_manage\
├── server/
│   ├── src/
│   │   ├── config/          # db connection, winston logger with data redaction
│   │   ├── models/          # User, Product, Customer, Bill, Payment, CreditNote, StockMovement, AuditLog, Settings, Counter
│   │   ├── controllers/     # auth, product, customer, bill, payment, report, settings, audit
│   │   ├── routes/          # versioned REST endpoints (/api/v1/...)
│   │   ├── middleware/      # auth, rbac, rateLimiter, csrf, errorHandler, validate
│   │   ├── validators/      # Zod validation schemas
│   │   ├── utils/           # billingCalculator, pdfGenerator, auditLogger
│   │   ├── scripts/         # seed.js, backup.js, restore.js
│   │   └── server.js        # Express application entry point
│   ├── tests/               # billing.test.js, auth.test.js (100% pass)
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/             # axios client with credentials and CSRF tokens
│   │   ├── context/         # AuthContext, LanguageContext (en/hi), ToastContext
│   │   ├── translations/    # en.js, hi.js
│   │   ├── components/      # BigButton, StatCard, Navbar, Sidebar, ProductAutocomplete, InvoiceModal, ConfirmModal
│   │   ├── pages/           # Login, Dashboard, NewBill, BillsList, Products, Customers, CustomerLedger, Payments, Reports, Settings, AuditLogs
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # High contrast styles & print stylesheet
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── docs/
    ├── API_DOCUMENTATION.md # Complete REST endpoints documentation
    ├── DEPLOYMENT_GUIDE.md  # Production Linux VPS, PM2, Nginx, SSL, Cron guide
    ├── USER_GUIDE.md        # Plain English & Hindi manual for non-technical staff
    └── postman_collection.json # Ready-to-import Postman collection
```

---

## 3. Quick Start Guide

### Step 1: Install Dependencies

```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

### Step 2: Seed the Database with Realistic Hardware Products

The seed script creates the default Owner (Admin), Staff account, shop configuration, and sample inventory across all categories (Finolex PVC pipes, Maya Hand pumps, Crompton/Kirloskar water motors, V-Guard submersibles, brass taps, and PVC fittings).

```bash
cd server
npm run seed
```

### Step 3: Run the Application

In terminal 1 (Start Server):
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

In terminal 2 (Start Client):
```bash
cd client
npm run dev
# Client will run on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 4. Running Automated Tests

Run the built-in unit tests verifying billing financial calculations, tax routing, and auth security:
```bash
cd server
npm test
```
All 10 unit test suites verify:
- Financial rounding in integer paise precision
- Flat and percentage discount calculations
- Intrastate CGST + SGST vs Interstate IGST routing
- Round-off and balance due (Udhaar) calculations
- Full payment vs partial payment vs credit mode
- Password hashing with bcrypt (cost 12)
- JWT access and refresh token signing, expiration, and invalidation

---

## 5. Security Architecture Highlights

1. **Server-Side Authoritative Calculations:** The client is never trusted for prices, tax rates, or totals. All calculations are executed server-side in `billingCalculator.js`.
2. **Atomic Invoicing & Numbering:** Sequential invoices (`INV-2026-00001`) and receipts are generated using atomic counter increments (`Counter.findOneAndUpdate`).
3. **Double Submission Protection:** Bills support `idempotencyKey` to prevent accidental double-billing on network delays.
4. **HttpOnly Secure Cookie Sessions:** JWT access token (~15m) and rotating refresh token (7d) are stored in `httpOnly`, `SameSite=strict` cookies with custom CSRF header validation.
5. **NoSQL Injection & Parameter Pollution Hardening:** Uses `express-mongo-sanitize` and `hpp` alongside Zod input validation schemas.
6. **Audit Trails:** Immutable audit logging for logins, failed attempts, bill creation, cancellations, price edits, and inventory adjustments.
7. **Role-Based Access Control:** Strict route middleware denying staff access to profits, user management, and bill cancellations.

---

## 6. Documentation Index

- [REST API Documentation](docs/API_DOCUMENTATION.md)
- [Production Deployment Guide (VPS + Nginx + PM2 + SSL)](docs/DEPLOYMENT_GUIDE.md)
- [Staff User Manual (English & हिंदी)](docs/USER_GUIDE.md)
- [Postman Collection](docs/postman_collection.json)
