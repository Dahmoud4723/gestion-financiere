"use client"
import { useEffect, useState, useCallback } from 'react'
import { Loader2, UserX, UserCheck, Trash2, Search } from 'lucide-react'
import { adminApi, type AdminUtilisateur } from '@/lib/adminApi'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<AdminUtilisateur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.utilisateurs.lister()
      .then(setUtilisateurs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleBloquer = async (u: AdminUtilisateur) => {
    setPendingId(u.id)
    try {
      const updated = await adminApi.utilisateurs.bloquer(u.id, u.statut !== 'bloqué')
      setUtilisateurs(prev => prev.map(x => x.id === u.id ? { ...x, ...updated } : x))
    } catch (e) {
      console.error(e)
    } finally {
      setPendingId(null)
    }
  }

  const handleSupprimer = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur définitivement ?')) return
    setPendingId(id)
    try {
      await adminApi.utilisateurs.supprimer(id)
      setUtilisateurs(prev => prev.filter(u => u.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setPendingId(null)
    }
  }

  const filtered = utilisateurs.filter(u =>
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.organisationNom ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-1">
            {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? 's' : ''} au total
          </p>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl py-2 pl-9 pr-4 text-sm outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e0e7ff',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(82,113,255,0.5)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#5271ff' }} />
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Nom', 'Email', 'Organisation', 'Inscription', 'Statut', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#475569' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => (
                    <tr
                      key={u.id}
                      className="transition-colors"
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td className="px-4 py-3 font-medium text-slate-200">{u.nom}</td>
                      <td className="px-4 py-3 text-slate-400">{u.email}</td>
                      <td className="px-4 py-3 text-slate-400">{u.organisationNom ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(u.creeLe)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={
                            u.statut === 'bloqué'
                              ? { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
                              : { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }
                          }
                        >
                          {u.statut === 'bloqué' ? 'Bloqué' : 'Actif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBloquer(u)}
                            disabled={pendingId === u.id}
                            title={u.statut === 'bloqué' ? 'Débloquer' : 'Bloquer'}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                            style={{
                              background: u.statut === 'bloqué' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
                              border: u.statut === 'bloqué' ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(245,158,11,0.25)',
                            }}
                          >
                            {pendingId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                            ) : u.statut === 'bloqué' ? (
                              <UserCheck className="h-3.5 w-3.5" style={{ color: '#34d399' }} />
                            ) : (
                              <UserX className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
                            )}
                          </button>
                          <button
                            onClick={() => handleSupprimer(u.id)}
                            disabled={pendingId === u.id}
                            title="Supprimer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.25)',
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" style={{ color: '#f87171' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
