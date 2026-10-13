# SaaSquatch Lead Intelligence

An acquisition-focused lead intelligence and pipeline management dashboard engineered for acquisition entrepreneurs and private equity search funds. The application automates ideal customer profile (ICP) scoring, duplicate detection, multi-dimensional filtering, and pipeline tracking across targeted B2B accounts.

> **Data Notice & Ethical Considerations:** All lead records, financial figures, employee counts, and contact metadata in this project are 100% synthetic and generated locally for evaluation and prototype testing. No live third-party scraping, private personal data, or unauthorized telemetry is utilized.

---

## 1. Project Overview & Business Value

### The Business Problem
Acquisition entrepreneurs and search funds face substantial operational friction when qualifying acquisition targets:
- **High Noise-to-Signal Ratio**: Raw lists of prospective businesses often lack uniform qualification data. Sifting through hundreds of targets manually burns valuable founder hours.
- **Inconsistent Evaluation Criteria**: Different team members evaluate revenue, industry alignment, and geographic fit subjectively.
- **Duplicate Overhead**: Data aggregated from public directories frequently contains variations of the same organization (e.g. holding companies, rebranded divisions, or common domains), causing wasted outreach.
- **Fragmented Pipeline Tracking**: Moving leads into outreach and qualification status without a consolidated pipeline tool leads to missed deals.

### Target Users & Expected Business Value
- **Primary Users**: Acquisition entrepreneurs, search funds, micro-PE sponsors, and corporate development analysts.
- **Quantifiable Business Value**:
  - **80%+ Time Reduction** in initial lead screening via real-time algorithmic ICP scoring (Tier A: 80–100, Tier B: 60–79, Tier C: 40–59, Tier D: 0–39).
  - **Zero Duplicate Outreach**: Automatic domain- and company-name clustering highlights duplicate records without destructive deletion.
  - **Rapid Decision Velocity**: Dynamic weight adjustments allow acquisition entrepreneurs to pivot investment theses (e.g. focusing heavily on recurring revenue vs geographic footprint) with instant client-side recalibration.

---

## 2. Implemented Features

| Feature | Description | Implementation Status |
| :--- | :--- | :--- |
| **Dynamic Lead Scoring** | Multi-attribute scoring engine evaluating Revenue Fit (30%), Industry Match (25%), Employee Headcount (20%), Geographic Fit (15%), and Data Completeness (10%). | Verified & Fully Functional |
| **Configurable Criteria** | Collapsible panel allowing searchers to adjust target revenue thresholds, employee ranges, preferred industries, and regions with real-time score updates. | Verified & Fully Functional |
| **Score Explanations** | Interactive drawer and modal showing transparent breakdown of points awarded, normalized weights, contribution, and clear textual rationale. | Verified & Fully Functional |
| **Missing Data Tolerance** | Unbiased scoring: Missing data fields are assigned a neutral 50% baseline score rather than punishing unrated attributes. | Verified & Fully Functional |
| **Multi-Filter & Faceted Search** | Combined keyword search, facet dropdowns (industry, location, status), numeric ranges (revenue, employees, score), and sort controls with active chip indicators and "Clear all" button. | Verified & Fully Functional |
| **Non-Destructive Duplicate Detection** | High-precision domain and normalized company name clustering flags possible duplicates with contextual warnings without deleting user data. | Verified & Fully Functional |
| **Pipeline Management** | Inline status transition selector (`New` → `Contacted` → `Qualified` → `Proposal` → `Closed Won` / `Closed Lost`) with optimistic feedback and backend persistence. | Verified & Fully Functional |
| **Lead Detail & Notes Panel** | Comprehensive modal containing deep company metrics, full score breakdown, editable deal notes with unsaved-change guards, and ESC key support. | Verified & Fully Functional |
| **Filtered CSV Export** | One-click export respecting active filters and sort orders, with RFC 4180-compliant escaping for special characters, commas, and multiline notes. | Verified & Fully Functional |

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 (`react`, `react-dom`)
- **Build Tool**: Vite 5 (`@vitejs/plugin-react`)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS 3.4 + PostCSS + Autoprefixer
- **State & Architecture**: Component-level state with memoized computed derivations (`useMemo`, `useCallback`) and native REST API client (`fetch`)

