# Claude Code - Project Context for Votelytics

**📅 Last Updated**: October 31, 2024
**💻 Project Path**: `C:\Users\ADMIN\OneDrive\Documents\projects\votelytics`
**🌐 Project Name**: Votelytics - Electoral Predictions Platform
**🎯 Purpose**: Tamil Nadu Assembly Elections 2026 predictions and analysis

---

## 🚀 PROJECT STATUS

### ✅ COMPLETED (Ready to use)

1. **Full-Stack Application Setup**
   - Monorepo structure with client/ and server/
   - Git repository initialized with 7+ commits
   - All dependencies installed and working

2. **Backend (FastAPI + Supabase)**
   - ✅ FastAPI server running on port 8000
   - ✅ 5 SQLAlchemy models with denormalized fields for performance
   - ✅ Database tables created in Supabase PostgreSQL
   - ✅ REST API with 10+ endpoints
   - ✅ **FULL DATA LOADED**: 234 constituencies, 3 elections (2021, 2016 & 2011)
   - ✅ **10,940 election results** (4,232 for 2021 + 3,960 for 2016 + 2,748 for 2011)
   - ✅ Interactive API docs at http://localhost:8000/api/docs
   - ✅ CORS configured for ports 5173-5176
   - ✅ Session Pooler connection for IPv6 compatibility

3. **Frontend (React + TypeScript)**
   - ✅ React 18 with TypeScript setup
   - ✅ Vite as build tool
   - ✅ Tailwind CSS v4 with PostCSS configured
   - ✅ React Router for navigation
   - ✅ **Leaflet map with real GeoJSON boundaries** (234 constituencies)
   - ✅ **Constituency Detail Page** - Complete with 2021 & 2016 results
   - ✅ **Party color coding system** for 15+ political parties
   - ✅ API service layer with Axios
   - ✅ Header component with branding
   - ✅ Home page with interactive map
   - ✅ Loading and error states
   - ✅ Responsive design (mobile, tablet, desktop)

4. **Database (Supabase PostgreSQL)**
   - ✅ All 5 tables created and working
   - ✅ **Complete 2021 election data** (234 constituencies, 4,232 candidates)
   - ✅ **Complete 2016 election data** (234 constituencies, 4,010 candidates)
   - ✅ GeoJSON boundaries stored for all constituencies
   - ✅ Connection tested and verified (Session Pooler)
   - ✅ Year tracking and audit fields on all tables

### 🚧 PENDING (Next Steps)

1. **State Dashboard** - Overall analysis page with party-wise seat distribution
2. **Prediction Algorithms** - ML models for forecasting 2026 results
3. **More Historical Data** - Load 2011 and 2006 election data
4. **Comparison Features** - Compare 2021 vs 2016 side-by-side
5. **Charts & Visualizations** - Vote share trends, swing analysis
6. **User Polls** - Engagement features

---

## 📁 PROJECT STRUCTURE

