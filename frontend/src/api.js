/* ============================================================
   api.js — the single place that talks to the backend.
   Every component/handler goes through these helpers instead of
   calling fetch() directly, so the base URL, auth header, and
   error handling all live in one spot.
   ============================================================ */

/* Where the backend lives. Override with VITE_API_URL in a .env file for
   other environments; defaults to the local dev server. */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/* The JWT handed out by login/signup. Kept in localStorage so a page refresh
   keeps the user signed in. Held in a module variable too to avoid touching
   localStorage on every request. */
let token = localStorage.getItem('token') || null

export const getToken = () => token

/* Save (or clear, with null) the auth token. */
export const setToken = (t) => {
  token = t
  if (t) localStorage.setItem('token', t)
  else localStorage.removeItem('token')
}

/* Core request helper. Adds JSON + auth headers, parses the response, and
   throws an Error (with .status set) on any non-2xx so callers can try/catch. */
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null // No Content (e.g. a successful DELETE)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data // expose the body (e.g. { needsVerification: true }) to callers
    throw err
  }
  return data
}

/* ---- Auth ---- */
export const signup = (payload) => request('/api/auth/signup', { method: 'POST', body: payload })
export const login  = (payload) => request('/api/auth/login',  { method: 'POST', body: payload })
export const verifyEmail        = (token) => request('/api/auth/verify', { method: 'POST', body: { token } })
export const resendVerification = (email) => request('/api/auth/resend', { method: 'POST', body: { email } })

/* ---- Transactions ---- */
export const getTransactions   = ()        => request('/api/transactions')
export const createTransaction = (t)       => request('/api/transactions', { method: 'POST', body: t })
export const updateTransaction = (id, t)   => request(`/api/transactions/${id}`, { method: 'PUT', body: t })
export const deleteTransaction = (id)      => request(`/api/transactions/${id}`, { method: 'DELETE' })

/* ---- Budgets ---- */
export const getBudgets = ()        => request('/api/budgets')
export const putBudgets = (budgets) => request('/api/budgets', { method: 'PUT', body: { budgets } })
