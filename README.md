   # AgriRenta — Farm Equipment Rental

   Static website (HTML/CSS/JS) hosted on **GitHub Pages**, with **Supabase** as the backend
   (Auth for login, PostgreSQL for data, one Edge Function for the app rules).

   ```
   index.html            landing page            app.html   the web app (login, dashboard, booking)
   app.js / app.css      app logic + design      style.css / script.js   landing page
   supabase-config.js    your Supabase URL + publishable key (edit this)
   supabase-api.js       connects app.js to Supabase
   supabase/schema.sql   database table (run once in the SQL Editor)
   supabase/functions/api/index.ts   Edge Function code (paste in Supabase dashboard)
   ```

   ## Demo accounts (password for all: `demo1234`)

   | Role | Email |
   |---|---|
   | Customer | alex.santos@example.com |
   | Customer | maria@example.com |
   | Customer | pedro@example.com |
   | Equipment owner | juan@example.com |

   The sample owners/customers, equipment listings, reviews and messages are created automatically
   the first time the app initializes its Supabase data. There is no shared administrator login.

   ## Setup

   1. Supabase: create a project.
   2. SQL Editor: run `supabase/schema.sql`.
   3. In **Authentication > Sign In / Providers > Email**, enable email confirmations. In **Authentication > Email Templates > Confirm signup**, use the `{{ .Token }}` template variable so Supabase sends a one-time code (not only a confirmation link). Configure custom SMTP before production; Supabase's built-in sender is rate limited.
   4. In **Authentication > URL Configuration**, set the production Site URL and allow the deployed app URL (for example, `https://<your-username>.github.io/<repo-name>/**`) plus your local development URL.
   5. In **Authentication > Users**, create or identify your administrator account. Save its exact email and user UUID.
   6. In **Edge Functions > Secrets**, set `ADMIN_EMAIL` and `ADMIN_USER_ID` to those values. Never put them in the website files.
   7. Create or update the `api` Edge Function with `supabase/functions/api/index.ts`, Deploy it, and turn **Verify JWT** off. The function checks Supabase Auth tokens itself and only grants admin access to the configured email + UUID pair.
   8. Put the Project URL and Publishable key in `supabase-config.js`.
   9. Push this folder to GitHub, then Settings > Pages > Deploy from branch `main` / `(root)`.
   10. Open `https://<your-username>.github.io/<repo-name>/app.html` once to initialize the demo data, then log in.

   Never put the `service_role` / `secret` key in any file of this repository.

   ## Administrator account and new registrations

   - Email/password sign-up sends a 6-digit Supabase email verification code. Set the Supabase Auth Email OTP Length to 6. The AgriRenta profile is created only after the code is confirmed. The mobile number remains a profile/contact field for rental and GCash transactions; it is not used for account verification. Google sign-ins are verified by Google.
   - Email confirmation is separate from identity and equipment-paper review. After confirming email, customers and owners can complete ID/selfie verification; owners' listings still require administrator approval before customers can book them.
   - `ADMIN_USER_ID` is the authorization check, together with the matching `ADMIN_EMAIL`. Keep both Edge Function secrets private. Never share passwords or put the Supabase service-role/secret key in this repository.
   - Updating GitHub Pages alone does not update backend rules: publish the frontend files **and** deploy the updated Edge Function.

   ## Supabase Storage for profile and equipment uploads

   Before deploying the Storage-enabled frontend:

   1. In Supabase > Storage, create a **public** bucket named `agrirenta-public`. Allow `image/jpeg`, `image/png`, and `image/webp`; set the file-size limit to 5 MB.
   2. Create a **private** bucket named `agrirenta-private`. Keep it non-public, allow `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`, and set the file-size limit to 10 MB.
   3. Deploy the updated `api` Edge Function, then publish the frontend. The Edge Function creates signed upload URLs and short-lived signed read URLs; do not add a service-role key to the browser or make the private bucket public.
   4. As Admin, open the overview and use **Migrate next batch** until it reports that no eligible legacy files remain. The migration is resumable: a batch replaces an old inline file only after its Storage copy succeeds. If a batch fails, its original file remains in `app_state`; resolve the Storage error and retry. If Supabase logs show PostgreSQL `57014` again, pause and investigate the statement timeout or row locks before repeating batches.
   5. After migration, verify the `app_state` size again. Legacy SVG artwork is left inline; uploaded ID images, profile pictures, equipment photos, and supported papers are moved to Storage.

   Do not delete or manually edit the old `app_state` media while migration is in progress. ID and equipment documents must remain in the private bucket; only profile and approved equipment images use the public bucket.

   ## Notes

   - Passwords are handled by Supabase Auth (hashed). The app data table is locked (RLS) and only the Edge Function can access it.
   - New passwords must be at least 8 characters and contain uppercase and lowercase letters, a number, and a special character. Existing passwords are not changed automatically.
   - Customer GCash-style demo checkouts use `custormerggcash.html`. Customers review the actual booking and equipment owner, confirm a simulated payment, and return to that booking. The page never asks for wallet credentials or transfers money; the renter and owner get clickable in-app notifications when the demo payment is recorded. GCash rental requests cannot be declined by owners; COD requests may be declined.
   - The commission ledger records 10% once a rental is returned and customer payment is confirmed. COD must be marked received; the customer GCash checkout is also simulated. AgriRenta automatically sends the owner an in-app support message and notification with the rental total, commission, and 7-day due date. Owners can pay each commission through `PayDemoUIPrototype.html`; the simulated receipt shows the customer rental amount and the commission being settled. Demo payments update the app ledger immediately but do **not** transfer money, count as real collections, or create cash-out funds. Never enter a real GCash PIN or password. Overdue commission restricts new bookings, and disputes pause enforcement. Owner cash-outs are disabled because the app does not hold owner rental funds. Admin cash-outs remain limited to manually verified real collections. The default commission grace period is 7 days and can be set from 1 to 30 days. After a rental is returned and payment is confirmed, the owner dashboard offers commission payment (if due) and renter-rating actions; the pay button opens that commission record. Owners can archive returned rentals, resolved commission records, and completed payment-history entries from their own view. Archived entries do not change balances or booking restrictions. Delete in Archived hides an entry from the owner's lists but keeps the accounting and rental records. Unpaid/disputed commission records and pending payment entries cannot be archived.
   - Owners get in-app reminders when an approved rental passes its end date or a returned COD/GCash rental still needs payment confirmation. If the owner has not confirmed completion/payment within 24 hours, the app alerts Admin with a link to message the owner and blocks new bookings from that owner until the issue is resolved. Returned legacy bookings without a selected supported payment method do not trigger a payment-confirmation restriction. The owner must mark the rental returned and confirm COD receipt; GCash must complete its demo checkout. New notifications appear in a top popup, and opening a notification navigates to its related booking, payment, message, or review item. After a rental is returned, both participants may receive in-app prompts to rate each other. Ratings are optional and have no booking restrictions. These are in-app notifications only; no email, SMS, or push alerts are sent.
   - Commission records and simulated payment receipts are stored in the existing `app_state` JSON data, so no SQL migration is required. Deploy the updated `supabase/functions/api/index.ts` Edge Function and publish `app.html`, `app.css`, `app.js`, `supabase-api.js`, `custormerggcash.html`, and `PayDemoUIPrototype.html`; a frontend-only deploy will not enforce commission rules. Disputes pause enforcement while Admin reviews them. A real GCash integration would require a payment provider and server-side payment verification; the PayDemo screen is only a simulation.
   - "Forgot password?" sends a Supabase recovery email to the address entered on the login form. The recovery link returns to the app's password reset page.
   - In Supabase > Authentication > URL Configuration, allow the app URL as a redirect URL (for example, `https://<your-username>.github.io/agrirenta/**` and your local development URL). Recovery emails require a real, deliverable email address.
   - Supabase's built-in email service has strict sending limits. If recovery requests are rate limited, wait for the limit to reset or configure custom SMTP under Authentication > SMTP Settings.

   ## Google sign-in (optional)

   1. Google Cloud Console: create an OAuth client (Web application).
      - Authorized JavaScript origins: `https://<your-username>.github.io`
      - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   2. Supabase > Authentication > Sign In / Providers > Google: enable, paste Client ID and Client Secret, Save.
   3. Supabase > Authentication > URL Configuration: Site URL = `https://<your-username>.github.io/agrirenta/`
      and add `https://<your-username>.github.io/agrirenta/**` to Redirect URLs.
   4. Re-deploy `supabase/functions/api/index.ts` in the Edge Function editor.

   The "Continue with Google" button is on both the Log in and Create account pages.
   After a person's first Google sign-in, AgriRenta asks them to pick **Customer** or **Equipment owner** (once only).
   Admin accounts sign in with email and password. Use a unique, strong password for the admin account.
