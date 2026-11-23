# Setup guide: database, admin, orders

Do these in order. Each part takes a few minutes. You never need to send me any key or password.

> **Honest status:** I couldn't run this against your real Supabase, ImageKit or Vercel accounts. I tested it with an
> in-memory Postgres (the SQL, row-level security, the 24-hour rule), a fake database for all `/api` functions (29 checks),
> and a real browser with those services mocked (shop, checkout, My Order, admin login, orders, products, collections).
> Expect the odd typo-level problem on first contact with the real services. If something fails, send me the exact error text.

## 1. Supabase (database + admin login)

1. Create a project at supabase.com (free plan is fine). Choose a region near India (Mumbai / Singapore).
2. **SQL Editor → New query.** Paste the whole of `supabase/01_schema.sql`, press **Run**. Then paste `supabase/02_seed.sql` and run it. This loads your 14 sample products and 6 collections.
   - If `01_schema.sql` stops at `create extension pg_cron`, open **Database → Extensions**, switch on **pg_cron**, and run the file again. It is safe to run twice.
3. **Authentication → Users → Add user → Create new user.** Enter your email and a strong password, and tick **Auto Confirm User**.
4. **Authentication → Sign In / Providers** (or Settings): turn **off** "Allow new users to sign up".
5. Back in the SQL Editor, make that account an admin (use the same email):
   ```sql
   insert into public.admins (email) values ('you@example.com');
   ```
   To add a second admin later, add another row and create their user the same way.
6. **Project Settings → API.** Copy three things: the **Project URL**, the **anon public** key, and the **service_role** key. The service_role key is a secret. It goes into Vercel only (step 3), never into chat, code or Git.

## 2. ImageKit (photos and order pictures)

1. Create an account at imagekit.io (free plan).
2. **Developer options → API keys.** Copy the **Public key**, the **Private key** and the **URL endpoint** (looks like `https://ik.imagekit.io/yourid`).
3. Nothing else to set up. The site uploads with one-time signatures from the server.

## 3. Vercel (hosting + the small server functions)

1. Put the project in a GitHub repo (or use `vercel` from the command line) and import it in Vercel. Framework: **Vite**. Defaults are fine.
2. **Settings → Environment Variables.** Add these for Production (and Preview if you use it):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_URL` | Project URL (again) |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secret) |
   | `IMAGEKIT_PUBLIC_KEY` | ImageKit public key |
   | `IMAGEKIT_PRIVATE_KEY` | ImageKit private key (secret) |
   | `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint |
   | `CRON_SECRET` | any long random text you invent (secret) |

3. **Redeploy** (Deployments → ⋯ → Redeploy). The `VITE_` values are baked in at build time, so a redeploy is required.
4. Open `https://your-site/admin` and sign in with the email and password from step 1.3.

## 4. First test (about 10 minutes)

1. **Admin → Products → Add product.** Upload photos, save. Check it in the shop.
2. **Admin → Collections.** Edit one, tick some products, save. Check `/collections`.
3. On the shop, add something to the cart, fill the form, tap **Place Order via WhatsApp**. WhatsApp should open with the order number, a picture link and a tracking link.
4. **Admin → Orders → Waiting approval.** The order is there with a 24-hour countdown and the picture. Press **Approve**.
5. Open `/my-order`, enter the order number and the last 4 digits of the phone. The timeline shows *Approved*. Change the status in admin and refresh.
6. Place a second order and **Delete** it in admin. Its picture disappears from ImageKit (Media Library), and Track My Order says "Order not found".

## How the main rules work

- **Prices** are always read from the database when an order is created. A customer can't change a price.
- **24-hour rule.** Every order gets a deadline 24 hours after it's placed. Approving it removes the deadline. An hourly database job turns unapproved, overdue orders into *dismissed* and erases the name, phone, address, notes and items. Only the order number, status, dates and the last 4 phone digits stay (so Track My Order can still say "dismissed").
- **Rejecting** an order moves it to *Dismissed* straight away but keeps the customer's details for 24 more hours, so you can message them first.
- **Order pictures on ImageKit** are deleted by `/api/cron-cleanup`. On Vercel's free plan cron runs **once a day** (03:00 UTC), so a picture can linger up to about a day after its order is erased. To make it hourly, run `supabase/03_optional_hourly_image_cleanup.sql` after filling in your site address and `CRON_SECRET`.
- **Keep-alive.** That same daily job also queries Supabase, which stops a free project being paused for inactivity.
- **Rate limits** (stored in Supabase): 6 orders per hour per device, 4 orders per day per phone number, 30 My Order lookups per 10 minutes per device and 15 per hour per order number.
- **Security.** Visitors can only read products and collections. Everything else (orders, admin list) is blocked by row-level security. Only emails in the `admins` table can change anything.
- **If our order system is down**, checkout offers "Send on WhatsApp anyway", which sends the plain message as before. If only the picture upload fails, the order still goes through as text.

## Running it on your computer

`npm install`, then `npm run dev`. Without any `.env`, the site shows the sample products from `src/data` and `/admin` explains it isn't connected. To try orders and admin locally, copy `.env.example` to `.env.local`, fill it in, install the Vercel CLI (`npm i -g vercel`) and run `vercel dev` instead, since plain `npm run dev` doesn't run the `/api` functions.

## Good to know

- Photos you delete or replace in admin stay in your ImageKit Media Library. Remove them there if you want the space back.
- Order pictures contain the customer's name, phone and address. They sit behind a long random link and the checkout page tells customers so.
- Free-tier limits change. Check Supabase, ImageKit and Vercel before you launch.
- Categories: the five built-in ones plus any new category you type in a product form (it appears in the shop filters automatically).
- **Trending page** shows every product that has the **Trending** switch on (Admin → Products). Switch it off and the product leaves the page. If none are switched on, the page says nothing is trending yet.
- **Track My Order tab** is a plain lookup form (order number + last 4 phone digits). Nothing about orders is stored in the customer's browser.

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| Shop is empty or says it couldn't load | `VITE_SUPABASE_*` missing/wrong, or step 1.2 not run. Redeploy after changing env vars. |
| `/admin` says "No access" | The email isn't in the `admins` table (step 1.5), or it's spelled differently. |
| Photo upload says ImageKit isn't set up | The three `IMAGEKIT_*` variables are missing in Vercel. |
| "We couldn't reach our order system" at checkout | `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_URL` missing in Vercel, or you're running plain `npm run dev`. Check Vercel → Logs. |
| Orders never expire | pg_cron isn't enabled (see 1.2). The daily Vercel job also runs the expiry as a backup. |
