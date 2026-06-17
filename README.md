# Budget App for Chris

A full-stack personal budget web application that replaces a manual Excel-based financial tracking system. Runs locally via Docker and is accessible from any device on your home network.

## Features

- **Dashboard** — monthly cash flow charts, annual category spend, upcoming recurring items, savings goal progress
- **Budget Plan** — planned vs actual by category with priority and notes; taxes tracker
- **Income / Expenses** — separate ledgers with Gross, Tax, and Net fields (matching your Excel template)
- **Recurring** — scheduled income/expense templates with one-click record
- **Savings Goals** — sinking fund tracker with progress bars
- **Categories** — user-defined income and expense categories

The app starts **completely blank** with no default data. Dark theme UI with sidebar navigation on desktop and a hamburger drawer on mobile.

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run the app

```bash
docker compose up --build
```

Open in your browser:

- **On this PC:** [http://localhost:8080](http://localhost:8080)
- **On other devices (same Wi‑Fi):** `http://<your-pc-ip>:8080`

Find your PC's IP address:

```powershell
ipconfig
```

Look for the IPv4 address under your active network adapter (e.g. `192.168.1.42`).

### Stop the app

```powershell
docker compose down
```

Data is persisted in a Docker volume (`budget_data`) and survives restarts.

## Security

There is **no login** — the app is intended for a trusted home network only. Do not expose port 8080 to the public internet.

Windows may prompt you to allow inbound connections on port 8080 the first time you run the app.

## Development (without Docker)

### Backend

```bash
cd backend
cp ../.env.example .env
# Edit DATABASE_URL to point to a local PostgreSQL instance
npm install
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:3001`.

## Architecture

| Service | Technology | Port |
|---|---|---|
| web | React + Vite + nginx | 8080 (public) |
| api | Fastify + Prisma | 3001 (internal) |
| db | PostgreSQL 16 | 5432 (internal) |

## Excel Template

The original spreadsheet this app replaces is included in the repo:

**[`docs/budget-plan-template.xlsx`](docs/budget-plan-template.xlsx)**

It has four sheets: Budget Plans, Income Tracking, Expense Tracking, and Graphs. The web app mirrors that structure but starts blank — it does not pre-load the template’s placeholder categories or sample data.

### Sheet mapping

| Excel Sheet | App Page |
|---|---|
| Budget Plans | Budget Plan (+ Taxes section) |
| Income Tracking | Income |
| Expense Tracking | Expenses |
| Graphs | Dashboard |

## License

Private project.
