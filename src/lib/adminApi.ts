const BASE_URL = 'https://gestion-financiere-api-production.up.railway.app'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Erreur ${res.status}` }))
    throw new Error(err.message || `Erreur ${res.status}`)
  }

  const text = await res.text()
  if (!text) return undefined as T
  const json = JSON.parse(text)
  return (json?.data ?? json) as T
}

export interface AdminStats {
  nbUtilisateurs: number
  nbOrganisations: number
  nbTransactions: number
  volumeTotal: number
  inscriptionsParMois: { mois: string; nb: number }[]
}

export interface AdminUtilisateur {
  id: string
  nom: string
  email: string
  role: string
  statut: 'actif' | 'bloqué'
  organisationNom?: string
  creeLe: string
}

export interface AdminOrganisation {
  id: string
  nom: string
  slug: string
  nbUtilisateurs: number
  nbTransactions: number
}

export interface AdminLog {
  id: string
  utilisateurEmail: string
  action: string
  type?: 'CREATE' | 'DELETE' | 'UPDATE' | 'LOGIN'
  details?: string
  creeLe: string
}

export const adminApi = {
  stats: () => adminRequest<AdminStats>('/api/admin/stats'),

  utilisateurs: {
    lister: () => adminRequest<AdminUtilisateur[]>('/api/admin/utilisateurs'),
    bloquer: (id: string, bloque: boolean) =>
      adminRequest<AdminUtilisateur>(`/api/admin/utilisateurs/${id}/bloquer`, {
        method: 'PUT',
        body: JSON.stringify({ bloque }),
      }),
    supprimer: (id: string) =>
      adminRequest<void>(`/api/admin/utilisateurs/${id}`, { method: 'DELETE' }),
  },

  organisations: {
    lister: () => adminRequest<AdminOrganisation[]>('/api/admin/organisations'),
  },

  logs: {
    lister: () => adminRequest<AdminLog[]>('/api/admin/logs'),
  },
}
