# kardigram — technical & operational handover

A greeting-card-by-mail web product: the customer designs a real card in about two
minutes, kardigram prints it on 300 gsm cotton, hand-writes the note, wax-seals it,
and mails it anywhere in Canada or the US for one flat price. A free tier exports
the same card as a two-page PDF ecard whose footer advertises the paid product.

## What's in this folder

| Path | What it is |
|---|---|
| `index.html` | The entire customer product. One file, no build, no framework, no dependencies. |
| `admin/index.html` | Owner console — mail-house queue, order status, CSV export, print labels. |
| `artist/index.html` | Local-artist submission portal (community art sources). |
| `plan/index.html` | The business plan as a slide deck — printers, card stock, postage, unit economics, marketing playbook. |
| `hero.jpg`, `card-open.jpg` | Product photography. |

## Architecture

- **Single-file app.** All CSS, JS, and data inline in `index.html` (~6.5k lines).
  Served as static files from any host — no server, no build step, no npm.
- **Wizard**: occasion → art → message/attach → local-artist extras → delivery →
  review. A fast mode skips design and extras for reorders.
- **Art sources**: Art Institute of Chicago and Cleveland Museum of Art open-access
  APIs (CC0 artworks), plus customer photo upload (with layouts and filters) and a
  community-artist registry. Graceful fallbacks everywhere an API can fail.
- **QR codes**: generated in-page by a self-contained encoder (byte mode, EC level M,
  versions 1–10, automatic mask selection). No third-party QR service.
  Verified by round-trip decoding across 71 payload sizes.
- **PDF ecards**: a two-page PDF (front + inside, with scannable QR) is built
  byte-by-byte in the browser — canvas pages wrapped as DCTDecode JPEG streams in a
  hand-rolled PDF 1.4 writer. No library.
- **State**: everything client-side in localStorage — cart (`kardigram-cart-v3`),
  orders (`kardigram-orders`), saved recipients (`kardigram-recips`), sender profile
  (`kardigram-profile`), referrals (`kardigram-referral`), community artists
  (`kardigram-community-artists`).

## External services

| Service | Used for | Failure mode |
|---|---|---|
| Google Fonts | display faces | system-font fallback |
| artic.edu / clevelandart.org APIs | museum art search | curated fallbacks shown |
| images.weserv.nl | CORS-safe art fetch for PDF embedding | placeholder panel in PDF |
| en.wikipedia.org / NASA APOD / Open Library | message-step "attach something interesting" previews | fallback content baked in |

No API keys anywhere. Nothing paid. Nothing rate-limited at this usage level.

## What the product does NOT include (buyer to add)

- **Payments.** The checkout flow is complete up to the point of charging; there is
  no payment processor wired in. Stripe Checkout drops in at the `sendCard()` seam.
- **A backend.** Orders live in the customer's browser and reach the operator via
  the admin console workflow. For scale, a small order-intake endpoint (a form POST
  or serverless function) replaces that.
- **Fulfillment.** A printer, card stock, and stamps — the plan deck covers exact
  models, costs, and per-card margin (≈64% on the $9 card).

## Operating it today

1. Customer builds a card and "sends" it — the order is recorded locally and
   surfaced with a confirmation.
2. Operator opens `admin/` for the queue view, prints fronts/insides, addresses the
   envelope, seals, stamps, and mails.
3. Free-tier ecards are self-serve: the customer downloads/shares the PDF directly.
   Every ecard footer carries `KARDIGRAM.CO · SEND A CARD, FREE`.

## Tests

`../tests/kardigram-check.cjs` (Playwright) boots the app, exercises the wizard and
PDF pipeline, and loads the admin and artist pages. Run a static server from the
repo root, then `node tests/kardigram-check.cjs`.

## Deploying

Copy this folder to any static host. Set the canonical/OG URLs in the `<head>` of
`index.html` if serving from a domain other than kardigram.co.