```
votelytics/
├── client/                  # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── common/
│   │   │   │   └── Header.tsx
│   │   │   ├── constituency/        # NEW: Constituency detail components
│   │   │   │   ├── CandidateCard.tsx    # Individual candidate display
│   │   │   │   ├── ConstituencyHeader.tsx  # Header with back button
│   │   │   │   └── ElectionResults.tsx     # All candidates for one year
│   │   │   └── map/
│   │   │       └── TNMap.tsx      # Leaflet map with GeoJSON polygons
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Main page with map
│   │   │   └── ConstituencyDetail.tsx  # NEW: Constituency detail page
│   │   ├── services/
│   │   │   └── api.ts              # Axios API client
│   │   ├── types/
│   │   │   ├── constituency.ts     # TypeScript interfaces
│   │   │   └── election.ts
│   │   ├── utils/
│   │   │   └── partyColors.ts      # NEW: Party color mapping (15+ parties)
│   │   ├── App.tsx                 # Router setup (2 routes)
│   │   ├── main.tsx                # Entry point (imports Leaflet CSS)
│   │   └── index.css               # Tailwind imports
│   ├── .env                        # VITE_API_URL=http://localhost:8000/api
│   ├── package.json                # Dependencies
│   ├── tailwind.config.js          # Tailwind config
│   ├── postcss.config.js           # Uses @tailwindcss/postcss
│   └── vite.config.ts              # Vite config
│
├── server/                  # Backend (FastAPI + Supabase)
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Settings, CORS, env vars
│   │   ├── database.py             # SQLAlchemy engine & session
│   │   ├── models/                 # SQLAlchemy ORM models (with audit fields)
│   │   │   ├── constituency.py     # Constituency model (with GeoJSON)
│   │   │   ├── election.py         # Election & ElectionResult models
│   │   │   ├── candidate.py        # Candidate model
│   │   │   └── prediction.py       # Prediction model
│   │   ├── schemas/                # Pydantic schemas
│   │   │   ├── constituency.py
│   │   │   └── election.py
│   │   └── api/                    # API route handlers
│   │       ├── constituencies.py   # Constituency endpoints
│   │       └── elections.py        # Election endpoints
│   ├── scripts/
│   │   ├── init_db.py              # Create tables
│   │   ├── load_2021_data.py       # Load 2021 election data
│   │   ├── load_2016_data.py       # Load 2016 election data (batched)
│   │   ├── load_2011_data.py       # Load 2011 election data from parsed CSV
│   │   ├── parse_2011_pdf.py       # Parse 2011 PDF to CSV
│   │   ├── load_geojson.py         # Load GeoJSON boundaries
│   │   ├── verify_all_elections.py # Verify all elections data
│   │   ├── force_drop_tables.py    # Drop tables with raw SQL
│   │   └── test_db.py              # Test connection
│   ├── data/                       # Election data files
│   │   ├── 10- Detailed Results_2021.xlsx  # 2021 election data
│   │   ├── 2016 Detailed Results.xlsx      # 2016 election data
│   │   ├── 2011.pdf                        # 2011 election data (PDF)
│   │   ├── 2011_parsed_data.csv            # 2011 parsed data (CSV)
│   │   └── tn_ac_2021.geojson              # GeoJSON boundaries (1MB)
│   ├── .env                        # Session Pooler connection string
│   ├── .env.example                # Template
│   ├── pyproject.toml              # Poetry dependencies
│   └── README.md
│
├── docs/                    # Documentation
│   └── README.md
│
├── .gitignore               # Git ignore patterns
├── README.md                # Main documentation
└── CLAUDE_CONTEXT.md        # This file
```

---

## 🗄️ DATABASE SCHEMA (Supabase PostgreSQL)

### Connection Details
- **Host**: `aws-1-ap-southeast-1.pooler.supabase.com` (Session Pooler - IPv4/IPv6 compatible)
- **Database**: `postgres`
- **Connection String**: In `server/.env` (uses Session Pooler)
- **Dashboard**: https://supabase.com/dashboard/project/mksoocqeoylprohcbwtr
- **Note**: Changed to Session Pooler to fix IPv6 DNS resolution issues

### Tables (All Created ✅)

#### 1. constituencies
Tamil Nadu electoral constituencies.

**Key Fields**:
- `id` (PK), `ac_number` (AC 1-234), `name`, `code`, `district`, `region`
- `population`, `urban_population_pct`, `literacy_rate`
- `geojson` (JSON) - **All 234 constituencies have GeoJSON boundaries**
- `extra_data` (JSON)
- `created_at`, `updated_at` (audit fields)

**Data Loaded**: **234 constituencies** (100% complete)
- All Tamil Nadu Assembly constituencies
- GeoJSON boundaries loaded for all (from GitHub: baskicanvas/tamilnadu-assembly-constituency-maps)
- AC numbers 1-234 with proper district mapping

#### 2. elections
Historical elections.

