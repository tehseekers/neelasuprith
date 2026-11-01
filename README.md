# Suprith & Neela — a wedding keepsake

A responsive, buildless static website for GitHub Pages and a custom domain. Wedding and reception details are transcribed from the two supplied invitations. Artwork is extracted from the supplied wedding invitation. Three supplied couple photographs are included locally. No invented stories or guest wishes are included. The redundant Instagram screenshot is not published. Confirm permission to publish the supplied artwork. Home addresses and personal phone numbers are deliberately omitted from the public page.

## Publish the website

1. Create a public GitHub repository and upload **the contents of this folder** to its root, including `assets/` and `.nojekyll`.
2. In repository Settings → Pages, publish from the main branch, root folder.
3. For your own domain, enter it in Pages settings and follow GitHub's displayed DNS instructions. Enable HTTPS when available. No domain has been purchased or configured by this deliverable.
4. The invitations, directions, sharing, calendar downloads and countdown work immediately. The shared album and guestbook need the connection below.

The site works at both a repository subpath and a custom-domain root. There is no installation or build step. Open `index.html` to inspect the design locally. For full sharing and upload functionality, use HTTPS hosting.

## Guestbook: GitHub Pages + Cloudflare D1 (selected setup)

The static website stays on GitHub Pages. Wishes are stored in Cloudflare D1 through the Worker in `cloudflare/`. This replaces Supabase for wishes when `wishesApiUrl` is configured. No Supabase account is needed for this guestbook. D1 does not use Supabase's weekly inactivity-pause model; free daily usage limits still apply. No service guarantees permanent free hosting or zero outages.

### One-time deployment

Use a Cloudflare account on the Workers Free plan. From this project directory:

```sh
cd cloudflare
npx wrangler login
npx wrangler d1 create wedding-wishes
```

Copy the database ID printed by the create command into `cloudflare/wrangler.jsonc`, replacing `REPLACE_WITH_DATABASE_ID`. Set `ALLOWED_ORIGINS` to your site's origin, for example `https://yourname.github.io` (no repository path or trailing slash). For a custom domain use its HTTPS origin. Multiple origins can be comma-separated. Do not include `null` or a wildcard. For a local HTTP preview you can explicitly add its origin temporarily.

Then, from the `cloudflare` directory:

```sh
npx wrangler d1 migrations apply wedding-wishes --remote
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

At the secret prompt, enter a long, unique random access key and keep it in your password manager. This key controls moderation; never put it in `config.js`, source files, or GitHub. The CLI stores it as a Cloudflare Worker secret.

Copy the HTTPS workers.dev URL returned by deployment into `wishesApiUrl` in `config.js`, then republish your GitHub Pages site. The public URL is safe to commit. Leave the Supabase fields blank if you only want D1 wishes.

### Guest and couple experience

- Anyone can submit a name and wish without an account. Submissions are saved as pending.
- Open **Couple’s guestbook studio** and enter your private access key to approve or delete pending wishes. The key stays in page memory until sign-out or reload; use a trusted device.
- Approved wishes appear publicly. Use Refresh to reload them.
- The studio can download up to 10,000 approved wishes as `wishes.txt`. The public page displays the latest 100 wishes.
- Each IP is limited to three valid submissions per minute through Cloudflare's rate limiter. Limits are approximate and local to Cloudflare locations; shared networks may share the allowance. A honeypot also filters basic automated submissions. Origin restrictions are browser controls, not proof that a visitor is human.

Verify after deployment: submit a test wish in one browser, approve it in the studio in another browser, then refresh the public guestbook. Confirm it survives a page reload. The hosted service has not been provisioned or tested by the local source changes.

### Backups and limits

Export the database periodically from the `cloudflare` directory:

```sh
npx wrangler d1 export wedding-wishes --remote --output wishes-backup.sql
```

Keep this backup outside the public website folder. The GitHub repository holds code, not live submissions. D1 storage and Worker requests have free-plan quotas. Requests can fail when free allowances are exhausted; there is no paid upgrade configured by this code.

References: [D1 setup](https://developers.cloudflare.com/d1/get-started/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Worker rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

### Existing photo features

The supplied photographs still work without a backend. The older Supabase photo-upload and photo-comment integration is retained as an optional feature (`setup.sql` and the two Supabase config fields). The D1 studio handles wishes only; it does not upload photos. If D1 and Supabase are both configured, the studio manages D1 wishes and the existing public Supabase album remains readable. Add new local photos through the repository, or configure the older integration separately if needed.

### Local verification

```sh
node --check app.js
node --test cloudflare/worker.test.mjs
```

## Keep it for years

Keep the domain renewed and the hosting and storage accounts active. Back up the database and original photographs regularly. The static page alone does not preserve externally stored content: export approved wishes/comments and the `photos` table, and download the storage bucket. For a future fully offline archive, incorporate these into the repository. No service can promise forever without ongoing ownership and backups.

## Editing

- `index.html`: names, invitation text, itinerary and venue links.
- `style.css`: colours, typography and responsive layout.
- `config.js`: public Worker URL and optional legacy Supabase connection.
- `app.js`: countdown, album, submissions and couple's studio.
- `cloudflare/`: wishes API, D1 migration, deployment configuration and API tests.
- `wedding.ics`, `reception.ics`: calendar entries, using UTC equivalents of IST. Reception end time is intentionally unspecified because the invitation says “onwards”.

The supplied photographs are displayed with CSS crops and gradients; the original image pixels are unchanged. Click the editorial photographs to open them in full. These original editorial photographs link to the guestbook for wishes; newly uploaded album photographs support their own moderated comment threads.

Typography loads from Google Fonts, with system serif/sans fallbacks when offline. Artwork is bundled locally.

Reference: [Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Visual refinement

Each supplied photograph now has one placement: the hero, the quiet-moment interlude, and the proposal album. The closing section uses a typographic monogram instead of repeating a photograph. The additional-photo heading stays hidden until uploaded photos exist. The guestbook includes a character count, empty state, refresh action, whitespace validation, and an invisible honeypot to discourage basic automated spam. The honeypot is a lightweight browser measure, not a server-side rate limiter.
