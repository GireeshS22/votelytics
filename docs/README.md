# Votelytics Documentation

**Project documentation for Votelytics electoral predictions platform**

---

## 📚 Documentation Index

This folder contains comprehensive documentation for the Votelytics project.

### Current Documentation Files

1. **README.md** (this file) - Documentation index
2. **(Future)** API.md - Complete API documentation with examples
3. **(Future)** DEPLOYMENT.md - Deployment guides for various platforms
4. **(Future)** CONTRIBUTING.md - Contribution guidelines
5. **(Future)** ARCHITECTURE.md - System architecture and design decisions
6. **(Future)** DATABASE.md - Database schema and migration guides

---

## 🗺️ Quick Links

- [Root README](../README.md) - Main project overview
- [Server README](../server/README.md) - Backend documentation
- [Client README](../client/README.md) - Frontend documentation
- [API Documentation](http://localhost:8000/api/docs) - Interactive API docs (when server is running)

---

## 📖 Documentation Structure

### For Developers

**Getting Started:**
1. Read the [Root README](../README.md) for project overview
2. Review [Server README](../server/README.md) for backend setup
3. Review [Client README](../client/README.md) for frontend setup
4. Check API docs at http://localhost:8000/api/docs

**Code Organization:**
- Backend: FastAPI + SQLAlchemy + Supabase PostgreSQL
- Frontend: React + TypeScript + Vite + Leaflet
- Database: 5 tables (constituencies, elections, election_results, candidates, predictions)

**Development Workflow:**
1. Start backend: `cd server && poetry run uvicorn app.main:app --reload`
2. Start frontend: `cd client && npm run dev`
3. Open browser: http://localhost:5173

---

## 🗄️ Database Schema

### Tables Overview

1. **constituencies** - Tamil Nadu electoral constituencies
   - Fields: id, name, code, district, region, population, demographics, geojson

2. **elections** - Historical elections
   - Fields: id, year, name, election_type, state, election_date, statistics

3. **election_results** - Results per constituency per election
   - Fields: id, election_id, constituency_id, candidate_name, party, votes, winner, margin

4. **candidates** - Candidate profiles
   - Fields: id, name, party, alliance, constituency_id, demographics, background

5. **predictions** - Electoral forecasts
   - Fields: id, constituency_id, predicted_year, predicted_winner, confidence, probability

See [Server README](../server/README.md) for detailed schema.

---

## 🔌 API Endpoints Reference

### Base URL
```
http://localhost:8000/api
```

### Constituencies
- `GET /constituencies/` - List all
- `GET /constituencies/{id}` - Get by ID
- `GET /constituencies/code/{code}` - Get by code
- `GET /constituencies/district/{district}` - Filter by district

### Elections
- `GET /elections/` - List all
- `GET /elections/{id}` - Get by ID
- `GET /elections/{id}/results` - Get results
- `GET /elections/constituency/{id}/history` - Historical results
- `GET /elections/year/{year}/results` - Results by year

**Interactive Docs**: http://localhost:8000/api/docs

---

## 🎯 Project Goals

### Phase 1 (Completed ✅)
- Full-stack application setup
- Database models and API endpoints
- Interactive Tamil Nadu map with Leaflet
- Basic constituency display

### Phase 2 (Pending 🚧)
- Constituency detail page with historical charts
- Actual GeoJSON data for Tamil Nadu boundaries
- Prediction algorithms

### Phase 3 (Future 💡)
- User polls and engagement
- Admin panel for data management
- Authentication and authorization
- Mobile app

---

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM for database interactions
- **Supabase** - Cloud PostgreSQL database
- **Poetry** - Python dependency management
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling framework
- **Leaflet** - Maps library
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Database
- **PostgreSQL 17** (via Supabase)
- **PostGIS** - Geospatial extension (available)

### DevOps
- **Git** - Version control
- **npm** - Frontend package manager
- **Poetry** - Backend package manager

---

## 🐛 Common Issues & Solutions

### Database Connection Failed
- Verify `.env` file has correct Supabase credentials
- Check password is URL-encoded (@ becomes %40)
- Test: `cd server && poetry run python scripts/test_db.py`

### CORS Errors
- Add your frontend port to `CORS_ORIGINS` in `server/app/config.py`
- Restart backend server

### Module Not Found
- Backend: `cd server && poetry install`
- Frontend: `cd client && npm install`

### Port Already in Use
- Backend: Use different port with `--port 8001`
- Frontend: Vite automatically tries next available port

---

## 📝 Future Documentation

This folder will contain:

### API.md (Coming Soon)
Complete API documentation with:
- Request/response examples
- Error codes and handling
- Authentication (when implemented)
- Rate limiting (when implemented)

### DEPLOYMENT.md (Coming Soon)
Deployment guides for:
- Vercel (Frontend)
- Render / Railway (Backend)
- Docker setup
- CI/CD with GitHub Actions

### CONTRIBUTING.md (Coming Soon)
Guidelines for:
- Code style and conventions
- Git workflow
- Pull request process
- Testing requirements

### ARCHITECTURE.md (Coming Soon)
Technical details on:
- System architecture
- Design decisions
- Performance considerations
- Scalability plans

### DATABASE.md (Coming Soon)
Database documentation:
- Detailed schema diagrams
- Migration strategies
- Indexing strategies
- Query optimization

---

## 📞 Support

For questions or issues:

1. Check the README files in each folder
2. Review API docs at http://localhost:8000/api/docs
3. Check browser console (F12) for frontend errors
4. Check terminal logs for backend errors
5. Review Supabase dashboard for database issues

---

## 🔗 External Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Leaflet Docs**: https://leafletjs.com/reference.html
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/

---

**Last Updated**: October 2024
