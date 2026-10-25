// in production the backend serves this build, so the API is on the same address
export const backendUrl = import.meta.env.VITE_BACKEND_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:4000');
