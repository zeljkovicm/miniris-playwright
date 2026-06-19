# MiniRIS — automation test target

MiniRIS is a small, **synthetic** stand-in for a Radiology Information System (RIS). It is
provided as the target application for the Automation Engineer technical exercise. It is not
a real product and contains no real patient data.

It models the core radiology workflow:

```
REGISTERED  ->  SCHEDULED  ->  PERFORMED  ->  REPORTED  ->  SIGNED
   (order)      (schedule)     (exam done)    (draft report) (report signed)
```

## Run it

Requires Docker.

```bash
docker compose up --build
```

Then open:

- Web UI: http://localhost:8000
- API base: http://localhost:8000/api
- Interactive API docs (Swagger): http://localhost:8000/api/docs
- Health check: http://localhost:8000/api/health

The store is in-memory. Restarting the container resets it. You can also reset without a
restart by calling `POST /api/admin/reset` (handy for test isolation).

## Data model

An **order** is an imaging request with: `id`, `patient_name`, `patient_id`, `modality`
(CT/MR/XR/US/MG), `body_part`, `priority` (ROUTINE/URGENT/STAT), `status`, `scheduled_at`,
`report_id`. A **report** has: `id`, `order_id`, `body`, `radiologist`, `status`
(DRAFT/SIGNED), `signed_at`.

The app starts with 8 seeded orders spread across the five statuses.

## API reference

| Method | Path | Purpose | Notes |
|--------|------|---------|-------|
| GET  | `/api/health` | Liveness + config | Returns the projection delay |
| GET  | `/api/orders` | Worklist | Query params: `status`, `modality`, `q` (name or patient id). **Read projection — see below.** |
| POST | `/api/orders` | Create order | Body: patient_name, patient_id, modality, body_part, priority. New order is `REGISTERED`. |
| GET  | `/api/orders/{id}` | Single order | **Authoritative**, always current. |
| POST | `/api/orders/{id}/schedule` | Schedule | Body: `scheduled_at` (ISO datetime). Requires `REGISTERED`. |
| POST | `/api/orders/{id}/perform` | Mark performed | Requires `SCHEDULED`. |
| POST | `/api/reports` | Create draft report | Body: order_id, body, radiologist. Requires order `PERFORMED`; order becomes `REPORTED`. |
| GET  | `/api/reports/{id}` | Single report | |
| POST | `/api/reports/{id}/sign` | Sign report | Requires report `DRAFT`; order becomes `SIGNED`. |
| POST | `/api/admin/reset` | Reset + reseed | |

Invalid state transitions return `409`. Unknown ids return `404`. Invalid request bodies
return `422`.

## Two behaviours you should know about (these are intentional)

1. **The worklist is an eventually-consistent read projection.** After a write (schedule,
   perform, report, sign), `GET /api/orders/{id}` reflects the change immediately, but the
   worklist `GET /api/orders` reflects it only after a short delay (see
   `projection_delay_seconds` from `/api/health`, default 1.5s). This mirrors the read-plane /
   write-plane split of the real system. Treat it as expected behaviour to design around — not
   a bug to report (though we are interested in how you reason about it).

2. **The worklist loads asynchronously in the UI.** The table is populated after the page
   renders; a loading indicator (`data-testid="worklist-loading"`) is shown while it fetches.

## Selector convention

Every element you are likely to need carries a stable `data-testid`. Rows are
`order-row-{id}`, the per-row status cell is `status-{id}`, and the per-row open button is
`open-{id}`. Filters, form fields, and detail-panel actions all have `data-testid`
attributes too. Use them.

## Project layout

```
miniris/
  app/            FastAPI service (models, in-memory store, routes)
  static/         Single-page UI (index.html, app.js, styles.css)
  docs/           architecture.md  (read this for Part 2)
  Dockerfile
  docker-compose.yml
  requirements.txt
```
