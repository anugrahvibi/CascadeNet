import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Register Cascadenet Tactical Service Worker for Background SOS Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Tactical SOS Uplink Active', reg.scope))
      .catch(err => console.warn('SOS Uplink Failed', err));
  });
}

// Request Notification Permission on Startup
if ('Notification' in window) {
  Notification.requestPermission();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
