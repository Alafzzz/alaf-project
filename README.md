# Kerala College Hub (Full Stack)

A CollegeDunia-style full-stack website that lists colleges **only from Kerala**.

## Features

- Kerala-only college directory
- Search by name/city/district
- Filter by district, type, course, and max fees
- Ranking-style card layout (rating, fees, placements, NIRF band)
- Pagination
- REST API backend

## Tech Stack

- Backend: Node.js + Express
- Frontend: HTML, CSS, Vanilla JS
- Data: JSON dataset (`data/colleges.json`)

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open browser:

```text
http://localhost:5000
```

Important: Do not open `public/index.html` directly with `file://` or a separate static server.  
The frontend needs the backend API running to load college names and filters.

## If Backend Connection Fails

1. Run backend:

```bash
npm run dev
```

2. In browser, test API directly:

```text
http://localhost:5000/api/meta
```

If this URL does not return JSON, backend is not running correctly.

## API Endpoints

- `GET /api/meta`
- `GET /api/colleges`
  - Query params:
    - `search`
    - `district`
    - `type`
    - `course`
    - `minFees`
    - `maxFees`
    - `page`
    - `limit`
- `GET /api/colleges/:id`

## Customize dataset

Edit:

- `data/colleges.json`

You can add more Kerala colleges and fields anytime.
