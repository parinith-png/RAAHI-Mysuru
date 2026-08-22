import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global error reporter to help find runtime crashes on user devices
window.onerror = function (message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.inset = '0';
  errorDiv.style.background = '#800000';
  errorDiv.style.color = '#fff';
  errorDiv.style.padding = '24px';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.fontSize = '14px';
  errorDiv.style.overflow = 'auto';
  errorDiv.style.whiteSpace = 'pre-wrap';
  errorDiv.innerHTML = `
    <h2 style="margin:0 0 16px;color:#ff8888">⚠️ RoadGuard Runtime Error</h2>
    <strong>Message:</strong> ${message}<br>
    <strong>Source:</strong> ${source}:${lineno}:${colno}<br><br>
    <strong>Stack Trace:</strong><br>
    <pre style="background:rgba(0,0,0,0.3);padding:12px;border-radius:4px;overflow-x:auto">${error ? error.stack : 'No stack trace available'}</pre>
  `;
  document.body.appendChild(errorDiv);
};

window.addEventListener('unhandledrejection', function (event) {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.inset = '0';
  errorDiv.style.background = '#804000';
  errorDiv.style.color = '#fff';
  errorDiv.style.padding = '24px';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.fontSize = '14px';
  errorDiv.style.overflow = 'auto';
  errorDiv.style.whiteSpace = 'pre-wrap';
  errorDiv.innerHTML = `
    <h2 style="margin:0 0 16px;color:#ffcc88">⚠️ RoadGuard Unhandled Promise Rejection</h2>
    <strong>Reason:</strong> ${event.reason}<br><br>
    <strong>Details:</strong> Check devtools for more information.
  `;
  document.body.appendChild(errorDiv);
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
