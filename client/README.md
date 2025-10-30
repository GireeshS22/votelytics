# Votelytics Frontend (React + TypeScript)

**React frontend application for Votelytics electoral predictions platform**

See full documentation at: [Root README](../README.md)

---

## Quick Start

```bash
cd client
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

---

## Project Structure

```
client/src/
├── components/      # React components
├── pages/           # Page components  
├── services/        # API service layer
├── types/           # TypeScript interfaces
├── App.tsx          # Main app with routing
└── main.tsx         # React entry point
```

---

## Key Files

- **src/components/map/TNMap.tsx** - Leaflet map component
- **src/components/common/Header.tsx** - Navigation header
- **src/pages/Home.tsx** - Home page with map
- **src/services/api.ts** - Axios API client
- **src/types/** - TypeScript type definitions

---

## API Service Usage

```typescript
import { constituenciesAPI, electionsAPI } from './services/api';

// Get constituencies
const data = await constituenciesAPI.getAll({ limit: 500 });

// Get election history
const history = await electionsAPI.getConstituencyHistory(1);
```

---

## Environment

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Technologies

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Leaflet (maps)
- React Router (routing)
- Axios (HTTP client)

---

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

**Last Updated**: October 2024
