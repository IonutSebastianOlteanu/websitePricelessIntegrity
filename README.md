# websitePricelessIntegrity

## Local development

The project has no `package.json`; there is nothing to install with npm. You need [Node.js](https://nodejs.org/) (for `npx wrangler` and the validation script) and, optionally, Python 3 for a quick static preview.

### 1) Start the site locally

To run the full site, including the booking API (`/api/bookings`), use the Cloudflare Worker dev server:

```bash
npx wrangler dev
```

This serves the website on:

```text
http://localhost:8787
```

See [Local testing with the live database](#local-testing-with-the-live-database) before submitting bookings locally.

For a quick static preview of the pages only (the booking form will not work, because there is no API), you can instead run:

```bash
python -m http.server 8000
```

and open `http://localhost:8000`. On Linux/macOS, `./start_dev.sh` does the same with caching disabled.

### 2) Validate project files

```bash
node validate-site.js
```

This checks that `services.json` and `team.json` are valid JSON and that the required site files are present.

## Notes

- The site is static HTML/CSS/JS served by a Cloudflare Worker (`worker.mjs`), which also handles the booking API.
- The site data is stored in `services.json`, `team.json`, and `contact.json`.
- The owner portal is available in the page and can publish updates through the configured GitHub sync flow.

## Appointment booking setup

Booking requests are stored privately in Cloudflare D1. Owners review them in the owner portal. Confirming a request sends the customer a confirmation email with an `.ics` calendar invite; declining sends an email update.

Before deploying the booking workflow (run `npx wrangler login` once first):

1. The D1 database `booking-service-db` is already configured in `wrangler.jsonc` under the `DB` binding, which `worker.mjs` expects.
2. Apply the database schema with `npx wrangler d1 migrations apply booking-service-db --remote`.
3. Verify a sending domain in Resend, then set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` as Worker secrets with `npx wrangler secret put`.
4. Deploy the site with `npx wrangler deploy`.

The Resend sender must be an address on a domain verified in Resend. The owner portal uses the existing GitHub token and requires write access to the configured repository for booking management. Customer booking details are stored in D1, not in the public site JSON or GitHub repository.

### Local testing with the live database

The D1 binding in `wrangler.jsonc` sets `"remote": true`, so `npx wrangler dev` connects to the live `booking-service-db` database instead of a local copy:

```bash
npx wrangler login   # once, with an account that has access to the database
npx wrangler dev     # http://localhost:8787
```

Bookings made at the local URL are real records: they appear in the owner portal and, when Resend is configured, notify the salon. Use an obviously fake name and email when testing, then remove test rows:

```bash
npx wrangler d1 execute booking-service-db --remote --command "DELETE FROM bookings WHERE customer_email = 'your-test@example.com'"
```

Add local Resend values to `.dev.vars` to test email delivery; that file is ignored by Git. To test against a local database instead, remove `"remote": true` from `wrangler.jsonc`, run `npx wrangler d1 migrations apply booking-service-db --local`, then start `npx wrangler dev`.
