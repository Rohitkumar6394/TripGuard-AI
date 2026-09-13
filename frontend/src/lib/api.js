export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function getAuthToken() {
  return localStorage.getItem('tripguard-auth-token')
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.')
    error.status = response.status
    throw error
  }

  return data
}
