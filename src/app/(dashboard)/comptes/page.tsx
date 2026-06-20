"use client"
import { useState } from 'react'
import { Plus, CreditCard, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { comptes as comptesApi } from '@/lib/api'
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
import type { Compte } from '@/types'

function CompteDialog({
  open,
  compte,
  onClose,
  onSave,
}: {
  open: boolean
  compte?: Compte | null
  onClose: () => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  const [nom, setNom] = useState(compte?.nom ?? '')
  const [type, setType] = useState(compte?.type ?? 'COURANT')
  const [soldeInitial, setSoldeInitial] = useState(String(compte?.soldeInitial ?? ''))
  const [devise, setDevise] = useState(compte?.devise ?? 'MRU')
  const [loading, setLoading] = useState(false)

  const typeLabels: Record<string, string> = {
    COURANT: t('accounts.type.COURANT'),
    EPARGNE: t('accounts.type.EPARGNE'),
    CREDIT: t('accounts.type.CREDIT'),
    INVESTISSEMENT: t('accounts.type.INVESTISSEMENT'),
  }

  const init = () => {
    setNom(compte?.nom ?? '')
    setType(compte?.type ?? 'COURANT')
    setSoldeInitial(String(compte?.soldeInitial ?? ''))
    setDevise(compte?.devise ?? 'MRU')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { nom, type, soldeInitial: parseFloat(soldeInitial) || 0, devise }
      if (compte) {
        await comptesApi.modifier(compte.id, payload)
        toast({ title: t('accounts.edited_toast'), type: 'success' })
      } else {
        await comptesApi.creer(payload)
        toast({ title: t('accounts.created_toast'), type: 'success' })
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else init() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{compte ? t('accounts.form_title_edit') : t('accounts.form_title_new')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>{t('accounts.name_label')}</Label>
            <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder={t('accounts.name_placeholder')} required />
          </div>
          <div className="space-y-2">
            <Label>{t('common.type')}</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
            >
              {Object.entries(typeLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('accounts.balance_label')}</Label>
              <Input
                type="number"
                step="0.01"
                value={soldeInitial}
                onChange={(e) => setSoldeInitial(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.currency')}</Label>
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              >
                <option value="MRU">MRU</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="MAD">MAD</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (compte ? t('common.edit') : t('common.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ComptesPage() {
  const { t } = useTranslation()
  const { data: comptes, loading, refetch } = useApi(() => comptesApi.lister())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Compte | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const typeLabels: Record<string, string> = {
    COURANT: t('accounts.type.COURANT'),
    EPARGNE: t('accounts.type.EPARGNE'),
    CREDIT: t('accounts.type.CREDIT'),
    INVESTISSEMENT: t('accounts.type.INVESTISSEMENT'),
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('accounts.delete_confirm'))) return
    setDeleting(id)
    try {
      await comptesApi.supprimer(id)
      toast({ title: t('accounts.deleted_toast'), type: 'success' })
      refetch()
    } catch (err) {
      toast({ title: t('common.error'), description: err instanceof Error ? err.message : t('common.unknown_error'), type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const badgeVariant = (type: string) => {
    if (type === 'EPARGNE') return 'success'
    if (type === 'CREDIT') return 'destructive'
    if (type === 'INVESTISSEMENT') return 'warning'
    return 'primary'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{t('accounts.title')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('accounts.count', comptes?.length ?? 0)}</p>
        </div>
        <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />
          {t('accounts.new')}
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : !comptes || comptes.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t('accounts.empty_title')}
          description={t('accounts.empty_desc')}
          action={
            <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
              <Plus className="h-4 w-4" /> {t('accounts.new')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {comptes.map((compte) => (
            <div key={compte.id} className="card p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-100 text-lg">{compte.nom}</p>
                  <Badge variant={badgeVariant(compte.type)} className="mt-1">
                    {typeLabels[compte.type] ?? compte.type}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setSelected(compte); setDialogOpen(true) }}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(compte.id)}
                    disabled={deleting === compte.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {deleting === compte.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">{t('accounts.current_balance')}</p>
                <p className={`text-3xl font-bold ${compte.soldeActuel >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatMontant(compte.soldeActuel, compte.devise)}
                </p>
              </div>
              <p className="text-xs text-slate-500">{t('common.created_at')} {formatDate(compte.creeLe)}</p>
            </div>
          ))}
        </div>
      )}

      <CompteDialog
        open={dialogOpen}
        compte={selected}
        onClose={() => setDialogOpen(false)}
        onSave={refetch}
      />
    </div>
  )
}
