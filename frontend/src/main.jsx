import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { pingBackend } from './services/wakeup.js'

// Fire backend wake-up ping immediately so Render has time to spin up
// before the user tries to load any data.
pingBackend();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

