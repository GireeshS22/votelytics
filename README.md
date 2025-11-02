# Votelytics - Electoral Predictions Platform

**An elegant, data-driven platform for visualizing and predicting electoral outcomes in Tamil Nadu, India.**

🗺️ **Live Demo**: http://localhost:5173 (when running locally)
📚 **API Docs**: http://localhost:8000/api/docs

---

## 🎯 Project Overview

Votelytics is a full-stack web application designed for the Tamil Nadu Assembly Elections 2026. It provides:

- **Interactive Map**: GeoJSON-based map with all 234 Tamil Nadu constituencies
- **Historical Analysis**: Complete 2021 & 2016 election results (8,242 total candidates)
- **Constituency Details**: Detailed view of all candidates with vote counts and margins
- **Party Color Coding**: Visual representation of party performance (15+ parties)
- **Predictions**: Data-driven electoral forecasts with confidence levels (coming soon)
- **Beautiful Visualizations**: Party-wise seat distribution and trends

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **PostgreSQL** (Supabase) - Cloud-hosted database
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Poetry** - Dependency management
- **Pydantic** - Data validation using Python type annotations

### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Leaflet** - Interactive maps library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Database
- **Supabase PostgreSQL** - Cloud PostgreSQL database
- **5 Tables**: constituencies, elections, election_results, candidates, predictions

---

## 📁 Project Structure

```
votelytics/
├── client/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components (Home, etc.)
│   │   ├── services/    # API service layer
│   │   ├── types/       # TypeScript type definitions
│   │   └── utils/       # Helper functions
│   ├── public/          # Static assets
│   └── package.json     # Node dependencies
│
├── server/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API route handlers
│   │   ├── models/      # SQLAlchemy database models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   ├── scripts/         # Database utilities
│   ├── data/            # Raw data files
│   └── pyproject.toml   # Python dependencies (Poetry)
│
├── docs/                # Documentation files
└── README.md            # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Poetry (Python package manager)
- Git

### 1. Clone & Setup

```bash
cd C:\Users\ADMIN\OneDrive\Documents\projects\votelytics
```

### 2. Start Backend (Terminal 1)

```bash
cd server
poetry install  # First time only
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend running on: http://localhost:8000

### 3. Start Frontend (Terminal 2)

```bash
cd client
npm install  # First time only
npm run dev
```

✅ Frontend running on: http://localhost:5173

### 4. Open in Browser

Navigate to: http://localhost:5173

---

## 🗄️ Database Setup

The project uses **Supabase** (cloud PostgreSQL) with Session Pooler:

**Connection Details:**
- Host: `aws-1-ap-southeast-1.pooler.supabase.com` (Session Pooler)
- Database: `postgres`
- Connection configured in: `server/.env`

**Database Schema:**
1. **constituencies** - 234 TN constituencies with GeoJSON boundaries
2. **elections** - 2 historical elections (2021 & 2016)
3. **election_results** - 8,242 detailed results (denormalized for performance)
4. **candidates** - Candidate profiles and backgrounds
5. **predictions** - Electoral forecasts with confidence levels

**Complete Data Loaded:**
- **234 constituencies** with GeoJSON boundaries (100% coverage)
- **2021 Election**: 4,232 candidates across all 234 constituencies
- **2016 Election**: 4,010 candidates across all 234 constituencies
- Party results: DMK 133 (2021), ADMK 134 (2016)
- All vote counts, margins, and ranks included

---

## 📊 API Endpoints

### Constituencies
- `GET /api/constituencies/` - List all constituencies
- `GET /api/constituencies/{id}` - Get constituency details
- `GET /api/constituencies/code/{code}` - Get by constituency code
- `GET /api/constituencies/district/{district}` - Filter by district

### Elections
- `GET /api/elections/` - List all elections
- `GET /api/elections/{id}` - Get election details
- `GET /api/elections/{id}/results` - All results for an election
- `GET /api/elections/constituency/{id}/history` - Historical results
- `GET /api/elections/year/{year}/results` - Results by year

**Interactive API Docs**: http://localhost:8000/api/docs

---

## 🎨 Key Features Implemented

### ✅ Completed (MVP Ready!)
1. **Full Backend API** with FastAPI and Supabase (10+ endpoints)
2. **Complete Database** with 8,242 election results (2021 & 2016)
3. **Real GeoJSON Boundaries** for all 234 Tamil Nadu constituencies
4. **Interactive Leaflet Map** with party color-coding
5. **Constituency Detail Page** showing 2021 & 2016 results side-by-side
6. **Candidate Cards** with vote counts, margins, and rankings
7. **Party Color System** for 15+ political parties
8. **Responsive UI** with Tailwind CSS (mobile, tablet, desktop)
9. **Click Navigation** from map to constituency details
10. **Session Pooler** connection for IPv6 compatibility
11. **Batched Data Loading** scripts for large datasets

### 🚧 Pending (Future Enhancements)
1. **State Dashboard** with overall seat tally and party-wise charts
2. **Comparison Features** - Side-by-side 2021 vs 2016 analysis
3. **More Historical Data** - Load 2011 and 2006 elections
4. **Prediction Algorithms** with ML models for 2026 forecasts
5. **Charts & Visualizations** - Vote share trends, swing analysis
6. **User Polls** and engagement features
7. **Admin Panel** for data management
8. **Authentication** using Supabase Auth

---

## 🐛 Troubleshooting

### Port Already in Use
If ports 5173 or 8000 are busy, the servers will automatically try the next available port.

### CORS Errors
Backend is configured to allow ports: 5173, 5174, 5175, 5176, 3000
Edit `server/app/config.py` to add more ports if needed.

### Database Connection Issues
Check `server/.env` file for correct Supabase credentials.

### Module Not Found
```bash
# Backend
cd server && poetry install

# Frontend
cd client && npm install
```

---

## 📝 Development Notes

### Adding New API Endpoints
1. Create schema in `server/app/schemas/`
2. Create route handler in `server/app/api/`
3. Register router in `server/app/main.py`

### Adding New React Components
1. Create component in `client/src/components/`
2. Define types in `client/src/types/`
3. Use in pages from `client/src/pages/`

### Database Migrations
```bash
cd server
poetry run alembic revision --autogenerate -m "description"
poetry run alembic upgrade head
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with descriptive messages
5. Push and create a pull request

---

## 📄 License

MIT License

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/mksoocqeoylprohcbwtr
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **Leaflet Docs**: https://leafletjs.com/
- **Tailwind CSS**: https://tailwindcss.com/

---

## 📞 Support

For issues or questions, check:
1. The README files in individual folders (client/, server/)
2. API documentation at http://localhost:8000/api/docs
3. Browser console (F12) for frontend errors
4. Terminal logs for backend errors

---

**Built with ❤️ for transparent democracy in Tamil Nadu**

---

## 📈 Project Status

**Current Version**: MVP Complete (October 31, 2024)
**Data Coverage**: 100% (All 234 constituencies, 2021 & 2016 elections)
**Total Records**: 8,242 election results
**Features**: Interactive map, constituency details, party analysis
**Next Milestone**: State dashboard and comparison features

Last Updated: October 31, 2024
