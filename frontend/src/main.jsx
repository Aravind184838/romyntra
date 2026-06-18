import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

// HashRouter is used instead of BrowserRouter so that GitHub Pages
// static hosting serves all routes correctly.
// Routes become: https://username.github.io/repo/#/login
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 500,
            borderRadius: '12px',
            background: '#fff',
            color: '#111827',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#f43f5e', secondary: '#fff' },
          },
        }}
      />
    </HashRouter>
  </StrictMode>,
)
