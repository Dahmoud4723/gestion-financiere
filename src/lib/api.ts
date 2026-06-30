import type { Compte, Transaction, Categorie, Budget, Alerte, Organisation, AuthResponse } from '@/types'

const BASE_URL = 'http://localhost:3001'
let authExpiredFired = false

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
    const body = await res.json().catch(() => null)
    console.error(`[401] ${path} →`, body)

    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('utilisateur')
      if (!authExpiredFired) {
        authExpiredFired = true
        window.dispatchEvent(new Event('auth:expired'))
        setTimeout(() => { authExpiredFired = false }, 2000)
      }
    }
    throw new Error(body?.message || 'Non autorisé')
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
  virement: (data: {
    compteSourceId: string
    compteDestinationId: string
    montant: number
    description?: string
    dateTransaction: string
  }) => api<void>('/api/comptes/virement', { method: 'POST', body: JSON.stringify(data) }),
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

export interface ProfilData {
  id: string
  nom: string
  email: string
  role: string
  organisationId: string
  creeLe: string
}

export const profil = {
  obtenir: () => api<ProfilData>('/api/profil'),
  modifier: (data: { nom?: string; email?: string }) =>
    api<ProfilData>('/api/profil', { method: 'PUT', body: JSON.stringify(data) }),
  changerMotDePasse: (data: { ancienMotDePasse: string; nouveauMotDePasse: string }) =>
    api<void>('/api/profil/mot-de-passe', { method: 'PUT', body: JSON.stringify(data) }),
}

export const rapports = {
  telechargerPDF: async (mois?: number, annee?: number) => {
    const token = getToken()
    const params = new URLSearchParams()
    if (mois) params.set('mois', String(mois))
    if (annee) params.set('annee', String(annee))

    const res = await fetch(`${BASE_URL}/api/rapports/pdf?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) throw new Error('Erreur lors de la génération du PDF')

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-${mois ?? new Date().getMonth() + 1}-${annee ?? new Date().getFullYear()}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  },
  telechargerExcel: async (mois?: number, annee?: number) => {
    const token = getToken()
    const params = new URLSearchParams()
    if (mois) params.set('mois', String(mois))
    if (annee) params.set('annee', String(annee))

    const res = await fetch(`${BASE_URL}/api/rapports/excel?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) throw new Error('Erreur lors de la génération du Excel')

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-${mois ?? new Date().getMonth() + 1}-${annee ?? new Date().getFullYear()}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  },
}