**Key Fields**:
- `id` (PK), `year`, `name`, `election_type`, `state`
- `election_date`, `total_seats`, `total_voters`, `voter_turnout_pct`
- `created_at`, `updated_at` (audit fields)

**Data Loaded**: **3 elections**
- 2021 Tamil Nadu Assembly Election (ID: 1) - April 6, 2021
- 2016 Tamil Nadu Assembly Election (ID: 4) - May 16, 2016
- 2011 Tamil Nadu Assembly Election (ID: 5) - May 13, 2011

#### 3. election_results
Results for each constituency per election (denormalized for performance).

**Key Fields**:
- `id` (PK), `election_id` (FK), `constituency_id` (FK), `candidate_id` (FK)
- **Denormalized fields**: `year`, `ac_number`, `ac_name`, `total_electors`
- `candidate_name`, `sex`, `age`, `category`
- `party`, `symbol`, `alliance`
- `general_votes`, `postal_votes`, `total_votes`, `vote_share_pct`
- `rank`, `is_winner`, `margin`, `margin_pct`
- `extra_data` (JSON)
- `created_at`, `updated_at` (audit fields)

**Data Loaded**: **10,940 election results**
- 2021: 4,232 candidates across 234 constituencies (234 winners)
- 2016: 3,960 candidates across 234 constituencies (232 winners)
- 2011: 2,748 candidates across 234 constituencies (234 winners)
- **2021 Party Results**: DMK 133 seats, ADMK 66 seats, INC 18 seats, PMK 5 seats, BJP 4 seats, Others 8
- **2016 Party Results**: ADMK 134 seats, DMK 89 seats, INC 8 seats, IUML 1 seat
- **2011 Party Results**: AIADMK 150 seats, DMDK 29 seats, DMK 23 seats, CPM 10 seats, CPI 9 seats, Others 13

#### 4. candidates
Candidate profiles.

**Key Fields**:
- `id` (PK), `name`, `party`, `alliance`, `constituency_id` (FK)
- `age`, `gender`, `education`, `profession`
- `is_incumbent`, `previous_elections_contested`, `previous_wins`
- `bio`, `extra_data` (JSON), `photo_url`

**Sample Data**: None yet

#### 5. predictions
Electoral forecasts.

**Key Fields**:
- `id` (PK), `constituency_id` (FK), `predicted_year`
- `predicted_winner_party`, `predicted_winner_name`
- `confidence_level`, `win_probability`
- `predicted_vote_share`, `predicted_margin_pct`
- `top_candidates` (JSON), `swing_from_last_election`
- `key_factors`, `prediction_model`
- `last_updated`, `created_at`, `extra_data` (JSON)

**Sample Data**: None yet

---

## 📡 API ENDPOINTS (All Working ✅)

### Base URL
```
http://localhost:8000/api
```

### Constituencies
- `GET /api/constituencies/` - List all (pagination, filters: district, region)
- `GET /api/constituencies/{id}` - Get by ID
- `GET /api/constituencies/code/{code}` - Get by code (e.g., TN001)
- `GET /api/constituencies/district/{district}` - Filter by district
- `POST /api/constituencies/` - Create new (admin)

### Elections
- `GET /api/elections/` - List all (filters: year, election_type)
- `GET /api/elections/{id}` - Get by ID
- `GET /api/elections/{id}/results` - All results for election (filters: party, winner_only)
- `GET /api/elections/constituency/{id}/history` - Historical results for constituency
- `GET /api/elections/year/{year}/results` - Results for specific year

### Health
- `GET /` - Root endpoint
- `GET /api/health` - Health check

**Interactive Docs**: http://localhost:8000/api/docs (FastAPI auto-generated)

---

## 🔧 CONFIGURATION

