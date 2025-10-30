# Claude Code - Project Context for Votelytics

**📅 Last Updated**: October 30, 2024
**💻 Project Path**: `C:\Users\ADMIN\OneDrive\Documents\projects\votelytics`
**🌐 Project Name**: Votelytics - Electoral Predictions Platform
**🎯 Purpose**: Tamil Nadu Assembly Elections 2026 predictions and analysis

---

## 🚀 PROJECT STATUS

### ✅ COMPLETED (Ready to use)

1. **Full-Stack Application Setup**
   - Monorepo structure with client/ and server/
   - Git repository initialized with 5 commits
   - All dependencies installed and working

2. **Backend (FastAPI + Supabase)**
   - ✅ FastAPI server running on port 8000
   - ✅ 5 SQLAlchemy models created
   - ✅ Database tables created in Supabase PostgreSQL
   - ✅ REST API with 10+ endpoints
   - ✅ Sample data loaded (3 constituencies, 2021 election results)
   - ✅ Interactive API docs at http://localhost:8000/api/docs
   - ✅ CORS configured for ports 5173-5176

3. **Frontend (React + TypeScript)**
   - ✅ React 18 with TypeScript setup
   - ✅ Vite as build tool
   - ✅ Tailwind CSS v4 with PostCSS configured
   - ✅ React Router for navigation
   - ✅ Leaflet map displaying Tamil Nadu
   - ✅ API service layer with Axios
   - ✅ Header component with branding
   - ✅ Home page with interactive map
   - ✅ Loading and error states

4. **Database (Supabase PostgreSQL)**
   - ✅ All 5 tables created and working
   - ✅ Sample data seeded
   - ✅ Connection tested and verified

### 🚧 PENDING (Next Steps)

1. **Constituency Detail Page** - Show historical results, charts, candidate info
2. **Actual GeoJSON Data** - Replace markers with real Tamil Nadu constituency boundaries
3. **Prediction Algorithms** - ML models for forecasting
4. **More Data** - Load full historical election data (2016, 2011, 2006)
5. **State Dashboard** - Overall analysis page
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
│   │   │   └── map/
│   │   │       └── TNMap.tsx      # Leaflet map component
│   │   ├── pages/
│   │   │   └── Home.tsx            # Main page with map
│   │   ├── services/
│   │   │   └── api.ts              # Axios API client
│   │   ├── types/
│   │   │   ├── constituency.ts     # TypeScript interfaces
│   │   │   └── election.ts
│   │   ├── App.tsx                 # Router setup
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
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── constituency.py     # Constituency model
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
│   │   ├── seed_sample_data.py     # Load sample data
│   │   └── test_db.py              # Test connection
│   ├── data/                       # Place CSV/JSON data files here
│   ├── .env                        # Database connection string
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
- **Host**: `db.mksoocqeoylprohcbwtr.supabase.co`
- **Database**: `postgres`
- **Connection String**: In `server/.env`
- **Dashboard**: https://supabase.com/dashboard/project/mksoocqeoylprohcbwtr

### Tables (All Created ✅)

#### 1. constituencies
Tamil Nadu electoral constituencies.

**Key Fields**:
- `id` (PK), `name`, `code`, `district`, `region`
- `population`, `urban_population_pct`, `literacy_rate`
- `extra_data` (JSON), `geojson` (JSON)

**Sample Data**: 3 constituencies
- Chennai Central (TN001)
- Madurai Central (TN134)
- Coimbatore North (TN098)

#### 2. elections
Historical elections.

**Key Fields**:
- `id` (PK), `year`, `name`, `election_type`, `state`
- `election_date`, `total_seats`, `total_voters`, `voter_turnout_pct`

**Sample Data**: 1 election (2021)

#### 3. election_results
Results for each constituency per election.

**Key Fields**:
- `id` (PK), `election_id` (FK), `constituency_id` (FK), `candidate_id` (FK)
- `candidate_name`, `party`, `alliance`
- `votes_received`, `vote_share_pct`
- `is_winner`, `margin`, `margin_pct`
- `extra_data` (JSON)

**Sample Data**: 6 results (2 per constituency for 2021)

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
DATABASE_URL=postgresql://postgres:neO2Q26fgvZkUf%40f@db.mksoocqeoylprohcbwtr.supabase.co:5432/postgres
API_V1_PREFIX=/api
PROJECT_NAME=Votelytics API
SECRET_KEY=votelytics-secret-key-change-in-production
SUPABASE_URL=https://mksoocqeoylprohcbwtr.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

