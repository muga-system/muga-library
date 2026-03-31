# Performance smoke check

Run these commands to compare response times before and after a deployment.

## 1) Public routes

```bash
curl -s -o /dev/null -w "login ttfb=%{time_starttransfer}s total=%{time_total}s code=%{http_code}\n" "https://muga-library.vercel.app/iniciar-sesion"
curl -s -o /dev/null -w "home ttfb=%{time_starttransfer}s total=%{time_total}s code=%{http_code}\n" "https://muga-library.vercel.app/"
curl -s -o /dev/null -w "admin ttfb=%{time_starttransfer}s total=%{time_total}s code=%{http_code}\n" "https://muga-library.vercel.app/admin"
```

## 2) Repeat for preview URL

Replace the domain with your preview deployment URL.

## 3) Manual UX validation

- Login and measure time to first usable paint on `/admin`.
- Navigate `/` -> `/libro/[id]` -> `/solicitar/[recordId]` and confirm no extra auth stalls.
- Search in `/buscar` and confirm response feels immediate for common queries.
