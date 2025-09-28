# Plant Dashboard (Phase 1 — static)

A lightweight, mobile‑friendly dashboard to record moisture readings (0–10) and get a fast decision: **Water / Hold / Check tomorrow**.  
All data is saved in your browser **localStorage** (no backend required). Import/Export JSON as needed.

## Files
- `index.html` — single‑page app
- `app.js` — logic + localStorage
- `favicon.svg` — icon
- `manifest.webmanifest` — installable on phone (optional)

## Deploy (Nginx Proxy Manager on Unraid)
1. Copy the folder contents to your web root (e.g., a mounted volume used by your static site container or NPM).
2. In **Nginx Proxy Manager**, create a new **Proxy Host** for `plant.itskikisworld.com` (or root later):
   - **Forward Hostname/IP**: your static file server container (e.g., `static-site`)
   - **Forward Port**: whatever the container serves (e.g., 8080)
   - Toggle **Websockets** (safe) and **Block Common Exploits**.
   - Under **SSL**, request a new Let's Encrypt certificate, Force SSL, and HTTP/2+3.
3. Visit the site, add plants, and save readings. Use Export/Import to back up to Git.

## Rules
Defaults are: water ≤ 3; check 4–5; hold ≥ 6. Edit via **Settings**.

## Next (Phase 2 ideas)
- Per‑plant thresholds (UI already reserved; plug in later).
- Weather‑aware hints (BOM/CF API) and “estimated soil moisture”.
- Sensor inputs (BLE/Wi‑Fi) posting to an endpoint the page can poll.
- Optional service worker for offline caching and “stale reading” badge.
