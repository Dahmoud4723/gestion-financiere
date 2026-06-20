"use client"
import { useState, useEffect, startTransition } from 'react'
import { Plus, PieChart, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { budgets as budgetsApi, categories as catApi } from '@/lib/api'
import { formatMontant } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from '@/components/ui/use-toast'
import { useTranslation } from '@/contexts/LanguageContext'
import type { Budget, Categorie } from '@/types'

function BudgetDialog({
  open,
  budget,
  onClose,
  onSave,
}: {
  open: boolean
  budget?: Budget | null
  onClose: () => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Categorie[]>([])
  const [categorieId, setCategorieId] = useState(budget?.categorieId ?? '')
  const [montantLimite, setMontantLimite] = useState(String(budget?.montantLimite ?? ''))
  const [dateDebut, setDateDebut] = useState(
    budget?.dateDebut ? budget.dateDebut.split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [dateFin, setDateFin] = useState(
    budget?.dateFin
      ? budget.dateFin.split('T')[0]
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      catApi.lister().then((cats) => setCategories(cats.filter((c) => c.type === 'SORTIE'))).catch(() => setCategories([]))
      startTransition(() => {
        setCategorieId(budget?.categorieId ?? '')
        setMontantLimite(String(budget?.montantLimite ?? ''))
      })
    }
  }, [open, budget])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        categorieId,
        montantLimite: parseFloat(montantLimite),
        dateDebut: new Date(dateDebut).toISOString(),
        dateFin: new Date(dateFin).toISOString(),
      }
      if (budget) {
        await budgetsApi.modifier(budget.id, payload)
        toast({ title: t('budgets.edited_toast'), type: 'success' })
      } else {
        await budgetsApi.creer(payload)
        toast({ title: t('budgets.created_toast'), type: 'success' })
      }
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
          <DialogTitle>{budget ? t('budgets.form_title_edit') : t('budgets.form_title_new')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>{t('budgets.category_label')}</Label>
            <select
              value={categorieId}
              onChange={(e) => setCategorieId(e.target.value)}
              required
              className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
            >
              <option value="">{t('budgets.category_select')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t('budgets.limit_label')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={montantLimite}
              onChange={(e) => setMontantLimite(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('budgets.start_date')}</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('budgets.end_date')}</Label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (budget ? t('common.edit') : t('common.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function BudgetsPage() {
  const { t } = useTranslation()
  const { data: budgets, loading, refetch } = useApi(() => budgetsApi.lister())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Budget | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm(t('budgets.delete_confirm'))) return
    setDeleting(id)
    try {
      await budgetsApi.supprimer(id)
      toast({ title: t('budgets.deleted_toast'), type: 'success' })
      refetch()
    } catch (err) {
      toast({ title: t('common.error'), description: err instanceof Error ? err.message : t('common.unknown_error'), type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{t('budgets.title')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('budgets.count', budgets?.length ?? 0)}</p>
        </div>
        <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />
          {t('budgets.new')}
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : !budgets || budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title={t('budgets.empty_title')}
          description={t('budgets.empty_desc')}
          action={
            <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
              <Plus className="h-4 w-4" /> {t('budgets.new')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((budget: Budget) => {
            const pct = Math.min(budget.pourcentage ?? 0, 100)
            const barColor = pct >= 90
              ? '!bg-gradient-to-r !from-red-600 !to-rose-500'
              : pct >= 70
              ? '!bg-gradient-to-r !from-amber-500 !to-orange-500'
              : '!bg-gradient-to-r !from-emerald-500 !to-teal-500'
            const badgeV = pct >= 90 ? 'destructive' : pct >= 70 ? 'warning' : 'success'
            const badgeLabel = pct >= 90 ? t('budgets.status.exceeded') : pct >= 70 ? t('budgets.status.warning') : t('budgets.status.ok')

            return (
              <div key={budget.id} className="card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{budget.categorieNom}</p>
                    <Badge variant={badgeV as 'destructive' | 'warning' | 'success'} className="mt-1">
                      {badgeLabel}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setSelected(budget); setDialogOpen(true) }}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deleting === budget.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {deleting === budget.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Progress value={pct} indicatorClassName={barColor} className="h-3" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                    <span>{formatMontant(budget.montantDepense)} {t('budgets.spent')}</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                  <span className="text-xs text-slate-400">{t('budgets.limit_col')}</span>
                  <span className="text-sm font-semibold text-slate-100">{formatMontant(budget.montantLimite)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BudgetDialog
        open={dialogOpen}
        budget={selected}
        onClose={() => setDialogOpen(false)}
        onSave={refetch}
      />
    </div>
  )
}
