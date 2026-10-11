# Toria Accessories and Fit

A full-stack storefront for bags and sandals built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma, secure customer/admin sessions, and Paystack-hosted checkout.

The application does not include real customer records or live merchandise. `npm run db:seed` adds four clearly labelled **sample products** so you can check the catalogue and replace them with your real inventory.

## Requirements

- Node.js 20.9 or newer (Node 22 LTS is recommended) and npm
- PostgreSQL 14 or newer, local or hosted
- Paystack merchant account for live payments
- A Supabase project with Storage enabled for product photography

## Install and configure

From this project directory:

```bash
npm install
```

Edit the included `.env.local` with your local settings (never commit this file). If it is missing, copy `.env.example` to `.env.local` without overwriting an existing file. `.env.local` takes precedence over `.env` for the Prisma CLI. `.env.example` is intentionally safe to commit.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL, including database and schema |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL, e.g. `https://shop.example.com`; use `http://localhost:3000` locally |
| `SESSION_SECRET` | At least 32 random characters for signed, HTTP-only sessions and login throttling |
| `PAYSTACK_SECRET_KEY` | Server-only Paystack secret (`sk_test_...` for testing, `sk_live_...` for live payments) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Your matching Paystack public key (`pk_test_...` or `pk_live_...`). Hosted redirect checkout does not expose or need this key in browser code. |
| `DELIVERY_FEE_NGN` | Flat delivery fee in whole naira; default is `2500` |
| `AUTH_DEV_OTP_ENABLED` | Set to `true` only in local development to display an OTP when SMTP is not configured. It is ignored in production. |
| `STORE_SUPPORT_PHONE`, `STORE_SUPPORT_EMAIL`, `STORE_SUPPORT_WHATSAPP` | Configurable support phone, email, and WhatsApp shown on Contact. The example values are the contact details supplied for this store. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | SMTP account used for customer email verification and password-reset messages. |
| `SUPABASE_URL` | Supabase project URL used by the server-side Storage upload route |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret/service-role key used only by the admin upload route. Never use a `NEXT_PUBLIC_` prefix or expose this key in browser code. |
| `SUPABASE_STORAGE_BUCKET` | Supabase Storage bucket name for product images (for example, `product-images`) |
| `CRON_SECRET` | Long random bearer token for the stale-payment verification endpoint |

Generate a session secret and paste it as `SESSION_SECRET` in `.env.local` (the example intentionally leaves it blank). Account sign-in and admin creation remain disabled until a real 32+ character secret is set:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

## PostgreSQL and Prisma

Create a PostgreSQL database, then set `DATABASE_URL`. For local development, apply the initial migration and generate the client:

```bash
npx prisma migrate dev --name init
npm run db:generate
```

Create categories and sample bags/sandals:

```bash
npm run db:seed
```

The seed is repeatable. Sample products are labelled in the storefront and their names/descriptions clearly identify them as samples. Replace, deactivate, or delete them in the admin product manager before launch.

For production deploys, commit generated migration files from development and apply them with:

```bash
npx prisma migrate deploy
npm run db:generate
```

Do not use `prisma db push` as a substitute for production migrations.

## Create the first administrator

Customer registration can only create `CUSTOMER` accounts. It has no role selector. To create the first administrator, configure the database and session secret, then run this command in an interactive terminal:

```bash
npm run create-admin
```

The CLI reads `.env.local`, prompts for your name and email, and asks you to choose and confirm a password without displaying it. Use the password you chose; there is no generated or hardcoded admin password. Only a bcrypt hash is stored. Sign in separately at `http://localhost:3000/admin/login` (or `https://YOUR_DOMAIN/admin/login` after deployment).

To change your password while signed in, open **Change password** in the admin dashboard and enter your current password plus your new one. This invalidates existing sessions. If you have forgotten it, use **Forgot your admin password?** from `/admin/login`, or visit `/admin/forgot-password`. The emailed, single-use reset link expires after 30 minutes; configure SMTP before relying on account recovery.

