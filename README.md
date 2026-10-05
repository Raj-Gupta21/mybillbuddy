# MyBillBuddy

MyBillBuddy is a React/Vite billing workspace with a Spring Boot API. It has two modes: a browser-only sample workspace and an API-backed account workspace. Do not put real customer or payment records in demo mode.

## Run locally on Windows

Open two PowerShell terminals in this folder. Start the API in the first:

```powershell
npm run api:dev
```

The launcher creates `api/.env.local` with a random local operator password the first time, then starts the API on port 8081 with a persistent H2 development database in `api/data`. Keep the printed password private. The MySQL settings in `application.properties` are for a deployed/production API; the local profile uses H2.

Start the frontend in the second terminal:

```powershell
npm run dev
```

Open the Vite URL, choose **Sign in**, or create an account on the sign-in page. The API stores account passwords as one-way hashes and keeps the signed session in an HTTP-only cookie. Use **Continue with sample data** to enter the separate browser-only demo.

## API and database settings

Vite sends `/api` requests to `http://localhost:8081` by default. Set `VITE_API_PROXY_TARGET` if your local API uses another origin. For separately hosted frontend and API, set `VITE_API_BASE_URL` at build time and configure `CORS_ALLOWED_ORIGIN` to the exact frontend origin. Cross-site production cookies require HTTPS, `AUTH_COOKIE_SECURE=true`, and `AUTH_COOKIE_SAME_SITE=None`.

For MySQL deployment, create the `mybillbuddy` database, then provide the values in [`api/.env.example`](api/.env.example) through your deployment environment or secret manager. Spring does not load `.env.example` automatically. Keep `DB_PASSWORD`, `APP_LOGIN_PASSWORD`, and `JWT_SECRET` out of source control; use a random JWT secret of at least 32 bytes. Rotate any database password that was previously committed in project files.

The API supports account registration, sign-in/out, account settings, customer/inventory records, itemized invoices with GST, payments, dashboard summaries, and reports. Business records are scoped to the signed-in account. Existing unassigned records are claimed by the environment-configured bootstrap account when the API starts.

## Features

- Itemized invoices with due dates, GST rates, balances, CSV export, and browser print-to-PDF.
- Partial payments with invoice balance recalculation and overpayment protection.
- Account profile, business/GSTIN, currency, and in-app alert preferences.
- Demo sample data remains local to the browser and is separate from API-backed account data.
