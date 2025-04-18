// @ts-nocheck
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp } from '@shopify/app-bridge'
import { getSessionToken } from '@shopify/app-bridge/utilities'
import App from './App.tsx'
import './index.css'
import './components/PDFPreview/index.tsx'
const getHost = () => {
  const urlHost = new URLSearchParams(window.location.search).get('host');
  if (urlHost) {
    sessionStorage.setItem('shopify-host', urlHost);
    return urlHost;
  }
  return sessionStorage.getItem('shopify-host');
};
const app = createApp({
  apiKey: document.querySelector('meta[name="shopify-api-key"]')?.getAttribute('content') || '',
  host: getHost() || '',
  forceRedirect: true
});
if (!getHost()) {
  throw new Error('Missing host param for App Bridge');
}
getSessionToken(app)
  .then(token => {
    // Add token to fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      };
      return originalFetch(url, options);
    }

    // Add token to XHR requests
    const originalOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(...args) {
      originalOpen.apply(this, args);
      this.setRequestHeader('Authorization', `Bearer ${token}`);
    };

    // Mount app
    const rootElement = document.getElementById('root');
    if (rootElement) {
      createRoot(rootElement).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    }
  });
