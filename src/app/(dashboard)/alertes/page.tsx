"use client"
import { useState } from 'react'
import { Bell, BellOff, Trash2, Loader2, CheckCheck } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { alertes as alertesApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from '@/components/ui/use-toast'
import type { Alerte } from '@/types'

const typeLabels: Record<string, string> = {
  BUDGET_DEPASSE: 'Budget dépassé',
  BUDGET_PROCHE: 'Budget proche',
  SOLDE_FAIBLE: 'Solde faible',
  INFO: 'Information',
}

const typeVariants: Record<string, 'destructive' | 'warning' | 'primary' | 'default'> = {
  BUDGET_DEPASSE: 'destructive',
  BUDGET_PROCHE: 'warning',
  SOLDE_FAIBLE: 'warning',
  INFO: 'primary',
}

export default function AlertesPage() {
  const { data: alertes, loading, refetch } = useApi(() => alertesApi.lister())
  const [filter, setFilter] = useState<'TOUTES' | 'NON_LUES'>('TOUTES')
  const [processing, setProcessing] = useState<string | null>(null)

  const handleMarquerLue = async (id: string) => {
    setProcessing(id)
    try {
      await alertesApi.marquerLue(id)
      toast({ title: 'Alerte marquée comme lue', type: 'success' })
      refetch()
    } catch (err) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', type: 'error' })
    } finally {
      setProcessing(null)
    }
  }

  const handleSupprimer = async (id: string) => {
    if (!confirm('Supprimer cette alerte ?')) return
    setProcessing(id)
    try {
      await alertesApi.supprimer(id)
      toast({ title: 'Alerte supprimée', type: 'success' })
      refetch()
    } catch (err) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', type: 'error' })
    } finally {
      setProcessing(null)
    }
  }

  const handleMarquerToutesLues = async () => {
    const nonLues = (alertes ?? []).filter((a: Alerte) => !a.lue)
    for (const a of nonLues) {
      try { await alertesApi.marquerLue(a.id) } catch { /* continue */ }
    }
    toast({ title: 'Toutes les alertes ont été marquées comme lues', type: 'success' })
    refetch()
  }

  const filtered = (alertes ?? []).filter((a: Alerte) =>
    filter === 'TOUTES' ? true : !a.lue
  ).sort((a: Alerte, b: Alerte) => new Date(b.creeLe).getTime() - new Date(a.creeLe).getTime())

  const nonLuesCount = (alertes ?? []).filter((a: Alerte) => !a.lue).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Alertes</h2>
          <p className="text-slate-400 text-sm mt-1">
            {nonLuesCount} alerte(s) non lue(s) · {alertes?.length ?? 0} au total
          </p>
        </div>
        {nonLuesCount > 0 && (
          <Button variant="outline" onClick={handleMarquerToutesLues}>
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Filtre */}
      <div className="flex gap-2">
        {(['TOUTES', 'NON_LUES'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'border-blue-600 bg-blue-900/40 text-blue-300'
                : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            {f === 'TOUTES' ? 'Toutes' : 'Non lues'}
            {f === 'NON_LUES' && nonLuesCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {nonLuesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune alerte"
          description={filter === 'NON_LUES' ? 'Toutes vos alertes ont été lues' : 'Vous n\'avez aucune alerte'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((alerte: Alerte) => (
            <div
              key={alerte.id}
              className={`rounded-xl border p-5 flex items-start gap-4 transition-colors ${
                alerte.lue
                  ? 'border-slate-700 bg-[#1E293B] opacity-60'
                  : 'border-slate-600 bg-[#1E293B]'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                alerte.type === 'BUDGET_DEPASSE' ? 'bg-red-900/50' :
                alerte.type === 'BUDGET_PROCHE' || alerte.type === 'SOLDE_FAIBLE' ? 'bg-amber-900/50' :
                'bg-blue-900/50'
              }`}>
                {alerte.lue
                  ? <BellOff className="h-5 w-5 text-slate-400" />
                  : <Bell className={`h-5 w-5 ${
                      alerte.type === 'BUDGET_DEPASSE' ? 'text-red-400' :
                      alerte.type === 'BUDGET_PROCHE' || alerte.type === 'SOLDE_FAIBLE' ? 'text-amber-400' :
                      'text-blue-400'
                    }`} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant={typeVariants[alerte.type] ?? 'default'}>
                    {typeLabels[alerte.type] ?? alerte.type}
                  </Badge>
                  {!alerte.lue && (
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                  )}
                </div>
                <p className="text-sm text-slate-100">{alerte.message}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDate(alerte.creeLe)}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!alerte.lue && (
                  <button
                    onClick={() => handleMarquerLue(alerte.id)}
                    disabled={processing === alerte.id}
                    title="Marquer comme lue"
                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {processing === alerte.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                  </button>
                )}
                <button
                  onClick={() => handleSupprimer(alerte.id)}
                  disabled={processing === alerte.id}
                  title="Supprimer"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {processing === alerte.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
