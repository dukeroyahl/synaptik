// API configuration
// In Docker, nginx proxies /api requests to the backend
// In development, connect directly to localhost:8060
const isDockerEnvironment = () => {
  // Check if we're running through nginx proxy (Docker)
  return window.location.port === '4000' || window.location.port === '80' || !window.location.port;
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isDockerEnvironment() ? '' : 'http://localhost:8060');

// Other configuration settings can be added here
export const APP_NAME = 'Synaptik';
export const APP_VERSION = '0.0.2';

// Development/production environment check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Logging configuration
export const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
export const LOG_TO_FILE = import.meta.env.VITE_LOG_TO_FILE === 'true';
