"use client"
import { useState, useEffect, useMemo } from 'react'
import {
  Plus, ArrowLeftRight, Trash2, Loader2,
  ArrowDownLeft, ArrowUpRight, ChevronUp, ChevronDown, RotateCcw,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { transactions as txApi, comptes as comptesApi, categories as catApi } from '@/lib/api'
import { formatMontant, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from '@/components/ui/use-toast'
import { useTranslation } from '@/contexts/LanguageContext'
import type { Compte, Categorie, Transaction } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCES = ['BANKILY', 'MASRVI', 'SEDAD', 'CASH', 'VIREMENT'] as const
type Source = typeof SOURCES[number]
type SortCol = 'date' | 'montant'
type SortDir = 'asc' | 'desc'
const PAGE_SIZE = 15

const SOURCE_LABELS: Record<string, string> = {
  BANKILY: 'Bankily', MASRVI: 'Masrvi', SEDAD: 'Sedad', CASH: 'Espèces', VIREMENT: 'Virement',
}

const SOURCE_ACTIVE: Record<Source, React.CSSProperties> = {
  BANKILY:  { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.5)', color: '#fcd34d' },
  MASRVI:   { background: 'rgba(59,130,246,0.15)',  border: '1px solid rgba(59,130,246,0.5)',  color: '#93c5fd' },
  SEDAD:    { background: 'rgba(239,68,68,0.15)',   border: '1px solid rgba(239,68,68,0.5)',   color: '#fca5a5' },
  CASH:     { background: 'rgba(139,92,246,0.15)',  border: '1px solid rgba(139,92,246,0.5)',  color: '#c4b5fd' },
  VIREMENT: { background: 'rgba(16,185,129,0.15)',  border: '1px solid rgba(16,185,129,0.5)',  color: '#6ee7b7' },
}

const BTN_INACTIVE: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#64748b',
}

const FILTER_PANEL: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
  padding: '1rem',
}

const DATE_INPUT: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e2e8f0',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  outline: 'none',
}

const DATE_INPUT_ACTIVE: React.CSSProperties = {
  ...DATE_INPUT,
  border: '1px solid rgba(82,113,255,0.45)',
}

