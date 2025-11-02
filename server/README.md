# Votelytics Backend (FastAPI)

**FastAPI backend server for Votelytics electoral predictions platform**

---

## 📁 Directory Structure

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration & environment variables
│   ├── database.py          # Database connection & session management
│   │
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── constituency.py  # Constituency model
│   │   ├── election.py      # Election & ElectionResult models
│   │   ├── candidate.py     # Candidate model
│   │   └── prediction.py    # Prediction model
│   │
│   ├── schemas/             # Pydantic schemas for API validation
│   │   ├── __init__.py
│   │   ├── constituency.py  # Constituency schemas
│   │   └── election.py      # Election schemas
│   │
│   ├── api/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── constituencies.py  # Constituency endpoints
│   │   └── elections.py       # Election endpoints
│   │
│   ├── services/            # Business logic (future)
│   │   └── __init__.py
│   │
│   └── utils/               # Helper functions (future)
│       └── __init__.py
│
├── scripts/                 # Utility scripts
│   ├── init_db.py              # Create all database tables
│   ├── load_2021_data.py       # Load complete 2021 election data (4,232 candidates)
│   ├── load_2016_data.py       # Load complete 2016 election data (4,010 candidates)
│   ├── load_geojson.py         # Load GeoJSON boundaries for all constituencies
│   ├── verify_2016_data.py     # Verify 2016 data quality
│   ├── force_drop_tables.py    # Drop tables with raw SQL
│   └── test_db.py              # Test connection
│
├── data/                        # Election data files
│   ├── 10- Detailed Results_2021.xlsx   # 2021 election data (4,232 candidates)
│   ├── 2016 Detailed Results.xlsx       # 2016 election data (4,010 candidates)
│   └── tn_ac_2021.geojson               # GeoJSON boundaries (1MB, 234 constituencies)
│
├── tests/                   # Unit tests (future)
│   └── __init__.py
│
├── alembic/                 # Database migrations (future)
│   └── versions/
│
├── .env                     # Environment variables (DO NOT COMMIT)
├── .env.example             # Environment template
├── pyproject.toml           # Poetry dependencies
└── README.md                # This file
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd server
poetry install
```

This will install:
- fastapi
- uvicorn[standard]
- sqlalchemy
- psycopg2-binary
- python-dotenv
- alembic
- pydantic-settings

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase Session Pooler credentials:

```env
# Use Session Pooler for IPv4/IPv6 compatibility
DATABASE_URL=postgresql://postgres.mksoocqeoylprohcbwtr:YOUR_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

**Note**: Password with @ symbol should be URL-encoded as %40

### 3. Initialize Database

```bash
poetry run python scripts/init_db.py
```

This creates all 5 tables in Supabase with audit fields (created_at, updated_at).

### 4. Load Complete Election Data

```bash
# Load 2021 election data (4,232 candidates)
poetry run python scripts/load_2021_data.py

# Load 2016 election data (4,010 candidates) - uses batched inserts
poetry run python scripts/load_2016_data.py

# Load GeoJSON boundaries for all 234 constituencies
poetry run python scripts/load_geojson.py
```

Total data loaded: 234 constituencies, 8,242 election results across 2 elections.

### 5. Run Development Server

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server will run on: http://localhost:8000

---

## 🗄️ Database Models

### 1. Constituency
Stores Tamil Nadu constituency information with GeoJSON boundaries.

**Fields:**
- `id` - Primary key
- `ac_number` - Assembly Constituency number (1-234)
- `name` - Constituency name (e.g., "Gummidipoondi")
- `code` - Unique code (e.g., "TN001")
- `district` - District name (e.g., "Thiruvallur")
- `region` - Region (North/South/Central/West)
- `population` - Population count
- `urban_population_pct` - Urban percentage
- `literacy_rate` - Literacy percentage
- `geojson` - JSON field for GeoJSON boundaries (MultiPolygon)
- `extra_data` - JSON field for additional data
- `created_at`, `updated_at` - Audit timestamps

**Data**: All 234 constituencies with GeoJSON boundaries loaded

### 2. Election
Stores election information.

**Fields:**
- `id` - Primary key
- `year` - Election year (e.g., 2021)
- `name` - Election name
- `election_type` - Type (Assembly/Lok Sabha)
- `state` - State name (Tamil Nadu)
- `election_date` - Date of election
- `total_seats` - Total seats contested
- `total_voters` - Total registered voters
- `voter_turnout_pct` - Turnout percentage
- `created_at`, `updated_at` - Audit timestamps

**Data**: 2 elections loaded (2021 and 2016)

### 3. ElectionResult (Denormalized for Performance)
Stores results for each constituency in an election with denormalized fields.

**Fields:**
- `id` - Primary key
- `election_id` - Foreign key to elections
- `constituency_id` - Foreign key to constituencies
- `candidate_id` - Foreign key to candidates (nullable)
- **Denormalized fields**: `year`, `ac_number`, `ac_name`, `total_electors`
- `candidate_name`, `sex`, `age`, `category` - Candidate demographics
- `party`, `symbol`, `alliance` - Party information
- `general_votes`, `postal_votes`, `total_votes` - Vote breakdown
- `vote_share_pct` - Vote share percentage
- `rank` - Candidate ranking (1st, 2nd, 3rd, etc.)
- `is_winner` - 1 if winner, 0 otherwise
- `margin`, `margin_pct` - Victory margins (for winners & runners-up)
- `extra_data` - JSON field
- `created_at`, `updated_at` - Audit timestamps

**Data**: 8,242 election results loaded
- 2021: 4,232 candidates (DMK won 133 seats)
- 2016: 4,010 candidates (ADMK won 134 seats)

### 4. Candidate
Stores candidate information.

