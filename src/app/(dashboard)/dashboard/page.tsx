"use client"
import { useEffect, useState } from 'react'
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Bell, CreditCard, ArrowLeftRight } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { comptes as comptesApi, transactions as txApi, budgets as budgetsApi, alertes as alertesApi } from '@/lib/api'
import { formatMontant, formatDate } from '@/lib/utils'
import type { Compte, Transaction, Budget, Alerte } from '@/types'

export default function DashboardPage() {
  const [comptes, setComptes] = useState<Compte[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      comptesApi.lister(),
      txApi.lister(),
      budgetsApi.lister(),
      alertesApi.lister(),
    ]).then(([c, t, b, a]) => {
      if (c.status === 'fulfilled' && Array.isArray(c.value)) setComptes(c.value)
      if (t.status === 'fulfilled' && Array.isArray(t.value)) setTransactions(t.value)
      if (b.status === 'fulfilled' && Array.isArray(b.value)) setBudgets(b.value)
      if (a.status === 'fulfilled' && Array.isArray(a.value)) setAlertes(a.value)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner fullPage />

  const totalSolde = comptes.reduce((s, c) => s + (c.soldeActuel ?? 0), 0)
  const now = new Date()
  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const txMois = transactions.filter((t) => t.dateTransaction?.startsWith(moisActuel))
  const revenus = txMois.filter((t) => t.type === 'ENTREE').reduce((s, t) => s + t.montant, 0)
  const depenses = txMois.filter((t) => t.type === 'SORTIE').reduce((s, t) => s + t.montant, 0)
  const alertesNonLues = alertes.filter((a) => !a.lue).length
  const dernieresTransactions = [...transactions]
    .sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total des comptes"
          value={formatMontant(totalSolde)}
          icon={TrendingUp}
          iconColor="text-blue-400"
          iconBg="bg-blue-900/40"
        />
        <StatCard
          title="Revenus du mois"
          value={formatMontant(revenus)}
          icon={ArrowDownLeft}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-900/40"
        />
        <StatCard
          title="Dépenses du mois"
          value={formatMontant(depenses)}
          icon={ArrowUpRight}
          iconColor="text-red-400"
          iconBg="bg-red-900/40"
        />
        <StatCard
          title="Alertes actives"
          value={String(alertesNonLues)}
          icon={Bell}
          iconColor="text-amber-400"
          iconBg="bg-amber-900/40"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comptes récents */}
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-100">Comptes</h2>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>
          {comptes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucun compte</p>
          ) : (
            <ul className="space-y-3">
              {comptes.slice(0, 5).map((compte) => (
                <li key={compte.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{compte.nom}</p>
                    <p className="text-xs text-slate-400">{compte.type}</p>
                  </div>
                  <span className={`text-sm font-semibold ${compte.soldeActuel >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatMontant(compte.soldeActuel, compte.devise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Transactions récentes */}
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-100">Transactions récentes</h2>
            <ArrowLeftRight className="h-4 w-4 text-slate-400" />
          </div>
          {dernieresTransactions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucune transaction</p>
          ) : (
            <ul className="space-y-3">
              {dernieresTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tx.type === 'ENTREE' ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>
                    {tx.type === 'ENTREE'
                      ? <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                      : <ArrowUpRight className="h-4 w-4 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{tx.description || tx.sourcePaiement}</p>
                    <p className="text-xs text-slate-400">{tx.categorieNom ?? 'Sans catégorie'} · {formatDate(tx.dateTransaction)}</p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.type === 'ENTREE' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'ENTREE' ? '+' : '-'}{formatMontant(tx.montant)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Budgets */}
      {budgets.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-6">
          <h2 className="text-base font-semibold text-slate-100 mb-4">Budgets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {budgets.slice(0, 6).map((budget) => {
              const pct = Math.min(budget.pourcentage ?? 0, 100)
              const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-100">{budget.categorieNom}</span>
                    <Badge variant={pct >= 90 ? 'destructive' : pct >= 70 ? 'warning' : 'success'}>
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={pct} indicatorClassName={barColor} />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{formatMontant(budget.montantDepense)}</span>
                    <span>{formatMontant(budget.montantLimite)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
