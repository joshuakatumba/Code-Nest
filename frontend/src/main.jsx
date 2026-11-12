import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';

function ensureFavicon() {
  const existing = document.querySelector("link[rel*='icon']");
  if (existing) {
    existing.href = '/favicon.svg?v=2';
    return;
  }
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = '/favicon.svg?v=2';
  document.head.appendChild(link);
}

ensureFavicon();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
