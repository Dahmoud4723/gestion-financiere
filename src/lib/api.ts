import type { Compte, Transaction, Categorie, Budget, Alerte, Organisation, AuthResponse } from '@/types'

// const BASE_URL = ''
const BASE_URL = 'http://localhost:3001'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('utilisateur')
      window.dispatchEvent(new Event('auth:expired'))
    }
    throw new Error('Non autorisé')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur réseau' }))
    throw new Error(err.message || `Erreur ${res.status}`)
  }

  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await request<{ success: boolean; data: T }>(path, options)
  return (res as unknown as { data: T }).data ?? (res as unknown as T)
}

export const auth = {
  connecter: (email: string, motDePasse: string) =>
    api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse }),
    }),
  inscrire: (data: { nom: string; email: string; motDePasse: string; organisationId?: string }) =>
    api<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const organisations = {
  lister: () => api<Organisation[]>('/api/organisations'),
  creer: (data: { nom: string; slug?: string }) =>
    api<Organisation>('/api/organisations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const comptes = {
  lister: () => api<Compte[]>('/api/comptes'),
  obtenir: (id: string) => api<Compte>(`/api/comptes/${id}`),
  creer: (data: Partial<Compte>) =>
    api<Compte>('/api/comptes', { method: 'POST', body: JSON.stringify(data) }),
  modifier: (id: string, data: Partial<Compte>) =>
    api<Compte>(`/api/comptes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  supprimer: (id: string) =>
    api<void>(`/api/comptes/${id}`, { method: 'DELETE' }),
}

export const transactions = {
  lister: () => api<Transaction[]>('/api/transactions'),
  obtenir: (id: string) => api<Transaction>(`/api/transactions/${id}`),
  creer: (data: Partial<Transaction>) =>
    api<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  supprimer: (id: string) =>
    api<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
}

export const categories = {
  lister: () => api<Categorie[]>('/api/categories'),
  creer: (data: Partial<Categorie>) =>
    api<Categorie>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  supprimer: (id: string) =>
    api<void>(`/api/categories/${id}`, { method: 'DELETE' }),
}

export const budgets = {
  lister: () => api<Budget[]>('/api/budgets'),
  obtenir: (id: string) => api<Budget>(`/api/budgets/${id}`),
  creer: (data: Partial<Budget>) =>
    api<Budget>('/api/budgets', { method: 'POST', body: JSON.stringify(data) }),
  modifier: (id: string, data: Partial<Budget>) =>
    api<Budget>(`/api/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  supprimer: (id: string) =>
    api<void>(`/api/budgets/${id}`, { method: 'DELETE' }),
}

export const alertes = {
  lister: () => api<Alerte[]>('/api/alertes'),
  marquerLue: (id: string) =>
    api<Alerte>(`/api/alertes/${id}`, { method: 'PUT', body: JSON.stringify({ lue: true }) }),
  supprimer: (id: string) =>
    api<void>(`/api/alertes/${id}`, { method: 'DELETE' }),
}