### Backend
- **Runtime**: Node.js (>= 18; verified on v24.19)
- **Framework**: Express 4.21
- **Language**: TypeScript 5.6 (executed with `tsx`)
- **Database Engine**: SQLite via `sql.js` 1.12 (WebAssembly / pure JavaScript SQLite runtime with automated filesystem persistence snapshots)
- **Validation**: Zod 3.23 schema validation on route query parameters and mutation bodies
- **Cross-Origin**: CORS middleware configured with environment-based origin whitelisting
- **Testing**: Node.js native test runner (`node:test` + `node:assert/strict`)

---

## 4. Architecture & Request Flow

```
┌────────────────────────────────────────────────────────┐
│                   React Dashboard (Vite)               │
│   MetricCards │ CriteriaPanel │ FilterBar │ LeadTable  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (or Vite Proxy)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Express.js REST API                  │
│       CORS Middleware ──► Zod Validation Layer         │
└──────┬────────────────────┬────────────────────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐   ┌─────────────────┐   ┌───────────────┐
│ Scoring      │   │ Duplicate       │   │ CSV           │
│ Engine       │   │ Engine          │   │ Generator     │
└──────┬───────┘   └────────┬────────┘   └───────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
             ┌─────────────────────────────┐
             │    Lead Repository Layer    │
             └──────────────┬──────────────┘
                            ▼
             ┌─────────────────────────────┐
             │ SQLite / sql.js (WebAssembly)│
             │   Sync snapshot to disk     │
             │    (backend/data/leads.db)  │
             └─────────────────────────────┘
```

### Request Lifecycle
1. The frontend initiates requests either directly via `VITE_API_BASE_URL` or through the Vite development proxy (`/api` → `http://localhost:4000`).
2. Express parses query parameters and validates input schemas using Zod.
3. The `leadRepository` queries SQLite for matching lead records.
4. The backend `scoringEngine` calculates dynamic scores based on request criteria, while the `duplicateEngine` analyzes domain and normalized name groupings across the active set.
5. Mutating operations (`PATCH /api/leads/:id/status`, `PATCH /api/leads/:id/notes`) update SQLite in memory and invoke `saveDb()` to flush SQLite database bytes to `backend/data/leads.db`.

---

## 5. SQLite Schema & Data Persistence

### Database Schema
```sql
CREATE TABLE IF NOT EXISTS lead_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  companyName TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,
  estimatedRevenue INTEGER,
  employeeCount INTEGER,
  description TEXT,
  leadScore INTEGER NOT NULL DEFAULT 0,
  scoreTier TEXT NOT NULL DEFAULT 'Unrated',
  scoreReasons TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'New',
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_leadScore ON leads(leadScore);
```

### Data Persistence Strategy
The application utilizes `sql.js` (SQLite compiled to WebAssembly). Upon startup, `initDbConnection()` checks for an existing SQLite binary at `DB_PATH` (`backend/data/leads.db`). If present, it initializes the WebAssembly SQLite database with the stored buffer; otherwise, a fresh database is initialized. 

Whenever records are modified or seeded, `saveDb()` exports the database binary via `dbInstance.export()` and writes the buffer atomically to disk using `fs.writeFileSync`.

---

## 6. Lead-Scoring Formula & Methodology

### Weight Breakdown
The default criteria evaluate leads across 5 weighted dimensions:
- **Revenue Fit (30%)**: Compares `estimatedRevenue` against target minimum and maximum thresholds. Leads within range score 100; leads below scale linearly (`value / min * 100`).
- **Industry Fit (25%)**: Exact match against the preferred industries list scores 100; non-matching scores 0.
- **Employee Count Fit (20%)**: Evaluates `employeeCount` within target ranges.
- **Geographic Fit (15%)**: Case-insensitive substring match against preferred regions (e.g. USA, Canada, UK, Germany).
- **Data Completeness (10%)**: Proportional score based on the presence of the 6 core qualification fields (`website`, `industry`, `location`, `estimatedRevenue`, `employeeCount`, `description`).