### Backend (.env)
```env
# Session Pooler connection (IPv4/IPv6 compatible)
DATABASE_URL=postgresql://postgres.mksoocqeoylprohcbwtr:neO2Q26fgvZkUf%40f@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
API_V1_PREFIX=/api
PROJECT_NAME=Votelytics API
SECRET_KEY=votelytics-secret-key-change-in-production
SUPABASE_URL=https://mksoocqeoylprohcbwtr.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

**IMPORTANT**:
- Using Session Pooler (not direct connection) to support IPv6
- Password has @ symbol, URL-encoded as %40

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

### CORS Configuration
Located in `server/app/config.py`:
```python
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
    # Also 127.0.0.1 variants
]
```

---

## 🏃 HOW TO RUN

### Prerequisites
- Python 3.10+
- Node.js 18+
- Poetry (Python package manager)
- Git

### Start Backend (Terminal 1)
```bash
cd server
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
✅ Backend: http://localhost:8000

### Start Frontend (Terminal 2)
```bash
cd client
npm run dev
```
✅ Frontend: http://localhost:5173 (or 5174/5175/5176 if busy)

### Access Application
Open browser: http://localhost:5173

---

## 🛠️ KEY TECHNOLOGIES

### Backend Stack
- **FastAPI 0.120+** - Web framework
- **SQLAlchemy 2.0+** - ORM
- **Pydantic 2.12+** - Data validation
- **Psycopg2 2.9+** - PostgreSQL driver
- **Uvicorn 0.38+** - ASGI server
- **Pandas 2.3+** - Data manipulation
- **pdfplumber 0.11+** - PDF parsing
- **Poetry** - Dependency management

### Frontend Stack
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **Leaflet 1.x** - Maps
- **React Router 6** - Routing
- **Axios 1.x** - HTTP client
- **Recharts 2.x** - Charts (installed, not used yet)

### Database
- **PostgreSQL 17** (Supabase cloud)
- **PostGIS** - Available for geospatial

---

## 🐛 KNOWN ISSUES & FIXES

### Issue 1: CORS Error
**Problem**: Frontend shows "blocked by CORS policy"
**Solution**: Add frontend port to `CORS_ORIGINS` in `server/app/config.py`
**Status**: ✅ Fixed (ports 5173-5176 added)

### Issue 2: Tailwind PostCSS Error
**Problem**: "tailwindcss directly as PostCSS plugin" error
**Solution**: Install `@tailwindcss/postcss` and update `postcss.config.js`
**Status**: ✅ Fixed

### Issue 3: Metadata Reserved Name
**Problem**: SQLAlchemy error "Attribute name 'metadata' is reserved"
**Solution**: Renamed `metadata` field to `extra_data` in all models
**Status**: ✅ Fixed

### Issue 4: Password URL Encoding
**Problem**: Database connection failed with @ in password
**Solution**: URL-encode password (@ becomes %40)
**Status**: ✅ Fixed

---

## 📊 CURRENT DATA

### Complete Constituencies (234)
- **All 234 Tamil Nadu Assembly constituencies loaded**
- AC numbers 1 to 234
- Districts: All 38 districts covered
- GeoJSON boundaries: 100% coverage
- Sample constituencies:
  1. **Gummidipoondi** (AC 1) - Thiruvallur District
  2. **Sriperumbudur** (AC 29) - Kanchipuram District
  3. **Dr.Radhakrishnan Nagar** (AC 11) - Chennai District

### Complete Elections (3)
1. **2021 Tamil Nadu Assembly Election**
   - Date: April 6, 2021
   - 234 total seats, 4,232 candidates
   - **DMK Alliance won**: DMK 133, INC 18, PMK 5, Others (Total: 164 seats)
   - **AIADMK Alliance**: ADMK 66, BJP 4 (Total: 70 seats)

2. **2016 Tamil Nadu Assembly Election**
   - Date: May 16, 2016
   - 234 total seats, 3,960 candidates
   - **ADMK won**: 134 seats (absolute majority)
   - **DMK**: 89 seats, INC: 8 seats, IUML: 1 seat

