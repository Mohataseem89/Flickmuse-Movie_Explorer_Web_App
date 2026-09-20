import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { Analytics } from '@vercel/analytics/next';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />

    </ErrorBoundary>
  </StrictMode>,
)
