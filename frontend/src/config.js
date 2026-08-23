// Single place the API base URL comes from, so a deployed build only needs
// VITE_BACKEND_URL set rather than a search and replace.
export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
