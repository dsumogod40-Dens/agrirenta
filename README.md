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
| Admin | ops@agrirenta.example (2FA code: `123456`) |

The sample owners/customers (`owner.demo01@example.com` ... `customer.demo08@example.com`),
105 equipment listings, 27 reviews and 64 messages are created automatically the first time the site is opened.

## Setup

1. Supabase: create project `agrirenta` (region: Southeast Asia / Singapore).
2. SQL Editor: run `supabase/schema.sql`.
3. Edge Functions: create function `api`, paste `supabase/functions/api/index.ts`, Deploy, turn **Verify JWT** off.
4. Put the Project URL and Publishable key in `supabase-config.js`.
5. Push this folder to GitHub, then Settings > Pages > Deploy from branch `main` / `(root)`.
6. Open `https://<your-username>.github.io/<repo-name>/app.html` once, then log in.

Never put the `service_role` / `secret` key in any file of this repository.

## Notes

- Passwords are handled by Supabase Auth (hashed). The app data table is locked (RLS) and only the Edge Function can access it.
- The GCash screen is an academic demo. No real payment is processed.

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
Admin accounts can only sign in with email + password + 2FA code.
