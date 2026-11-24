# Fieldwork Africa — Historical Image Collection Survey (Frontend Prototype)

Frontend-only prototype for the Fieldwork Africa Historical Image Collection Survey. It demonstrates participant survey collection, draft saving, administrative review, link management, and export workflows in a browser-based environment.

> **Prototype only:** No backend, no Supabase, no external database, no real authentication service, and no cross-device synchronization. Data is stored locally in the browser (IndexedDB/local browser storage).

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- SheetJS (`xlsx`) for CSV/Excel-compatible import parsing

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Routes

- `/manage` — Management utility (administrative password protected)
- `/survey/:token` — Participant survey link (no participant login/registration)

## Prototype workflow

### Management (`/manage`)
- Unlock administrative access with the configured prototype password.
- Generate one participant link or bulk links.
- Import participants from CSV/XLSX.
- Search/filter participant records.
- Copy IDs/links, close/reopen links.
- Export participant registry, survey data, and image metadata as CSV.
- Create demo records (new, incomplete, complete).

### Participant survey (`/survey/:token`)
- Consent confirmation.
- Participant information (age group, gender, region, country, preferred contact, contact value).
- Neutral photographs (min 2, max 4).
- Head poses (min 2, max 4).
- Historical photographs (min 5, max 16) with metadata.
- Save Draft (browser-local persistence).
- Review and quality checklist.

### Administrative review
- Unlock admin access from the survey or management page.
- Review quality checks and activity history.
- Request corrections (participant can edit when reopened).
- Approve & lock submission.
- Reopen for team-only or participant editing.
- Close/reopen participant link.
- Mark approved submission as forwarded.

## Data/storage notes

- Participant records and images are stored in browser IndexedDB for prototype demonstration.
- Images are compressed client-side before storage where possible.
- Clearing browser storage/resetting prototype data removes local records.
- This prototype is not suitable for production data collection as-is.

## Deployment

Configured for Vercel static SPA deployment (`vercel.json` rewrite to `index.html`).