**IMPORTANT**: Password has @ symbol, URL-encoded as %40

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

### Sample Constituencies (3)
1. **Chennai Central** (TN001) - Chennai District
   - Population: 250,000
   - Urban: 95%, Literacy: 85.5%

2. **Madurai Central** (TN134) - Madurai District
   - Population: 180,000
   - Urban: 75%, Literacy: 78.2%

3. **Coimbatore North** (TN098) - Coimbatore District
   - Population: 220,000
   - Urban: 82%, Literacy: 82.5%

### Sample Election (1)
- **2021 Tamil Nadu Legislative Assembly Election**
- Date: April 6, 2021
- 234 total seats
- 62.8M voters, 71.8% turnout

### Sample Results (6)
- Chennai Central: DMK won (52.5% vs AIADMK 44.0%)
- Madurai Central: DMK won (51.2% vs AIADMK 43.7%)
- Coimbatore North: BJP won (49.5% vs DMK 45.1%)

---

## 🎨 FRONTEND COMPONENTS

### TNMap (src/components/map/TNMap.tsx)
Interactive Leaflet map for Tamil Nadu.

**Features**:
- OpenStreetMap base layer
- Constituency markers (temporary - needs GeoJSON)
- Click handlers with popups
- Info box (top-left)
- Legend (bottom-right)
- Centered at [11.0, 78.5] zoom 7

**Props**:
```typescript
constituencies: Constituency[]
onConstituencyClick?: (c: Constituency) => void
```

### Header (src/components/common/Header.tsx)
Navigation header with blue gradient.

**Features**:
- Votelytics logo with BETA badge
- Nav links: Map, Analysis, About
- Mobile menu placeholder

### Home (src/pages/Home.tsx)
Main landing page.

**Features**:
- Full-screen map
- Bottom stats bar (constituencies, seats, voters, year)
- Loading state
- Error handling with retry button
- Fetches data from API on mount

---

## 📝 GIT HISTORY

### Commits Made (5)
1. **Initial Votelytics project setup** - Monorepo structure, FastAPI, React
2. **Add database models and Supabase integration** - 5 SQLAlchemy models
3. **Add REST API endpoints** - Constituencies and elections APIs
4. **Add frontend foundation** - React Router, Tailwind, Header, Home
5. **Add interactive Leaflet map** - TNMap component
6. **Fix Tailwind CSS PostCSS** - PostCSS plugin update
7. **Fix CORS configuration** - Added ports 5173-5176

### Current Branch
`master` (main branch)

---

## 🔮 NEXT STEPS (Priority Order)

### 1. Constituency Detail Page (High Priority)
**Location**: `client/src/pages/ConstituencyDetail.tsx`
**Route**: `/constituency/:id`
**Features**:
- Historical election results (table & chart)
- Vote share trends over time (line chart)
- Candidate information
- Demographics display
- Comparison with neighboring constituencies

**Backend**: Already has endpoint `/api/elections/constituency/{id}/history`

### 2. Tamil Nadu GeoJSON Data (High Priority)
**Location**: `client/public/data/tn-constituencies.geojson`
**Purpose**: Replace markers with actual constituency polygons
**Format**: GeoJSON FeatureCollection
**Integration**: Update TNMap to render GeoJSON with react-leaflet

**Resources**:
- Election Commission of India
- DataMeet India (open data)
- Convert shapefiles to GeoJSON

### 3. Load More Historical Data (Medium Priority)
**Elections to add**:
- 2016 Tamil Nadu Assembly Election
- 2011 Tamil Nadu Assembly Election
- 2006 Tamil Nadu Assembly Election

**Script**: Create `server/scripts/load_election_data.py`
**Data Format**: CSV or JSON
**Location**: `server/data/`

### 4. State Dashboard Page (Medium Priority)
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
4. **Sample data** is minimal (only 3 constituencies)
5. **GeoJSON** boundaries not yet added (using markers)
6. **Tailwind CSS** requires `@tailwindcss/postcss` plugin
7. **Leaflet CSS** must be imported in main.tsx
8. **.env files** should never be committed to git

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

**🎉 Project is fully functional and ready for next development phase!**

**Last Session**: October 30, 2024 - Built complete MVP with interactive map
**Next Session**: Continue with constituency detail page or GeoJSON integration