3. **2011 Tamil Nadu Assembly Election**
   - Date: May 13, 2011
   - 234 total seats, 2,748 candidates
   - **AIADMK Alliance won**: AIADMK 150, CPM 10, CPI 9, Others (Total: 204 seats)
   - **DMK Alliance**: DMK 23, Others (Total: 30 seats)

### Complete Results (10,940)
- **2021**: 4,232 candidates with complete vote data
- **2016**: 3,960 candidates with complete vote data
- **2011**: 2,748 candidates with complete vote data
- All elections include: general votes, postal votes, vote share %, ranks, margins
- All winners identified for all three elections (2021: 234, 2016: 232, 2011: 234)

---

## 🎨 FRONTEND COMPONENTS

### Pages

#### Home (src/pages/Home.tsx)
Main landing page with interactive map.

**Features**:
- Full-screen Leaflet map with GeoJSON boundaries
- Color-coded constituencies by party (2021 results)
- Bottom stats bar (constituencies, seats, next election, voters)
- Loading state with spinner
- Error handling with retry button
- Click navigation to constituency detail page
- Map legend showing party seat counts

#### ConstituencyDetail (src/pages/ConstituencyDetail.tsx) **NEW**
Detailed view of constituency election results.

**Features**:
- Displays 2021 results at top, 2016 results below
- Back button to map
- Constituency header with AC number, district
- Complete candidate list for both years
- Winner highlighted prominently
- Vote counts, vote share %, margins
- Loading and error states

### Map Components

#### TNMap (src/components/map/TNMap.tsx)
Interactive Leaflet map with real GeoJSON boundaries.

**Features**:
- **Real GeoJSON polygons** (not markers) for all 234 constituencies
- OpenStreetMap base layer
- Party color-coded fills (15+ parties supported)
- Hover effects (highlight boundary)
- Click handlers to navigate to detail page
- Popups showing constituency info and winner
- Info box (top-left) with year and constituency count
- Legend (bottom-right) showing top 6 parties with seat counts
- Responsive design

**Props**:
```typescript
constituencies: ConstituencyWithWinner[]
onConstituencyClick?: (c: ConstituencyWithWinner) => void
```

### Constituency Components

#### ConstituencyHeader (src/components/constituency/ConstituencyHeader.tsx) **NEW**
Header section for constituency detail page.

**Features**:
- Back button to map
- Constituency name, AC number, code
- District and region display
- Population and literacy stats (if available)

#### ElectionResults (src/components/constituency/ElectionResults.tsx) **NEW**
Display all candidates for one election year.

**Features**:
- Winner card (large, prominent)
- Grid of other candidates (3 cols desktop, responsive)
- Total candidates count
- Total votes and voter turnout %
- Sort by rank

**Props**:
```typescript
year: number
results: ElectionResult[]
title: string
```

#### CandidateCard (src/components/constituency/CandidateCard.tsx) **NEW**
Individual candidate information card.