To securely create an additional admin after the first one, run `npm run create-admin -- --additional` from the trusted server/development environment. This privileged CLI asks for a new admin's own name, email, and chosen password; it does not expose admin creation through public customer registration. Protect access to the server terminal and database credentials.

## Customer accounts and verification

The home page and Contact page are public. Customers must create an account and verify their email before browsing the shop, using a bag, accessing account pages, or checking out. Registration collects full name, email address, phone number, and password; passwords are stored as bcrypt hashes, and public registration always creates the `CUSTOMER` role.

Configure the SMTP variables above to send the six-digit verification code to the customer's email. Codes expire after 10 minutes, are stored as keyed hashes, and allow at most five attempts. Until SMTP is configured, registration returns a clear configuration error instead of claiming that an email was sent.

For a Gmail account, enable 2-Step Verification and create an App Password in your Google Account security settings. In `.env.local`, use `SMTP_HOST="smtp.gmail.com"`, `SMTP_PORT="587"`, your Gmail address as `SMTP_USER`, and the App Password as `SMTP_PASSWORD` (not your regular Gmail password). Leave `SMTP_FROM` empty to send from that Gmail account. Gmail may impose sending limits; for production, consider an email provider intended for application mail.

For local testing without an email provider, set `AUTH_DEV_OTP_ENABLED="true"` in `.env.local` while `NODE_ENV` is not `production`. The verification screen will display a development-only OTP; this mode is always disabled in production. Set it back to `false` when local OTP display is not wanted.

Customers sign in at `/login`, recover access through **Forgot password?**, and manage their contact details, order history, order status, and sign-out from `/account`. Email addresses cannot be changed from the profile form because they are the verified account identifier.

## Admin access and customer support

Administrators sign in separately at `/admin/login`. Protected admin pages and admin APIs check the user's current database role on the server; an account created through customer registration cannot become an administrator. Use the trusted `npm run create-admin` command to add administrators.

The public Contact page shows the configured phone, email, and WhatsApp channels and accepts support messages. Messages are saved as complaints with customer contact details, a timestamp, and an `OPEN` status. Administrators can review complaints and update their status at `/admin/complaints`.

The supplied contact details are the fallback defaults in `src/lib/support.ts` and `.env.example`. Set `STORE_SUPPORT_PHONE`, `STORE_SUPPORT_EMAIL`, and `STORE_SUPPORT_WHATSAPP` in `.env.local` (or your hosting secret manager) to replace them. These values are server configuration and are not exposed as environment variables to browser code.

## Run the application

```bash
npm run dev
```

Open `http://localhost:3000`. The database must be migrated and configured. Without SMTP, customer registration is available only in local development when `AUTH_DEV_OTP_ENABLED=true`; otherwise the site clearly reports that verification is not configured. Paystack checkout remains unchanged and requires the existing Paystack configuration.

Apply schema changes to an existing database without deleting data using:

```bash
npx prisma migrate deploy
npm run db:generate
```

For local development, create a migration after schema changes with `npx prisma migrate dev --name descriptive_change`, then generate the Prisma client with `npm run db:generate`.

## Paystack setup

1. Paste the public key into `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in the local `.env.local` file, and paste the matching secret key into `PAYSTACK_SECRET_KEY` in that same file. Use a matching `pk_test_...` and `sk_test_...` pair for test mode. The public key is safe for frontend use; the secret key is used only by server API routes. The current hosted-redirect integration does not need to send the public key to browser JavaScript.
2. The webhook uses `PAYSTACK_SECRET_KEY` to verify Paystack's HMAC-SHA512 signature over the unmodified request body, then independently retrieves the transaction from Paystack's verify API.
3. Configure a Paystack webhook URL in the dashboard: `https://YOUR_DOMAIN/api/payments/webhook`. The endpoint accepts only valid signed webhooks and is safe to receive duplicate events.
4. Set `NEXT_PUBLIC_APP_URL` to the exact HTTPS origin of the deployed site so Paystack returns to `/payment/return`.
5. Use Paystack's test mode and dashboard test credentials to exercise a test payment before switching both keys and the dashboard to live mode. Paystack supplies payment methods (including eligible bank methods) enabled for your merchant account; this site does not invent or manually confirm transfers.

