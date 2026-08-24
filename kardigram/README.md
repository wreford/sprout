# kardigram — technical & operational handover

A greeting-card-by-mail web product: the customer picks an occasion, writes the
note, and chooses an ink colour and typeface. kardigram sets it in type on 300 gsm
cotton, wax-seals it, and mails it anywhere in Canada or the US for one flat price.
A free tier exports the same card as a two-page PDF ecard whose footer advertises
the paid product. Deliberately image-free: no photos, no galleries, no uploads —
typography is the product, and nothing external can break.

## What's in this folder

| Path | What it is |
|---|---|
| `index.html` | The entire customer product. One file, no build, no framework, no dependencies. |
| `admin/index.html` | Owner console — mail-house queue, order status, CSV export, print labels. |
| `plan/index.html` | The business plan as a slide deck — printers, card stock, postage, unit economics, marketing playbook. |

## Architecture

- **Single-file app.** All CSS, JS, and data inline in `index.html`. Served as
  static files from any host — no server, no build step, no npm.
- **Four-step wizard**: occasion → words (headline, ink, typeface, note, optional
  QR link) → address or ecard → review and send. Nothing else to learn.
- **Card design**: pure typography — 12 occasions, 6 ink colours, 3 typefaces
  (display, serif, hand). The live preview is plain CSS; the mailed card and the
  PDF are rendered from the same values.
- **QR codes**: generated in-page by a self-contained encoder (byte mode, EC level M,
  versions 1–10, automatic mask selection). No third-party QR service.
- **PDF ecards**: a two-page PDF (typographic front + inside with scannable QR) is
  built byte-by-byte in the browser — canvas pages wrapped as DCTDecode JPEG
  streams in a hand-rolled PDF 1.4 writer. No library.
- **State**: client-side localStorage — cart (`kardigram-cart-v4`), orders
  (`kardigram-orders`), saved recipients (`kardigram-recips`), sender profile
  (`kardigram-profile`).

## External services

Google Fonts, for the five typefaces — with system-font fallback. That is the
entire list. No APIs, no keys, no rate limits, no images.

## What the product does NOT include (buyer to add)

- **Payments.** Checkout is complete up to charging; Stripe Checkout drops in at
  the `sendCard()` seam.
- **A backend.** Orders live in the customer's browser and reach the operator via
  the admin console workflow. For scale, a small order-intake endpoint replaces that.
- **Fulfillment.** A printer, card stock, and stamps — the plan deck covers exact
  models, costs, and per-card margin (≈64% on the $9 card).

## Operating it today

1. Customer builds a card and sends it — the order is recorded and confirmed.
2. Operator opens `admin/` for the queue, prints the front and inside, addresses
   the envelope, seals, stamps, and mails.
3. Free ecards are self-serve; every PDF footer carries the kardigram call to action.

## Tests

`../tests/kardigram-check.cjs` (Playwright) boots the app, walks the wizard,
builds and validates the two-page PDF, round-trip-decodes the QR, and loads the
admin console. Run a static server from the repo root, then
`node tests/kardigram-check.cjs`.

## Deploying

Copy this folder to any static host. Set the canonical/OG URLs in the `<head>` of
`index.html` if serving from a domain other than kardigram.co.
