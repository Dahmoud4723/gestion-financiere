import type { Compte, Transaction, Categorie, Budget, Alerte, Organisation, AuthResponse } from '@/types'

const BASE_URL = ''

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('utilisateur')
      window.location.href = '/login'
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

// Auth
export const auth = {
  connecter: (email: string, motDePasse: string) =>
    request<AuthResponse>('/api/auth/connecter', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse }),
    }),
  inscrire: (data: { nom: string; email: string; motDePasse: string; organisationId?: string }) =>
    request<AuthResponse>('/api/auth/inscrire', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Organisations
export const organisations = {
  lister: () => request<Organisation[]>('/api/organisations'),
  creer: (data: { nom: string; slug?: string }) =>
    request<Organisation>('/api/organisations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Comptes
export const comptes = {
  lister: () => request<Compte[]>('/api/comptes'),
  obtenir: (id: string) => request<Compte>(`/api/comptes/${id}`),
  creer: (data: Partial<Compte>) =>
    request<Compte>('/api/comptes', { method: 'POST', body: JSON.stringify(data) }),
  modifier: (id: string, data: Partial<Compte>) =>
    request<Compte>(`/api/comptes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  supprimer: (id: string) =>
    request<void>(`/api/comptes/${id}`, { method: 'DELETE' }),
}

// Transactions
export const transactions = {
  lister: () => request<Transaction[]>('/api/transactions'),
  obtenir: (id: string) => request<Transaction>(`/api/transactions/${id}`),
  creer: (data: Partial<Transaction>) =>
    request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  supprimer: (id: string) =>
    request<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
}

// Catégories
export const categories = {
  lister: () => request<Categorie[]>('/api/categories'),
  creer: (data: Partial<Categorie>) =>
    request<Categorie>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  supprimer: (id: string) =>
    request<void>(`/api/categories/${id}`, { method: 'DELETE' }),
}

// Budgets
export const budgets = {
  lister: () => request<Budget[]>('/api/budgets'),
  obtenir: (id: string) => request<Budget>(`/api/budgets/${id}`),
  creer: (data: Partial<Budget>) =>
    request<Budget>('/api/budgets', { method: 'POST', body: JSON.stringify(data) }),
  modifier: (id: string, data: Partial<Budget>) =>
    request<Budget>(`/api/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  supprimer: (id: string) =>
    request<void>(`/api/budgets/${id}`, { method: 'DELETE' }),
}

// Alertes
export const alertes = {
  lister: () => request<Alerte[]>('/api/alertes'),
  marquerLue: (id: string) =>
    request<Alerte>(`/api/alertes/${id}`, { method: 'PUT', body: JSON.stringify({ lue: true }) }),
  supprimer: (id: string) =>
    request<void>(`/api/alertes/${id}`, { method: 'DELETE' }),
}
