# websitePricelessIntegrity

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Start the site locally

```bash
npm start
```

This serves the website on:

```text
http://localhost:8000
```

### 3) Validate project files

```bash
npm run validate
```

This checks that the required JSON files and site assets are present and valid.

## Notes

- The project is a static HTML/CSS/JS site.
- The site data is stored in `services.json` and `team.json`.
- The owner portal is available in the page and can publish updates through the configured GitHub sync flow.

## Appointment booking setup

Booking requests are stored privately in Cloudflare D1. Owners review them in the owner portal. Confirming a request sends the customer a confirmation email with an `.ics` calendar invite; declining sends an email update.

Before deploying the booking workflow:

1. Create the D1 database with `npx wrangler d1 create websitepricelessintegrity-bookings` and replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` with the returned ID.
2. Apply the database schema with `npx wrangler d1 migrations apply websitepricelessintegrity-bookings --remote`.
3. Verify a sending domain in Resend, then set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` as Worker secrets with `npx wrangler secret put`.
4. Deploy the site with `npx wrangler deploy`.

The Resend sender must be an address on a domain verified in Resend. The owner portal uses the existing GitHub token and requires write access to the configured repository for booking management. Customer booking details are stored in D1, not in the public site JSON or GitHub repository.

For local API testing, run `npx wrangler d1 migrations apply websitepricelessintegrity-bookings --local`, then start `npx wrangler dev`. Add local Resend values to `.dev.vars` to test email delivery; that file is ignored by Git.