**Fields:**
- `id` - Primary key
- `name` - Candidate name
- `party` - Political party
- `alliance` - Alliance
- `constituency_id` - Foreign key to constituencies
- `age`, `gender`, `education`, `profession` - Demographics
- `is_incumbent` - 1 if sitting MLA
- `previous_elections_contested` - Count
- `previous_wins` - Count
- `bio` - Biography text
- `extra_data` - JSON field (for criminal cases, assets, etc.)
- `photo_url` - Photo URL

### 5. Prediction
Stores electoral predictions.

**Fields:**
- `id` - Primary key
- `constituency_id` - Foreign key to constituencies
- `predicted_year` - Which election year
- `predicted_winner_party` - Predicted winning party
- `predicted_winner_name` - Predicted candidate name
- `confidence_level` - Safe/Likely/Lean/Toss-up
- `win_probability` - 0.0 to 1.0
- `predicted_vote_share` - Predicted percentage
- `predicted_margin_pct` - Predicted margin
- `top_candidates` - JSON array of predictions
- `swing_from_last_election` - Swing percentage
- `key_factors` - Text explanation
- `prediction_model` - Model used
- `last_updated` - Timestamp
- `created_at` - Timestamp
- `extra_data` - JSON field

---

## 📡 API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /api/health` - Health check

### Constituencies
- `GET /api/constituencies/` - List all (with pagination, filters)
  - Query params: `skip`, `limit`, `district`, `region`
- `GET /api/constituencies/{id}` - Get by ID
- `GET /api/constituencies/code/{code}` - Get by code
- `GET /api/constituencies/district/{district}` - Get all in district
- `POST /api/constituencies/` - Create new (admin)

### Elections
- `GET /api/elections/` - List all
  - Query params: `skip`, `limit`, `year`, `election_type`
- `GET /api/elections/{id}` - Get by ID
- `GET /api/elections/{id}/results` - Get all results
  - Query params: `skip`, `limit`, `party`, `winner_only`
- `GET /api/elections/constituency/{id}/history` - Historical results for constituency
- `GET /api/elections/year/{year}/results` - Results for specific year

---

## 🔧 Configuration

### Environment Variables (`.env`)

```env
# Database (Session Pooler for IPv4/IPv6 compatibility)
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# API
API_V1_PREFIX=/api
PROJECT_NAME=Votelytics API

# Security
SECRET_KEY=your-secret-key-change-in-production

# Supabase (optional)
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Important**: Use Session Pooler instead of direct connection for better IPv6 support and connection management.

### CORS Configuration

Configured in `app/config.py`:

```python
CORS_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:5174",  # Alternative ports
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
    # Add production URLs here
]
```

---

## 🧪 Testing

```bash
# Run tests (when implemented)
poetry run pytest

# Run with coverage
poetry run pytest --cov=app tests/
```

---

## 📝 Development Workflow

### Adding a New Endpoint

1. **Create Schema** (`app/schemas/your_model.py`):
```python
from pydantic import BaseModel

class YourModelResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
```

2. **Create Route** (`app/api/your_routes.py`):
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

@router.get("/", response_model=List[YourModelResponse])
def get_items(db: Session = Depends(get_db)):
    return db.query(YourModel).all()
```

3. **Register Router** (`app/main.py`):
```python
from app.api import your_routes
app.include_router(your_routes.router, prefix="/api/your-endpoint", tags=["Your Tag"])
```

### Database Migrations (Alembic)

```bash
# Initialize (first time only)
poetry run alembic init alembic

# Create migration
poetry run alembic revision --autogenerate -m "description"

# Apply migration
poetry run alembic upgrade head

# Rollback
poetry run alembic downgrade -1
```

---

## 🐛 Troubleshooting

### Database Connection Failed
- Check `.env` file has correct Supabase credentials
- Verify password is URL-encoded (@ becomes %40)
- Test connection: `poetry run python scripts/test_db.py`

### Import Errors
```bash
poetry install
```

### Port 8000 Already in Use
```bash
# Use different port
poetry run uvicorn app.main:app --port 8001 --reload
```

### CORS Errors
Add the frontend port to `CORS_ORIGINS` in `app/config.py`

---

## 📦 Key Dependencies

- **fastapi** (0.120+) - Web framework
- **uvicorn** (0.38+) - ASGI server
- **sqlalchemy** (2.0+) - ORM
- **psycopg2-binary** (2.9+) - PostgreSQL adapter
- **pydantic** (2.12+) - Data validation
- **pydantic-settings** (2.11+) - Settings management
- **alembic** (1.17+) - Database migrations
- **python-dotenv** (1.2+) - Environment variables

---

## 🔐 Security Notes

- Never commit `.env` file
- Change `SECRET_KEY` in production
- Use environment variables for sensitive data
- Implement authentication for admin endpoints
- Validate all user inputs with Pydantic
- Use parameterized queries (SQLAlchemy does this)

---

## 📊 Performance Tips

- Use pagination for large datasets
- Add database indexes on frequently queried fields
- Use connection pooling (already configured)
- Cache frequently accessed data
- Use async endpoints for I/O operations

---

## 🔗 Useful Commands

```bash
# Start server
poetry run uvicorn app.main:app --reload

# Start with custom port
poetry run uvicorn app.main:app --port 8001 --reload

# Shell access
poetry shell

# View dependencies
poetry show

# Update dependencies
poetry update

# Add new dependency
poetry add package-name

# Run Python script
poetry run python script.py
```

---

## 📊 Current Data Status

**Constituencies**: 234/234 (100% complete with GeoJSON)
**Elections**: 2 (2021 & 2016)
**Election Results**: 8,242 total records
**Scripts**: Batched loading for large datasets
**Connection**: Session Pooler for IPv6 support

---

**Last Updated**: October 31, 2024
