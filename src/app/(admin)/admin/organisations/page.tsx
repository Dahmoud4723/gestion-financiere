"use client"
import { useEffect, useState } from 'react'
import { Loader2, Building2, Users, ArrowLeftRight } from 'lucide-react'
import { adminApi, type AdminOrganisation } from '@/lib/adminApi'

export default function OrganisationsPage() {
  const [organisations, setOrganisations] = useState<AdminOrganisation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi.organisations.lister()
      .then(setOrganisations)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Organisations</h1>
        <p className="text-sm text-slate-500 mt-1">
          {organisations.length} organisation{organisations.length > 1 ? 's' : ''} enregistrée{organisations.length > 1 ? 's' : ''}
        </p>
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
        ) : organisations.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-slate-500">Aucune organisation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { label: 'Organisation', icon: Building2 },
                    { label: 'Slug', icon: null },
                    { label: 'Utilisateurs', icon: Users },
                    { label: 'Transactions', icon: ArrowLeftRight },
                  ].map(({ label, icon: Icon }) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#475569' }}
                    >
                      <div className="flex items-center gap-1.5">
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...organisations].sort((a, b) => b.nbUtilisateurs - a.nbUtilisateurs).map((org, i) => (
                  <tr
                    key={org.id}
                    className="transition-colors"
                    style={{
                      borderBottom: i < organisations.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: 'rgba(124,95,255,0.12)',
                            border: '1px solid rgba(124,95,255,0.25)',
                          }}
                        >
                          <Building2 className="h-4 w-4" style={{ color: '#7c5fff' }} />
                        </div>
                        <span className="font-medium text-slate-200">{org.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-mono"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: '#64748b',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {org.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-200">{org.nbUtilisateurs}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-200">{org.nbTransactions}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
