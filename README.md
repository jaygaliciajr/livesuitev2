# Live Selling Fast Encoding

Mobile-first responsive app for fast live selling encoding (encoder workflow): supplier selection, product activation, miner entry, order list edits, session summary, and draft invoice generation.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (database)
- Framer Motion (micro-interactions)

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase SQL editor, run:
   - `supabase/schema.sql`
   - `supabase/seed.sql` (optional sample data)
5. Run the app:
   ```bash
   npm run dev
   ```

## Android (APK) via Capacitor
Use this when you want to wrap the deployed web app as an Android app.

1. Set your deployed URL in `.env.local`:
   ```bash
   CAPACITOR_SERVER_URL=https://your-deployed-site.example.com
   ```
2. Generate/update Android project:
   ```bash
   npm run cap:add:android   # first time only
   npm run cap:sync
   ```
3. Open Android Studio project:
   ```bash
   npm run cap:open:android
   ```
4. In Android Studio:
   - `Build > Build Bundle(s) / APK(s) > Build APK(s)` for debug APK
   - `Build > Generate Signed Bundle / APK` for release build

Notes:
- If `CAPACITOR_SERVER_URL` starts with `http://`, cleartext is automatically enabled in Capacitor config.
- For production APK, always use `https://` deployed URL.

## Main Routes
- `/` Home dashboard (date filters + KPI cards + quick access)
- `/live` Live speed mode (supplier -> active product -> add miner -> order list -> end live)
- `/settings` Store settings, theme, low-stock threshold, CSV exports
- `/suppliers`, `/inventory`, `/customers`, `/invoices`, `/payments`, `/my-banks`, `/subscription`, `/history`

## SQL Notes
Schema includes:
- Core tables: suppliers, products, customers, live_sessions, session_orders, session_order_lines, invoices, payments
- Indexes for frequent lookups (`supplier_id`, `product_code`, `session_id`, `customer_id`, invoice/payment relations)
- RPC functions for stock-safe live workflow:
  - `add_miner_line`
  - `update_miner_line_qty`
  - `delete_miner_line`
  - `generate_draft_invoices`
- Triggered invoice status sync on payment insert

## Acceptance Scenario Coverage
1. Live flow stock safety and sold-out blocking:
   - Implemented via RPC stock checks and product state updates.
2. End session summary + draft invoices per customer:
   - Summary modal + `generate_draft_invoices`.
3. Dashboard date filters:
   - KPI metrics computed from session lines + invoices in selected range.
4. Order list grouped views + edit/remove with stock re-adjustment:
   - Group toggle (customer/product) + RPC edit/remove with stock correction.