**Features**:
- Candidate name, party, votes
- Party color-coded left border
- Vote share percentage
- Winner badge and margin (for winners)
- Rank display (#2, #3, etc.)
- Age, gender, category
- General vs postal votes breakdown
- Hover effects

**Props**:
```typescript
result: ElectionResult
isWinner?: boolean
```

### Common Components

#### Header (src/components/common/Header.tsx)
Navigation header with blue gradient.

**Features**:
- Votelytics logo with BETA badge
- Nav links: Map, Analysis, About
- Mobile menu placeholder

### Utilities

#### partyColors.ts (src/utils/partyColors.ts) **NEW**
Party color mapping and formatting utilities.

**Features**:
- Color codes for 15+ Tamil Nadu political parties
- DMK (Red), AIADMK (Green), BJP (Orange), INC (Blue), etc.
- `getPartyColor(party)` - Returns hex color
- `formatPartyName(party)` - Formats party abbreviations
- Default gray for unknown parties

---

## 📝 GIT HISTORY

### Recent Commits (7+)
1. **Initial Votelytics project setup** - Monorepo structure, FastAPI, React
2. **Add database models and Supabase integration** - 5 SQLAlchemy models
3. **Add REST API endpoints** - Constituencies and elections APIs
4. **Add frontend foundation** - React Router, Tailwind, Header, Home
5. **Add interactive Leaflet map** - TNMap component
6. **Fix Tailwind CSS PostCSS** - PostCSS plugin update
7. **Fix CORS configuration** - Added ports 5173-5176
8. **Add comprehensive documentation for all folders** - Updated READMEs
9. **Add GeoJSON boundaries** - Loaded all 234 constituency polygons
10. **Load 2021 election data** - 4,232 candidates complete
11. **Load 2016 election data** - 3,960 candidates complete
12. **Implement constituency detail page** - Complete with 4 new components
13. **Load 2011 election data from PDF** - 2,748 candidates parsed and loaded

### Current Branch
`master` (main branch)

### Important Technical Changes
1. **Database Schema Redesign** (Oct 31): Added year tracking and audit fields to all tables
2. **Session Pooler Migration** (Oct 31): Switched from direct connection to Session Pooler for IPv6 support
3. **GeoJSON Integration** (Oct 31): Replaced markers with real constituency boundaries
4. **Batched Data Loading** (Oct 31): Implemented batched inserts (500 records) to avoid timeouts
5. **PDF Parsing Integration** (Nov 1): Added pdfplumber library for extracting data from PDF documents

---

## 🔮 NEXT STEPS (Priority Order)

### ✅ COMPLETED
1. ~~Constituency Detail Page~~ - **DONE**: Shows 2021 & 2016 results with all candidates
2. ~~Tamil Nadu GeoJSON Data~~ - **DONE**: All 234 constituencies with boundaries
3. ~~Load 2016 Election Data~~ - **DONE**: 3,960 candidates loaded
4. ~~Load 2011 Election Data~~ - **DONE**: 2,748 candidates loaded from PDF

### 1. State Dashboard Page (High Priority)
**Location**: `client/src/pages/Analysis.tsx`
**Route**: `/analysis`
**Features**:
- Overall seat tally for 2021, 2016, and 2011
- Party-wise distribution (pie chart)
- Alliance comparison across three elections
- Battleground constituencies (close margins)
- Swing analysis (2011 → 2016 → 2021)
- Geographic distribution by district
- Voter turnout trends over 10 years

**Backend**: Already has all 3 elections data, just needs aggregation queries

### 2. Comparison Features (High Priority)
**Location**: Add to `ConstituencyDetail.tsx`
**Features**:
- Side-by-side comparison of 2021 vs 2016 vs 2011
- Vote swing analysis for the constituency
- Candidate performance comparison
- Toggle view between years
- Swing charts showing party performance changes

### 3. Load More Historical Data (Medium Priority)
**Elections to add**:
- 2006 Tamil Nadu Assembly Election

**Script**: Follow pattern from `parse_2011_pdf.py` and `load_2011_data.py` if PDF format
**Data Format**: PDF or Excel
**Location**: `server/data/`
**Note**: 2011 data already loaded (2,748 candidates)

### 4. Charts & Visualizations (Medium Priority)
**Location**: `client/src/pages/Analysis.tsx`
**Route**: `/analysis`
**Features**:
- Overall seat tally
- Party-wise distribution
- Alliance comparison
- Battleground constituencies
- Swing analysis
- Geographic distribution

### 5. Prediction System (Low Priority)
**Approach**:
- Simple model: Last election + swing
- ML model: Logistic regression on historical data
- Ensemble: Combine multiple models

**Backend**: Use prediction model & populate predictions table
**Frontend**: Display on map & detail pages

---

## 💡 TECHNICAL NOTES

### Why These Choices?

**FastAPI**: Automatic API docs, async support, Pydantic validation
**Supabase**: Free tier, PostgreSQL, no local setup, dashboard UI
**Poetry**: Better dependency resolution than pip
**Vite**: 10x faster than CRA, native ESM
**Tailwind**: Utility-first, no CSS files, consistent design
**Leaflet**: Open-source, lightweight, customizable

### Performance Considerations
- Backend: SQLAlchemy connection pooling enabled
- Frontend: Vite HMR for instant updates
- Database: Indexes on id, code, district (built-in)
- API: Pagination on all list endpoints

### Security Notes
- SECRET_KEY needs to be changed in production
- .env files in .gitignore (not committed)
- CORS configured (not using wildcard)
- Pydantic validates all inputs
- SQLAlchemy uses parameterized queries

---

## 📚 USEFUL RESOURCES

### Project Links
- Supabase Dashboard: https://supabase.com/dashboard/project/mksoocqeoylprohcbwtr
- API Docs: http://localhost:8000/api/docs (when running)
- Frontend: http://localhost:5173 (when running)

### External Docs
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/
- Leaflet: https://leafletjs.com/
- Tailwind CSS: https://tailwindcss.com/
- Supabase: https://supabase.com/docs
- SQLAlchemy: https://docs.sqlalchemy.org/

### Data Sources (Future)
- Election Commission of India: https://eci.gov.in/
- DataMeet India: https://github.com/datameet
- Tamil Nadu CEO: https://www.tndecodevaluators.com/

---

## 🎯 PROJECT VISION

**Short Term** (Next 2 months):
- Complete constituency detail pages
- Add real GeoJSON boundaries
- Load 2016, 2011, 2006 election data
- Build state dashboard

**Medium Term** (3-6 months):
- Implement prediction algorithms
- User polls and engagement
- Candidate database
- Mobile responsive

**Long Term** (6+ months):
- Extend to other Indian states
- Lok Sabha elections
- User accounts and profiles
- Real-time results on election day
- Mobile app (React Native)

---

## ⚠️ IMPORTANT REMINDERS

1. **Both servers must be running** for the app to work
2. **CORS is configured** for specific ports only
3. **Database password** has @ symbol (URL-encoded)
4. **Complete data loaded**: 234 constituencies, 3 elections, 10,940 results
5. **Tailwind CSS** requires `@tailwindcss/postcss` plugin
6. **Leaflet CSS** must be imported in main.tsx
7. **.env files** should never be committed to git
8. **PDF parsing** requires pdfplumber for extracting election data from PDFs

---

## 🔄 TO RESUME DEVELOPMENT

1. **Pull latest code** (if in version control)
2. **Start backend**: `cd server && poetry run uvicorn app.main:app --reload`
3. **Start frontend**: `cd client && npm run dev`
4. **Open browser**: http://localhost:5173
5. **Check Supabase**: Verify database is accessible
6. **Read this file** to understand current state
7. **Check README files** in each folder for details

---

**🎉 Project is fully functional with complete data and working features!**

**Last Session**: November 1, 2024 - Major milestone achieved:
- ✅ Loaded complete 2011 election data from PDF (2,748 candidates)
- ✅ Implemented PDF parsing with pdfplumber library
- ✅ Total of 10,940 election results across 3 elections (2021, 2016, 2011)
- ✅ Created parse_2011_pdf.py to extract tabular data from PDF
- ✅ Created load_2011_data.py following existing patterns
- ✅ All 3 elections now complete with party-wise breakdowns

**Previous Session**: October 31, 2024:
- ✅ Loaded complete 2021 & 2016 election data
- ✅ Integrated GeoJSON boundaries for all 234 constituencies
- ✅ Built constituency detail page with 4 new components
- ✅ Implemented party color coding system
- ✅ Fixed IPv6 connectivity with Session Pooler

**Next Session**: Build state dashboard page or add comparison features (now with 3 elections!)
**Project Status**: MVP complete with 10 years of historical data (2011-2021). Ready for analytics and prediction features.
