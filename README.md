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
- The owner portal is a separate page (`owner.html`) and publishes updates through the configured GitHub sync flow. See [Owner portal](#owner-portal).

## Owner portal

The owner portal is not linked from the public website. Open it directly and bookmark the address:

```text
https://priceless-integrity.com/owner.html
```

`/owner` also works on Cloudflare, but the nginx setup only serves `/owner.html`. Locally, use `http://localhost:8787/owner.html`.

- Unlock it with the password (GitHub token) provided by the administrator. Use **🔒 Lock Panel** to log out.
- The page is hidden, not secret: anyone with the address sees only the password screen. It is marked `noindex` so search engines should not list it.
- Changes are not live until you press **🚀 Publish Changes**, which commits them to GitHub. Unpublished changes are lost if you close or reload the page (the browser warns you first).

### Service sections (Includes, Benefits, Results, Ideal For)

In the **💆 Services** tab, each service has four optional sections, edited as a list of lines:

- **+ Add line** adds a line at the end. Pressing **Enter** inside a line adds a new line below it.
- **✕** deletes a line (you are asked to confirm if the line has text).
- Bullets (`●`) are added automatically on the website, so don't type them.
- A section with no lines is hidden on the website. Empty lines are removed when publishing.

In `services.json`, each section is stored as text with one entry per line (for example `"benefits": "Line one\nLine two"`).

## Appointment booking setup

Booking requests are stored privately in Cloudflare D1. Owners review them in the owner portal. Confirming a request sends the customer a confirmation email with an `.ics` calendar invite; declining sends an email update.

Before deploying the booking workflow (run `npx wrangler login` once first):

1. The D1 database `booking-service-db` is already configured in `wrangler.jsonc` under the `DB` binding, which `worker.mjs` expects.
2. Apply the database schema with `npx wrangler d1 migrations apply booking-service-db --remote`.
3. Onboard the sending domain in Cloudflare Email Service: in the dashboard go to **Compute** > **Email Service** > **Email Sending**, select **Onboard Domain**, and choose `priceless-integrity.com`. Cloudflare adds the SPF, DKIM, DMARC, and bounce DNS records automatically (usually within 5-15 minutes).
4. Deploy the site with `npx wrangler deploy`.

Emails are sent through the `EMAIL` (`send_email`) binding in `wrangler.jsonc`; no API key or secret is needed. The sender address is the `EMAIL_FROM` variable in `wrangler.jsonc` and must be on the onboarded domain. The owner portal uses the existing GitHub token and requires write access to the configured repository for booking management. Customer booking details are stored in D1, not in the public site JSON or GitHub repository.

### Replying as contact@ (email relay)

Mail to `contact@priceless-integrity.com` is handled by the Worker (`email-relay.mjs`) instead of plain forwarding. The Worker delivers each message to the owner's personal inbox with a private Reply-To such as `contact+r-<code>@priceless-integrity.com`. When the owner presses Reply, the Worker sends the reply to the original sender from `contact@priceless-integrity.com`, so the owner's personal address is never shown. Reply addresses are stored in the `relay_threads` D1 table and expire after 180 days; only mail from the owner's address is accepted on them. If relaying fails, the message is forwarded unchanged so incoming mail is not lost.

Setup:

1. Store the owner's personal address as a secret: `npx wrangler secret put OWNER_EMAIL`. It must be a verified destination address in Email Routing.
2. Apply the migrations and deploy (`npx wrangler d1 migrations apply booking-service-db --remote`, then `npx wrangler deploy`).
3. In the Cloudflare dashboard, go to **Compute** > **Email Service** > **Email Routing**:
   - Under **Settings**, enable **Subaddressing**.
   - Under **Routing rules**, edit the `contact@priceless-integrity.com` rule and change its action to **Send to a Worker** > `websitepricelessintegrity`.

Replies and their attachments must be under 4.5 MB in total.

### Local testing with the live database

The D1 binding in `wrangler.jsonc` sets `"remote": true`, so `npx wrangler dev` connects to the live `booking-service-db` database instead of a local copy:

```bash
npx wrangler login   # once, with an account that has access to the database
npx wrangler dev     # http://localhost:8787
```

Bookings made at the local URL are real records: they appear in the owner portal and, once the sending domain is onboarded, email the salon. Use an obviously fake name and email when testing, then remove test rows:

```bash
npx wrangler d1 execute booking-service-db --remote --command "DELETE FROM bookings WHERE customer_email = 'your-test@example.com'"
```

In `wrangler dev`, the email binding is simulated locally and no real email is sent. To test against a local database instead, remove `"remote": true` from `wrangler.jsonc`, run `npx wrangler d1 migrations apply booking-service-db --local`, then start `npx wrangler dev`.
