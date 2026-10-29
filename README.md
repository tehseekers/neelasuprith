# Suprith & Neela — a wedding keepsake

A responsive, buildless static website for GitHub Pages and a custom domain. Wedding and reception details are transcribed from the two supplied invitations. Artwork is extracted from the supplied wedding invitation. Three supplied couple photographs are included locally. No invented stories or guest wishes are included. The redundant Instagram screenshot is not published. Confirm permission to publish the supplied artwork. Home addresses and personal phone numbers are deliberately omitted from the public page.

## Publish the website

1. Create a public GitHub repository and upload **the contents of this folder** to its root, including `assets/` and `.nojekyll`.
2. In repository Settings → Pages, publish from the main branch, root folder.
3. For your own domain, enter it in Pages settings and follow GitHub's displayed DNS instructions. Enable HTTPS when available. No domain has been purchased or configured by this deliverable.
4. The invitations, directions, sharing, calendar downloads and countdown work immediately. The shared album and guestbook need the connection below.

The site works at both a repository subpath and a custom-domain root. There is no installation or build step. Open `index.html` to inspect the design locally. For full sharing and upload functionality, use HTTPS hosting.

## Connect the album, wishes and comments

A static page cannot itself retain visitors' submissions. This package uses Supabase for shared data and image storage, with the website itself hosted on GitHub Pages.

1. Create a Supabase project you control.
2. Run `setup.sql` once in its SQL editor.
3. In Authentication, create an email/password account for each member of the couple and confirm the accounts. Disable public signups if they aren't needed.
4. Add each account's UUID as a row in the `owners` table through the dashboard. Only these accounts may upload photos or moderate messages. Do not add any policy allowing visitors to change the owners table.
5. In `config.js`, enter the project URL and its **public anon key**. Never put a service-role key, database password or account password in this repository. Public anon keys are intended for browsers; database and storage policies enforce permissions.
6. Republish. Open “Couple’s photo studio”, sign in, upload a JPG/PNG/WebP under 10 MB, and approve guest messages. Sign-in expires with the access token; sign in again if a request fails after a long session. Passwords and tokens are not saved in browser storage.

Guests can submit wishes and photo comments without an account. They remain pending until the couple approves them. All displayed visitor text is rendered as text, not HTML. Photograph files are public by design. Supabase policies prevent visitors from changing approval state or uploading photographs. Anonymous submission endpoints can receive spam; monitor pending messages and service usage. This package does not include a server-side CAPTCHA or rate limiter.

## Before launch: check the connected service

The backend cannot be verified until connected to your own Supabase project. Verify with two browser sessions:

- As a visitor, send a wish; confirm it is hidden until approved.
- Sign in as an owner, approve it, and refresh the visitor session.
- Upload a photo; open it in the visitor session and add a comment, then approve it.
- Confirm an ordinary account cannot upload or moderate.
- Delete a test message using the studio; manage/remove photographs using the Supabase dashboard (`photos` table and storage bucket).

## Keep it for years

Keep the domain renewed and the hosting and storage accounts active. Back up the database and original photographs regularly. The static page alone does not preserve externally stored content: export approved wishes/comments and the `photos` table, and download the storage bucket. For a future fully offline archive, incorporate these into the repository. No service can promise forever without ongoing ownership and backups.

## Editing

- `index.html`: names, invitation text, itinerary and venue links.
- `style.css`: colours, typography and responsive layout.
- `config.js`: public storage connection.
- `app.js`: countdown, album, submissions and couple's studio.
- `wedding.ics`, `reception.ics`: calendar entries, using UTC equivalents of IST. Reception end time is intentionally unspecified because the invitation says “onwards”.

The supplied photographs are displayed with CSS crops and gradients; the original image pixels are unchanged. Click the editorial photographs to open them in full. These original editorial photographs link to the guestbook for wishes; newly uploaded album photographs support their own moderated comment threads.

Typography loads from Google Fonts, with system serif/sans fallbacks when offline. Artwork is bundled locally.

Reference: [Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control).
