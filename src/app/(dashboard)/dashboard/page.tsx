"use client"
import { useEffect, useState } from 'react'
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Bell, CreditCard, ArrowLeftRight, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ChartsSection } from '@/components/dashboard/ChartsSection'
import { SourcesPaiementChart } from '@/components/dashboard/SourcesPaiementChart'
import { PrevisionChart, type PrevisionData } from '@/components/dashboard/PrevisionChart'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { comptes as comptesApi, transactions as txApi, budgets as budgetsApi, alertes as alertesApi, rapports as rapportsApi } from '@/lib/api'
import { formatMontant, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/LanguageContext'
import type { Compte, Transaction, Budget, Alerte } from '@/types'

export default function DashboardPage() {
  const { t } = useTranslation()
  const [comptes, setComptes] = useState<Compte[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [prevision, setPrevision] = useState<PrevisionData | null>(null)
  const [previsionLoading, setPrevisionLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    fetch('http://localhost:3001/api/transactions/prevision', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(r => r.json())
      .then((json: { data?: PrevisionData } & PrevisionData) => {
        const d = json?.data ?? json
        if (d?.previsions) setPrevision(d as PrevisionData)
      })
      .catch(console.error)
      .finally(() => setPrevisionLoading(false))
  }, [])

  useEffect(() => {
    Promise.allSettled([
      comptesApi.lister(),
      txApi.lister(),
      budgetsApi.lister(),
      alertesApi.lister(),
    ]).then(([c, tx, b, a]) => {
      if (c.status === 'fulfilled' && Array.isArray(c.value)) setComptes(c.value)
      if (tx.status === 'fulfilled' && Array.isArray(tx.value)) setTransactions(tx.value)
      if (b.status === 'fulfilled' && Array.isArray(b.value)) setBudgets(b.value)
      if (a.status === 'fulfilled' && Array.isArray(a.value)) setAlertes(a.value)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner fullPage />

  const handleExportPDF = async () => {
    setExportingPDF(true)
    try {
      await rapportsApi.telechargerPDF()
    } catch (err) {
      console.error('Erreur export PDF:', err)
    } finally {
      setExportingPDF(false)
    }
  }

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      await rapportsApi.telechargerExcel()
    } catch (err) {
      console.error('Erreur export Excel:', err)
    } finally {
      setExportingExcel(false)
    }
  }

  const totalSolde = comptes.reduce((s, c) => s + (c.soldeActuel ?? 0), 0)
  const now = new Date()
  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const txMois = transactions.filter((tx) => tx.dateTransaction?.startsWith(moisActuel))
  const revenus = txMois.filter((tx) => tx.type === 'ENTREE').reduce((s, tx) => s + tx.montant, 0)
  const depenses = txMois.filter((tx) => tx.type === 'DEPENSE').reduce((s, tx) => s + tx.montant, 0)
  const alertesNonLues = alertes.filter((a) => !a.lue).length
  const dernieresTransactions = [...transactions]
    .sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Boutons export */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleExportExcel}
          disabled={exportingExcel}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          style={{
            background: 'rgba(16,185,129,0.13)',
            border: '1px solid rgba(16,185,129,0.35)',
            color: '#34d399',
          }}
        >
          {exportingExcel ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          {exportingExcel ? 'Génération...' : 'Exporter Excel'}
        </button>
        <button
          onClick={handleExportPDF}
          disabled={exportingPDF}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #b89540, #d4af6a)',
            color: '#0a0f1e',
          }}
        >
          {exportingPDF ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {exportingPDF ? 'Génération...' : 'Exporter PDF'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.total_accounts')} value={formatMontant(totalSolde)} icon={TrendingUp} />
        <StatCard title={t('dashboard.monthly_income')} value={formatMontant(revenus)} icon={ArrowDownLeft} iconColor="text-emerald-400" iconBg="bg-emerald-900/40" />
        <StatCard title={t('dashboard.monthly_expenses')} value={formatMontant(depenses)} icon={ArrowUpRight} iconColor="text-red-400" iconBg="bg-red-900/40" />
        <StatCard title={t('dashboard.active_alerts')} value={String(alertesNonLues)} icon={Bell} iconColor="text-amber-400" iconBg="bg-amber-900/40" />
      </div>

      {/* Graphiques analytiques */}
      <ChartsSection transactions={transactions} comptes={comptes} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Comptes */}
        <div className="card p-6 animate-fade-in-up delay-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{t('dashboard.accounts')}</h2>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
              <CreditCard className="h-3.5 w-3.5 text-blue-400" />
            </div>
          </div>
          {comptes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">{t('dashboard.no_accounts')}</p>
          ) : (
            <ul className="space-y-3">
              {comptes.slice(0, 5).map((compte) => (
                <li key={compte.id} className="flex items-center justify-between group">
                  <div>
                    <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{compte.nom}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{compte.type}</p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${compte.soldeActuel >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatMontant(compte.soldeActuel, compte.devise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Transactions récentes */}
        <div className="card p-6 lg:col-span-2 animate-fade-in-up delay-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{t('dashboard.recent_transactions')}</h2>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-400" />
            </div>
          </div>
          {dernieresTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">{t('dashboard.no_transactions')}</p>
          ) : (
            <ul className="space-y-2.5">
              {dernieresTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center gap-3 group rounded-xl p-2 -mx-2 hover:bg-white/[0.03] transition-colors">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tx.type === 'ENTREE'
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : tx.type === 'SORTIE'
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                    {tx.type === 'ENTREE'
                      ? <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                      : tx.type === 'SORTIE'
                        ? <ArrowLeftRight className="h-4 w-4 text-blue-400" />
                        : <ArrowUpRight className="h-4 w-4 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{tx.description || tx.sourcePaiement}</p>
                    <p className="text-xs text-slate-500">{tx.categorieNom ?? t('common.no_category')} · {formatDate(tx.dateTransaction)}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 tabular-nums ${tx.type === 'ENTREE' ? 'text-emerald-400' : tx.type === 'SORTIE' ? 'text-blue-400' : 'text-red-400'}`}>
                    {tx.type === 'ENTREE' ? '+' : '−'}{formatMontant(tx.montant)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Budgets */}
      {budgets.length > 0 && (
        <div className="card p-6 animate-fade-in-up delay-300">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-5">{t('dashboard.budgets')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {budgets.slice(0, 6).map((budget) => {
              const pct = Math.min(budget.pourcentage ?? 0, 100)
              const barColor = (budget.pourcentage ?? 0) >= 100
                ? '!bg-gradient-to-r !from-red-600 !to-rose-500'
                : pct >= 80
                  ? '!bg-gradient-to-r !from-amber-500 !to-orange-500'
                  : '!bg-gradient-to-r !from-emerald-500 !to-teal-500'
              return (
                <div key={budget.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-200">{budget.categorieNom}</span>
                    <Badge variant={(budget.pourcentage ?? 0) >= 100 ? 'destructive' : pct >= 80 ? 'warning' : 'success'}>
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={pct} indicatorClassName={barColor} />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{formatMontant(budget.montantDepense)}</span>
                    <span>{formatMontant(budget.montantLimite)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Répartition par source de paiement */}
      <SourcesPaiementChart />

      {/* Prévision de trésorerie 3 mois */}
      <PrevisionChart data={prevision} loading={previsionLoading} />
    </div>
  )
}