const SEL_BASE: React.CSSProperties = {
  background: 'rgba(6,9,27,0.85)',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  outline: 'none',
  minWidth: '150px',
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

function TransactionDialog({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  const [comptes, setComptes] = useState<Compte[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [compteId, setCompteId] = useState('')
  const [categorieId, setCategorieId] = useState('')
  const [montant, setMontant] = useState('')
  const [type, setType] = useState<'ENTREE' | 'SORTIE'>('SORTIE')
  const [sourcePaiement, setSourcePaiement] = useState('')
  const [description, setDescription] = useState('')
  const [dateTransaction, setDateTransaction] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      comptesApi.lister().then(setComptes).catch(() => setComptes([]))
      catApi.lister().then(setCategories).catch(() => setCategories([]))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await txApi.creer({
        compteId,
        categorieId: categorieId || undefined,
        montant: parseFloat(montant),
        type,
        sourcePaiement,
        description,
        dateTransaction: new Date(dateTransaction).toISOString(),
      })
      toast({ title: t('transactions.created_toast'), type: 'success' })
      onSave()
      onClose()
    } catch (err) {
      toast({ title: t('common.error'), description: err instanceof Error ? err.message : t('common.unknown_error'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('transactions.form_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('common.type')}</Label>
              <div className="flex gap-2">
                {(['ENTREE', 'SORTIE'] as const).map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setType(tp)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                      type === tp
                        ? tp === 'ENTREE'
                          ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
                          : 'border-red-600 bg-red-900/40 text-red-300'
                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {tp === 'ENTREE' ? t('transactions.type.ENTREE') : t('transactions.type.SORTIE')}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input
                type="number" step="0.01" min="0"
                value={montant} onChange={(e) => setMontant(e.target.value)}
                placeholder="0.00" required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('nav.accounts')}</Label>
            <select
              value={compteId} onChange={(e) => setCompteId(e.target.value)} required
              className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
            >
              <option value="">{t('transactions.account_select')}</option>
              {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t('common.category')}</Label>
            <select
              value={categorieId} onChange={(e) => setCategorieId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
            >
              <option value="">{t('transactions.category_select')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.source_label')}</Label>
            <Input
              value={sourcePaiement} onChange={(e) => setSourcePaiement(e.target.value)}
              placeholder={t('transactions.source_placeholder')} required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.desc_label')}</Label>
            <Input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t('transactions.desc_placeholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('common.date')}</Label>
            <Input
              type="date" value={dateTransaction}
              onChange={(e) => setDateTransaction(e.target.value)} required
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { t } = useTranslation()
  const { data: transactions, loading, refetch } = useApi(() => txApi.lister())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [allCategories, setAllCategories] = useState<Categorie[]>([])

  // Filtres
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'TOUS' | 'ENTREE' | 'DEPENSE' | 'SORTIE'>('TOUS')
  const [page, setPage] = useState(1)
  const [filterSource, setFilterSource] = useState<string>('')
  const [filterDateDu, setFilterDateDu] = useState('')
  const [filterDateAu, setFilterDateAu] = useState('')
  const [filterMontantMin, setFilterMontantMin] = useState('')
  const [filterMontantMax, setFilterMontantMax] = useState('')
  const [filterCategorie, setFilterCategorie] = useState('')

  // Tri
  const [sortCol, setSortCol] = useState<SortCol>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    catApi.lister().then(setAllCategories).catch(() => {})
  }, [])

  const resetFilters = () => {
    setSearch('')
    setFilterType('TOUS')
    setFilterSource('')
    setFilterDateDu('')
    setFilterDateAu('')
    setFilterMontantMin('')
    setFilterMontantMax('')
    setFilterCategorie('')
    setPage(1)
  }

  const hasActiveFilters =
    filterType !== 'TOUS' || !!search || !!filterSource ||
    !!filterDateDu || !!filterDateAu || !!filterMontantMin ||
    !!filterMontantMax || !!filterCategorie

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [
    filterType, search, filterSource, filterDateDu, filterDateAu,
    filterMontantMin, filterMontantMax, filterCategorie, sortCol, sortDir,
  ])

  const filtered = useMemo(() => {
    let list = [...(transactions ?? [])] as Transaction[]

    if (filterType !== 'TOUS') list = list.filter(tx => tx.type === filterType)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(tx =>
        `${tx.description ?? ''} ${tx.sourcePaiement ?? ''} ${tx.categorieNom ?? ''}`.toLowerCase().includes(q)
      )
    }

    if (filterSource) list = list.filter(tx => tx.sourcePaiement === filterSource)

    if (filterDateDu) list = list.filter(tx => new Date(tx.dateTransaction) >= new Date(filterDateDu))
    if (filterDateAu) list = list.filter(tx => new Date(tx.dateTransaction) <= new Date(filterDateAu + 'T23:59:59'))

    if (filterMontantMin !== '') list = list.filter(tx => tx.montant >= parseFloat(filterMontantMin))
    if (filterMontantMax !== '') list = list.filter(tx => tx.montant <= parseFloat(filterMontantMax))

    if (filterCategorie) list = list.filter(tx => tx.categorieNom === filterCategorie)

    list.sort((a, b) => {
      const diff = sortCol === 'montant'
        ? a.montant - b.montant
        : new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime()
      return sortDir === 'asc' ? diff : -diff
    })

    return list
  }, [
    transactions, filterType, search, filterSource,
    filterDateDu, filterDateAu, filterMontantMin, filterMontantMax,
    filterCategorie, sortCol, sortDir,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async (id: string) => {
    if (!confirm(t('transactions.delete_confirm'))) return
    setDeleting(id)
    try {
      await txApi.supprimer(id)
      toast({ title: t('transactions.deleted_toast'), type: 'success' })
      refetch()
    } catch (err) {
      toast({ title: t('common.error'), description: err instanceof Error ? err.message : t('common.unknown_error'), type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ChevronUp className="h-3 w-3 opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3" style={{ color: '#818cf8' }} />
      : <ChevronDown className="h-3 w-3" style={{ color: '#818cf8' }} />
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{t('transactions.title')}</h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters && (
              <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: 'rgba(82,113,255,0.15)', color: '#818cf8', border: '1px solid rgba(82,113,255,0.3)' }}>
                Filtrées
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('transactions.new')}
        </Button>
      </div>

      {/* ── Recherche + Type ── */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex flex-wrap gap-2">
          {(['TOUS', 'ENTREE', 'DEPENSE', 'SORTIE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                filterType === f
                  ? f === 'ENTREE'
                    ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
                    : f === 'DEPENSE'
                      ? 'border-red-600 bg-red-900/40 text-red-300'
                      : f === 'SORTIE'
                        ? 'border-blue-600 bg-blue-900/40 text-blue-300'
                        : 'border-slate-500 bg-slate-800/60 text-slate-200'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'TOUS' ? t('transactions.type.all')
                : f === 'ENTREE' ? t('transactions.type.ENTREE')
                : f === 'DEPENSE' ? 'Dépense'
                : 'Virement'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtres avancés ── */}
      <div style={FILTER_PANEL} className="space-y-4">

        {/* Source de paiement */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider shrink-0 w-16" style={{ color: '#64748b' }}>
            Source
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterSource('')}
              className="rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={!filterSource
                ? { background: 'rgba(82,113,255,0.2)', border: '1px solid rgba(82,113,255,0.5)', color: '#a5b4fc' }
                : BTN_INACTIVE}
            >
              Toutes
            </button>
            {SOURCES.map(src => {
              const isActive = filterSource === src
              return (
                <button
                  key={src}
                  onClick={() => setFilterSource(isActive ? '' : src)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                  style={isActive ? SOURCE_ACTIVE[src] : BTN_INACTIVE}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#94a3b8' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#64748b' }}
                >
                  {SOURCE_LABELS[src]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Période + Montant + Catégorie + Reset */}
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">

          {/* Période */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#64748b' }}>Du</label>
              <input
                type="date"
                value={filterDateDu}
                onChange={e => setFilterDateDu(e.target.value)}
                style={filterDateDu ? DATE_INPUT_ACTIVE : DATE_INPUT}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#64748b' }}>Au</label>
              <input
                type="date"
                value={filterDateAu}
                onChange={e => setFilterDateAu(e.target.value)}
                style={filterDateAu ? DATE_INPUT_ACTIVE : DATE_INPUT}
              />
            </div>
          </div>

          {/* Diviseur vertical */}
          <div
            className="hidden sm:block self-stretch"
            style={{ width: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 4px' }}
          />

          {/* Montant */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#64748b' }}>Min (MRU)</label>
              <input
                type="number"
                min="0"
                value={filterMontantMin}
                onChange={e => setFilterMontantMin(e.target.value)}
                placeholder="0"
                style={{
                  ...(filterMontantMin ? DATE_INPUT_ACTIVE : DATE_INPUT),
                  width: '108px',
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#64748b' }}>Max (MRU)</label>
              <input
                type="number"
                min="0"
                value={filterMontantMax}
                onChange={e => setFilterMontantMax(e.target.value)}
                placeholder="∞"
                style={{
                  ...(filterMontantMax ? DATE_INPUT_ACTIVE : DATE_INPUT),
                  width: '108px',
                }}
              />
            </div>
          </div>

          {/* Diviseur vertical */}
          <div
            className="hidden sm:block self-stretch"
            style={{ width: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 4px' }}
          />

          {/* Catégorie */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: '#64748b' }}>Catégorie</label>
            <select
              value={filterCategorie}
              onChange={e => setFilterCategorie(e.target.value)}
              style={{
                ...SEL_BASE,
                border: filterCategorie
                  ? '1px solid rgba(82,113,255,0.45)'
                  : '1px solid rgba(255,255,255,0.1)',
                color: filterCategorie ? '#e2e8f0' : '#64748b',
              }}
            >
              <option value="">Toutes les catégories</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.nom}>{cat.nom}</option>
              ))}
            </select>
          </div>

          {/* Réinitialiser */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all self-end"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <LoadingSpinner fullPage />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={t('transactions.empty_title')}
          description={t('transactions.empty_desc')}
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> {t('transactions.new')}
            </Button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  {/* DATE — triable */}
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {t('common.date')}
                      <SortIcon col="date" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {t('common.description')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">
                    {t('common.category')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">
                    {t('common.source')}
                  </th>
                  {/* MONTANT — triable */}
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('montant')}
                      className="flex items-center justify-end gap-1 w-full text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {t('common.amount')}
                      <SortIcon col="montant" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {t('common.type')}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.map((tx: Transaction) => {
                  const srcStyle = SOURCE_ACTIVE[tx.sourcePaiement as Source]
                  const isEntree = tx.type === 'ENTREE'
                  const isVirement = tx.type === 'SORTIE'
                  return (
                    <tr key={tx.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs tabular-nums">
                        {formatDate(tx.dateTransaction)}
                      </td>
                      <td className="px-4 py-3 text-slate-100 max-w-[200px] truncate">
                        {tx.description || tx.sourcePaiement}
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                        {tx.categorieNom ?? <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {tx.sourcePaiement ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={srcStyle ?? { color: '#64748b' }}
                          >
                            {SOURCE_LABELS[tx.sourcePaiement] ?? tx.sourcePaiement}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-xs">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums ${
                        isEntree ? 'text-emerald-400' : isVirement ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {isEntree ? '+' : '−'}{formatMontant(tx.montant)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={isEntree ? 'success' : isVirement ? 'outline' : 'destructive'}
                          className="gap-1"
                        >
                          {isEntree
                            ? <ArrowDownLeft className="h-3 w-3" />
                            : isVirement
                              ? <ArrowLeftRight className="h-3 w-3" />
                              : <ArrowUpRight className="h-3 w-3" />}
                          {isEntree ? t('transactions.type.ENTREE') : isVirement ? 'Virement' : 'Dépense'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deleting === tx.id}
                          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                          {deleting === tx.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs" style={{ color: '#64748b' }}>
            Page {page} / {totalPages} · {filtered.length} résultats
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Préc.
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-xs" style={{ color: '#475569' }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="h-8 w-8 rounded-lg text-xs font-semibold transition-colors"
                    style={page === p
                      ? { background: 'rgba(82,113,255,0.25)', border: '1px solid rgba(82,113,255,0.5)', color: '#a5b4fc' }
                      : { border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }
                    }
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
            >
              Suiv. <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={refetch}
      />
    </div>
  )
}