Checkout prices, stock, shipping, and totals are recalculated on the server. Stock is atomically reserved when the pending order is created. An order becomes paid only after a matching successful Paystack verification; the webhook is a second server-side confirmation path. Failed/abandoned payments release stock. A scheduled endpoint at `POST /api/cron/expire-orders`, authenticated with `Authorization: Bearer $CRON_SECRET`, re-verifies pending payment references older than 24 hours; pending bank-payment transactions remain pending rather than being treated as paid or failed. Schedule that endpoint with your hosting provider's cron facility.

If a Paystack initialization request times out, its outcome may be indeterminate. The order stays reserved to avoid overselling or accidentally taking a second payment; review the order and Paystack dashboard before taking action.

## Product images

### Configure Supabase Storage

1. Create or sign in to a Supabase account and create a project. Supabase Storage can be used independently from the PostgreSQL database configured in `DATABASE_URL`; do not change that existing database setting for image storage.
2. In the Supabase project dashboard, open **Storage**, choose **New bucket**, and name it `product-images` (or use your chosen name in `SUPABASE_STORAGE_BUCKET`).
3. Make the bucket **public** so storefront visitors can load product image URLs. Public means anyone who has an image URL can view that image; it does not grant public upload permission. Uploads in this site are restricted to the authenticated admin server route.
4. In **Project Settings → API Keys**, copy the project URL and a **Secret key** (`sb_secret_...`). The legacy `service_role` key also works while Supabase supports it. This elevated key bypasses Storage policies, so treat it like a password: never put it in client code, commit it, or name it `NEXT_PUBLIC_*`.
5. Add these variables to `.env.local` for local development:

   ```env
   SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-server-only-service-role-key"
   SUPABASE_STORAGE_BUCKET="product-images"
   ```

   Set the same values in your production host's server-side environment settings, then redeploy. Restart `npm run dev` after changing local environment variables.
6. Sign in to the admin dashboard, upload a small test image, and confirm that its preview loads from the returned Supabase URL. Uploads are not available until the project, bucket, and environment variables are configured correctly.

Supabase's Free plan currently includes **1 GB of file storage** and **5 GB of uncached plus 5 GB of cached egress**. Free projects may be paused after one week of inactivity, which can temporarily affect image availability until the project is resumed. Review [Supabase pricing](https://supabase.com/pricing) for current quotas and limits.

The admin product form accepts any combination of up to 8 HTTPS image URLs and uploaded files. URLs are optional; products with no images remain valid and display the site's existing placeholder. The server route requires an admin session, checks JPEG/PNG/WebP/AVIF file signatures and an 8 MB maximum, then uploads with the server-only service-role key. The returned public URL is added to the form and saved to the existing PostgreSQL `Product.imageUrls` array when you save the product. If storage is not configured or an upload fails, the form shows an explicit error and does not add a fake/local file path.

## Password reset

Set the SMTP variables to a real transactional mail account before offering password resets. Reset tokens are cryptographically random, stored only as hashes, expire after 30 minutes, and are single-use. Until SMTP is configured, the request returns a clear service-not-configured message.

## Build and deploy

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

Deploy to a Node-compatible platform (for example, Vercel or a managed Node container) with a managed PostgreSQL database. Configure every production environment variable in the host's secret manager, deploy migrations before serving traffic, configure the Paystack webhook and scheduled endpoint, and use HTTPS. Configure storage/CDN access and SMTP before enabling image uploads and password recovery. Review your shipping rates, customer-care contact, privacy/terms, tax, returns/refunds, and consumer-protection policies for your business before accepting live orders.

The project intentionally does not automate Paystack refunds, shipment booking, or marketing email sends; those require merchant/business-specific integrations. A verified payment whose order was already cancelled is flagged for manual review and must be reconciled/refunded in the Paystack dashboard as appropriate.
