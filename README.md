# Votelytics

**Electoral Predictions & Analysis Platform**

An elegant, data-driven platform for visualizing and predicting electoral outcomes. Currently featuring Tamil Nadu Assembly Elections 2026.

## 🚀 Features

- **Interactive Map**: Click on constituencies to explore detailed data
- **Historical Analysis**: Past election results and trends
- **Predictions**: Data-driven electoral predictions
- **Real-time Updates**: Live tracking as elections approach
- **Beautiful Visualizations**: Charts and graphs powered by Recharts

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Poetry** - Dependency management
- **Alembic** - Database migrations

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **Leaflet** - Interactive maps
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Axios** - HTTP client

## 📁 Project Structure

```
votelytics/
├── client/          # React frontend
├── server/          # FastAPI backend
└── docs/            # Documentation
```

## 🏃 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Poetry

### Backend Setup

```bash
cd server
poetry install
cp .env.example .env
# Edit .env with your database credentials
poetry run uvicorn app.main:app --reload
```

Backend will run on: http://localhost:8000
API docs: http://localhost:8000/api/docs

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend will run on: http://localhost:5173

### Database Setup

```bash
# Create PostgreSQL database
createdb votelytics

# Run migrations
cd server
poetry run alembic upgrade head
```

## 📊 Data

Place your historical election data CSV files in `server/data/`

## 🎯 Roadmap

- [x] Project setup
- [ ] Database models
- [ ] API endpoints
- [ ] Interactive Tamil Nadu map
- [ ] Constituency detail pages
- [ ] Prediction algorithms
- [ ] State-level dashboard
- [ ] User polls feature

## 📄 License

MIT License

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Built with ❤️ for transparent democracy
