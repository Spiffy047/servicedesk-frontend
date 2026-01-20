// Simple API URL utility that works in all environments
export const getApiUrl = () => {
  // Default to localhost
  const defaultUrl = 'http://localhost:5001/api'
  
  try {
    // Always use localhost for development
    return import.meta?.env?.VITE_API_URL || defaultUrl
  } catch (error) {
    console.error('API URL config error:', error)
    return defaultUrl
  }
}

// Default export
const getApiUrlDefault = getApiUrl
export default getApiUrlDefault