### Weight Normalization Formula
When custom weights $w_i$ are provided:
$$\tilde{w}_i = \frac{w_i}{\sum_{k} w_k}$$

The overall lead score is:
$$\text{Score} = \text{clamp}\left(\sum_{i} \left(s_i \cdot \tilde{w}_i\right), 0, 100\right)$$

### Missing Data Handling
To prevent unfair bias against early-stage leads or companies with partial public disclosures, missing numeric or categorical fields receive a neutral score of **50/100** with an explicit breakdown reason (`"Revenue data missing — neutral score applied"`).

### Score Tiers
- **Tier A**: 80 – 100 (High-priority target, ideal ICP fit)
- **Tier B**: 60 – 79 (Strong candidate, minor attribute gap)
- **Tier C**: 40 – 59 (Moderate candidate, outside core thesis)
- **Tier D**: 0 – 39 (Poor fit or disqualified)

---

## 7. API Endpoints

### `GET /api/health`
Health check and environment status.
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "service": "saasquatch-lead-intelligence",
    "environment": "development",
    "timestamp": "2026-10-13T18:15:00.000Z"
  }
  ```

### `GET /api/leads`
Retrieve filtered, scored, and sorted leads with facet metadata.
- **Query Parameters**:
  - `search` (string): Keyword filter against company name, website, and industry.
  - `industry`, `location`, `status` (string): Exact facet filters.
  - `minRevenue`, `maxRevenue` (integer): Financial range filter.
  - `minEmployees`, `maxEmployees` (integer): Headcount filter.
  - `minScore`, `maxScore` (integer, 0–100): Calculated score range filter.
  - `sortBy` (`companyName` | `estimatedRevenue` | `employeeCount` | `leadScore`): Sort property.
  - `sortDir` (`asc` | `desc`): Sort direction.
  - `targetMinRevenue`, `targetMaxRevenue`, `preferredIndustries`, etc.: Custom scoring parameters.
- **Response** (`200 OK`):
  ```json
  {
    "data": [
      {
        "id": "00000000-0000-4000-a000-000000000001",
        "companyName": "NimbusCloud Solutions",
        "website": "https://nimbuscloud.example.com",
        "industry": "SaaS",
        "location": "San Francisco, CA, USA",
        "estimatedRevenue": 45000000,
        "employeeCount": 320,
        "leadScore": 87,
        "scoreTier": "A",
        "status": "Qualified",
        "isDuplicate": true,
        "duplicateReason": "Shares website domain \"nimbuscloud.example.com\" with 1 other record",
        "breakdown": [...]
      }
    ],
    "count": 1,
    "total": 30,
    "facets": { "industries": ["SaaS"], "locations": ["San Francisco, CA, USA"], "statuses": ["Qualified"] },
    "criteria": { ... }
  }
  ```

### `GET /api/leads/:id`
Fetch a single lead with complete score breakdown and audit fields.

### `PATCH /api/leads/:id/status`
Update a lead's pipeline status.
- **Body**: `{ "status": "Contacted" }`
- **Response** (`200 OK`): Updated lead object.

### `PATCH /api/leads/:id/notes`
Update acquisition notes for a lead.
- **Body**: `{ "notes": "Meeting scheduled with founder on Thursday." }`
- **Response** (`200 OK`): Updated lead object.

### `GET /api/leads/export`
Stream an RFC 4180-compliant CSV export matching the active filter query parameters.
- **Response** (`200 OK`): `Content-Type: text/csv`, file download attachment.
- **Response** (`204 No Content`): When filters return 0 records.

---

## 8. Prerequisites & Installation

### Prerequisites
- **Node.js**: >= 18.0.0 (tested on Node v24.19)
- **npm**: >= 9.0.0

### Step-by-Step Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd LeadGeneration

# 2. Setup backend
cd backend
npm install
cp .env.example .env

# 3. Setup frontend
cd ../frontend
npm install
cp .env.example .env
```

