// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9001';

// Other configuration settings can be added here
export const APP_NAME = 'Synaptik';
export const APP_VERSION = '1.0.0';

// Development/production environment check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
