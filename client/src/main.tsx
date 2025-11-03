import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
// Import cache utility to register global clear function
import './utils/cache'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