---

## 9. Environment Configuration

### Backend (`backend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `PORT` | `4000` | Backend HTTP port |
| `DB_PATH` | `./data/leads.db` | Filesystem path for SQLite database snapshot |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for browser requests |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:4000` | Base URL for Express API (empty string uses Vite dev proxy) |

---

## 10. Database Initialization & Repeatable Seeding

The SQLite database schema is created automatically on first server boot. To initialize or reset the dataset deterministically:

```bash
cd backend
npm run seed
```

- **Repeatable Behavior**: The seed script uses deterministic UUIDs and clears existing leads prior to inserting. Running `npm run seed` once or ten times will always produce exactly **30 synthetic records** (including intentional domain- and name-matched duplicate test pairs).

---

## 11. Running, Building, Type-Checking & Testing

### Development Mode
In separate terminal windows:

```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend Dashboard
cd frontend
npm run dev
```

- **Backend API URL**: `http://localhost:4000`
- **Frontend Dashboard URL**: `http://localhost:5173`

### Production Build & Type-Check
```bash
# Backend verification
cd backend
npm run typecheck    # TypeScript compiler check without emitting files
npm run build        # Transpiles TypeScript to dist/

# Frontend verification
cd frontend
npm run typecheck    # TypeScript compiler check
npm run build        # Production bundle via Vite
```

### Automated Testing
The backend includes lightweight, comprehensive automated tests utilizing Node's native test runner (`node:test`):

```bash
cd backend
npm test
```

**Test Coverage**:
- CSV escaping and RFC 4180 formatting (`src/engine/csv.test.ts`)
- URL domain parsing, corporate suffix stripping, and duplicate detection (`src/engine/duplicates.test.ts`)
- Scoring calculations, tier mappings, and weight normalization (`src/engine/scoring.test.ts`)
- API endpoints, query filtering, 400 validation error handling, 404 handling, and status/notes persistence (`src/routes/leads.test.ts`)

---

## 12. Deployment Architecture & Production Considerations

### Recommended Deployment Setup
- **Frontend**: Deploy to **Vercel** or **Cloudflare Pages** as a static single-page application.
  - Set Environment Variable: `VITE_API_BASE_URL=https://your-api.onrender.com`
- **Backend**: Deploy to **Render**, **Railway**, or **Fly.io** as a Node.js web service.
  - Set Environment Variables:
    - `NODE_ENV=production`
    - `PORT=10000`
    - `CORS_ORIGIN=https://your-frontend.vercel.app`
    - `DB_PATH=./data/leads.db`

### Data Persistence Note on Ephemeral Hosting
The prototype persists SQLite by exporting bytes to local disk storage (`DB_PATH`). On ephemeral serverless platforms (such as standard Render/Heroku instances without persistent disks), filesystem writes are reset on service redeploys.
- **For production deployments requiring durable multi-instance storage**, configure **Render Persistent Disks** or migrate the repository layer to a managed PostgreSQL database (e.g. Neon or Supabase) with connection pooling.

---

## 13. Data Sourcing & Ethical Transparency

- **100% Synthetic Data**: All companies, employee counts, revenue figures, and descriptions in `src/db/seed.ts` are synthetic records designed for testing.
- **No Scraping or PII**: No external websites were scraped, and no private personally identifiable information (PII) is stored or processed.
- **UI Labeling**: The dashboard top bar and overview cards explicitly designate the environment as running against synthetic data.

---

## 14. Known Limitations & Future Improvements

1. **Database Concurrency**: `sql.js` snapshots the database file on mutation. For multi-tenant production scale, replacing this with a client-server RDBMS (PostgreSQL) would provide row-level locking and ACID transactions across multiple server instances.
2. **Batch Pipeline Actions**: Currently, status transitions are performed per lead. Future enhancements could include bulk status updating and multi-select tags.
3. **CRM Webhook Integrations**: Adding bidirectional webhooks to push qualified Tier A leads directly into HubSpot, Salesforce, or Attio.
