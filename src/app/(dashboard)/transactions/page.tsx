"use client"
import { useState, useEffect } from 'react'
import { Plus, ArrowLeftRight, Trash2, Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
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

function TransactionDialog({
  open,
  onClose,
  onSave,
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
                type="number"
                step="0.01"
                min="0"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('nav.accounts')}</Label>
            <select
              value={compteId}
              onChange={(e) => setCompteId(e.target.value)}
              required
              className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
            >
              <option value="">{t('transactions.account_select')}</option>
              {comptes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t('common.category')}</Label>
            <select
              value={categorieId}
              onChange={(e) => setCategorieId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
            >
              <option value="">{t('transactions.category_select')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.source_label')}</Label>
            <Input
              value={sourcePaiement}
              onChange={(e) => setSourcePaiement(e.target.value)}
              placeholder={t('transactions.source_placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.desc_label')}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('transactions.desc_placeholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('common.date')}</Label>
            <Input
              type="date"
              value={dateTransaction}
              onChange={(e) => setDateTransaction(e.target.value)}
              required
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

export default function TransactionsPage() {
  const { t } = useTranslation()
  const { data: transactions, loading, refetch } = useApi(() => txApi.lister())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<'TOUS' | 'ENTREE' | 'SORTIE'>('TOUS')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

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

  const filtered = (transactions ?? []).filter((tx: Transaction) => {
    if (filterType !== 'TOUS' && tx.type !== filterType) return false
    if (search && !`${tx.description ?? ''} ${tx.sourcePaiement} ${tx.categorieNom ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a: Transaction, b: Transaction) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{t('transactions.title')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('transactions.count', filtered.length)}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('transactions.new')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex gap-2">
          {(['TOUS', 'ENTREE', 'SORTIE'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                filterType === f
                  ? 'border-blue-600 bg-blue-900/40 text-blue-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'TOUS' ? t('transactions.type.all') : f === 'ENTREE' ? t('transactions.type.ENTREE') : t('transactions.type.SORTIE')}
            </button>
          ))}
        </div>
      </div>

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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('common.date')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('common.description')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">{t('common.category')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">{t('common.source')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('common.amount')}</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('common.type')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDate(tx.dateTransaction)}</td>
                    <td className="px-4 py-3 text-slate-100 max-w-[200px] truncate">
                      {tx.description || tx.sourcePaiement}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                      {tx.categorieNom ?? <span className="italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{tx.sourcePaiement}</td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${tx.type === 'ENTREE' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'ENTREE' ? '+' : '-'}{formatMontant(tx.montant)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={tx.type === 'ENTREE' ? 'success' : 'destructive'} className="gap-1">
                        {tx.type === 'ENTREE'
                          ? <ArrowDownLeft className="h-3 w-3" />
                          : <ArrowUpRight className="h-3 w-3" />
                        }
                        {tx.type === 'ENTREE' ? t('transactions.type.ENTREE') : t('transactions.type.SORTIE')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deleting === tx.id}
                        className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        {deleting === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
