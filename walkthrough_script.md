# SaaSquatch Lead Intelligence: Interview Walkthrough Script & Submission Checklist

This document contains a structured, high-impact 1–2 minute video recording / live demo walkthrough script and the comprehensive submission checklist for the Caprae Capital Full Stack Developer assessment.

---

## Part 1: 1–2 Minute Walkthrough Video Script

**Target Duration**: 90–110 seconds  
**Tone**: Confident, technical, and commercial-minded

---

### [0:00 – 0:20] 1. The Business Problem
> *"Hi everyone, I’m presenting the final SaaSquatch Lead Intelligence platform. Acquisition entrepreneurs and search funds face a major challenge: qualifying prospective B2B targets is time-intensive and noisy. Founders waste hours manually evaluating companies against their investment criteria, wrestling with duplicate records from directory dumps, and losing track of acquisition notes across disparate spreadsheets."*

---

### [0:20 – 0:40] 2. The Solution & Two Most Valuable Features
> *"To solve this, I finalized a dedicated full-stack intelligence dashboard with two standout capabilities:*
> 1. *First, **Real-Time, Dynamic ICP Lead Scoring**: It transparently grades leads from 0 to 100 into Tiers A through D across revenue, industry, headcount, geography, and data completeness—with complete score explanations.*
> 2. *Second, **Non-Destructive Duplicate Detection**: It automatically identifies overlapping domain and normalized company names without deleting records, preventing double-outreach while preserving data integrity."*

---

### [0:40 – 1:10] 3. Live Demonstration (On-Screen Actions)
> *(Action: Expand Target Criteria panel and adjust revenue threshold)*  
> *"Here in the criteria panel, if our search fund adjusts its target revenue criteria or preferred industries, lead scores recalculate instantly, updating the distribution metrics across our 30 accounts."*  
> *(Action: Click a lead row chevron)*  
> *"Expanding any lead reveals the exact mathematical breakdown and why points were awarded, including unbiased neutral handling for missing disclosures."*  
> *(Action: Change status inline to 'Qualified' and open details to add a note)*  
> *"When a target fits, we transition its status right in the table or open the detail panel to record deal notes, which persist immediately to the backend."*  
> *(Action: Click 'Export CSV')*  
> *"Finally, hitting 'Export CSV' exports only our active filtered subset with clean RFC 4180 escaping for downstream outreach."*

---

### [1:10 – 1:30] 4. Technical Stack & Architectural Decisions
> *"Under the hood, the frontend is built with React 18, Vite, and Tailwind CSS. The backend uses Express and TypeScript with Zod validation. For the database, we chose SQLite via `sql.js` (WebAssembly) with automated filesystem snapshotting, providing zero-dependency local setup without requiring a native C++ build toolchain. All weights are mathematically normalized so any custom criteria weights are balanced automatically."*

---

### [1:30 – 1:50] 5. Actual Verification Results & Next Step
> *"For verification: both frontend and backend pass strict TypeScript type checks and production builds. We implemented 60 automated tests covering scoring formulas, weight normalization, duplicate heuristics, CSV escaping, and API route validation—all running in under a second. The database seed is completely idempotent, guaranteeing repeatable testing.*
> *If I were taking this to production next, I would add PostgreSQL connection pooling for multi-instance horizontal scaling and integrate a CRM webhook to automatically sync Tier A leads into HubSpot."*

---

## Part 2: Final Submission Checklist

Ensure each of the following items is verified and complete before submitting your assessment:

- [x] **1. GitHub Repository**
  - Clean repository without committed `node_modules`, `dist/`, `.env` files, or binary artifacts.
  - Root `.gitignore` configured properly.
  - Meaningful commit history representing progressive development and verification.
  - Repository set to public or shared with Caprae Capital reviewers.

- [x] **2. Documentation (`README.md`)**
  - Clear business problem, target personas, and value proposition.
  - Complete technology stack accurately documented (`sql.js`, Express, React 18, Tailwind, Vite, Zod).
  - SQLite schema, persistence strategy, and scoring formula documented.
  - Complete installation, environment configuration, and run commands.
  - Automated testing commands and deployment architecture guidelines.
  - Transparent ethical data considerations and synthetic data notice.

- [x] **3. Synthetic Dataset & Repeatable Seed**
  - 30 comprehensive B2B synthetic records across varied industries and score tiers.
  - Intentional duplicate pairs included to demonstrate duplicate detection.
  - Repeatable, idempotent seeding (`npm run seed` verified).

- [ ] **4. Demo URL (If Deployed)**
  - Optional static deployment on Vercel/Netlify for frontend and Render/Railway for backend.
  - Note: If presenting locally, record screen demonstrating the application on `http://localhost:5173`.

- [ ] **5. Walkthrough Video Recording**
  - 1–2 minute screencast following the script above.
  - Demonstrate: Criteria adjustment, score breakdown drawer, inline pipeline update, note edit, duplicate badge, and CSV export.
  - Clear audio and 1080p video uploaded to Loom, YouTube (unlisted), or Google Drive with open access.

- [ ] **6. Updated Resume**
  - Updated resume highlighting full-stack engineering proficiency (TypeScript, React, Node.js, API design, testing, and system architecture).
