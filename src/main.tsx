import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handlers to capture and prevent cross-origin "Script error."
// from crashing or halting the app inside sandboxed iFrames.
if (typeof window !== 'undefined') {
  const handleGlobalError = (event: ErrorEvent) => {
    const isScriptError = event.message === 'Script error.' || !event.filename;
    const isMapsRelated = event.message && (
      event.message.indexOf('maps.googleapis.com') !== -1 ||
      event.message.indexOf('Google Maps') !== -1 ||
      event.message.indexOf('google.maps') !== -1
    );

    if (isScriptError || isMapsRelated) {
      console.warn('Prevented cross-origin/sandbox "Script error" or Map load failure from bubbling:', event.message || 'Script error.');
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleGlobalRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason && typeof reason === 'object') {
      const msg = reason.message || '';
      const isMapsRelated = msg && (
        msg.indexOf('maps.googleapis.com') !== -1 ||
        msg.indexOf('Google Maps') !== -1 ||
        msg.indexOf('google.maps') !== -1
      );

      if (isMapsRelated) {
        console.warn('Prevented unhandled promise rejection of Google Maps SDK from bubbling:', msg);
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };

  window.addEventListener('error', handleGlobalError, true);
  window.addEventListener('unhandledrejection', handleGlobalRejection, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

