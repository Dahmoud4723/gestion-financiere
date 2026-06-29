"use client"
import { useState, useEffect } from 'react'
import { Plus, CreditCard, Pencil, Trash2, Loader2, ArrowLeftRight } from 'lucide-react'
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

const SELECT_CLS = "flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"

const TYPE_ACCENT: Record<string, string> = {
  COURANT:        '#5271ff',
  EPARGNE:        '#10b981',
  MOBILE:         '#f59e0b',
  INVESTISSEMENT: '#8b5cf6',
  CREDIT:         '#ef4444',
}

// ─── Dialog : créer / modifier un compte ──────────────────────────────────────

function CompteDialog({
  open, compte, onClose, onSave,
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
            <select value={type} onChange={(e) => setType(e.target.value)} className={SELECT_CLS}>
              {Object.entries(typeLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('accounts.balance_label')}</Label>
              <Input type="number" step="0.01" value={soldeInitial} onChange={(e) => setSoldeInitial(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>{t('common.currency')}</Label>
              <select value={devise} onChange={(e) => setDevise(e.target.value)} className={SELECT_CLS}>
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

// ─── Dialog : virement entre comptes ─────────────────────────────────────────

function VirementDialog({
  open, comptes, onClose, onSave,
}: {
  open: boolean
  comptes: Compte[]
  onClose: () => void
  onSave: () => void
}) {
  const today = new Date().toISOString().split('T')[0]

  const [sourceId, setSourceId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Initialise les selects dès que la liste des comptes est disponible
  useEffect(() => {
    if (open && comptes.length >= 2) {
      setSourceId(comptes[0].id)
      setDestinationId(comptes[1].id)
    }
    if (open) {
      setMontant('')
      setDescription('')
      setDate(today)
      setValidationError(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Comptes disponibles comme destination (exclut la source)
  const destinationsDisponibles = comptes.filter(c => c.id !== sourceId)

  // Recale la destination si elle devient égale à la source
  useEffect(() => {
    if (destinationId && destinationId === sourceId) {
      const autre = comptes.find(c => c.id !== sourceId)
      setDestinationId(autre?.id ?? '')
    }
  }, [sourceId, destinationId, comptes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const m = parseFloat(montant)
    const source = comptes.find(c => c.id === sourceId)

    if (!sourceId || !destinationId) {
      setValidationError('Veuillez sélectionner les deux comptes.')
      return
    }
    if (sourceId === destinationId) {
      setValidationError('Les comptes source et destination doivent être différents.')
      return
    }
    if (!m || m <= 0) {
      setValidationError('Le montant doit être supérieur à 0.')
      return
    }
    if (source && source.soldeActuel < m) {
      setValidationError(
        `Solde insuffisant — disponible : ${formatMontant(source.soldeActuel, source.devise)}`
      )
      return
    }

    setLoading(true)
    try {
      await comptesApi.virement({
        compteSourceId: sourceId,
        compteDestinationId: destinationId,
        montant: m,
        description: description.trim() || undefined,
        dateTransaction: new Date(date).toISOString(),
      })
      toast({ title: `Virement de ${formatMontant(m)} effectué !`, type: 'success' })
      onSave()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      toast({ title: 'Erreur lors du virement', description: msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const sourceSelectionnee = comptes.find(c => c.id === sourceId)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'rgba(82,113,255,0.15)', border: '1px solid rgba(82,113,255,0.3)' }}
            >
              <ArrowLeftRight className="h-4 w-4" style={{ color: '#818cf8' }} />
            </div>
            Virement entre comptes
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Compte source */}
          <div className="space-y-2">
            <Label>Compte source</Label>
            <select
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
              required
              className={SELECT_CLS}
            >
              <option value="">Sélectionner un compte…</option>
              {comptes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} — {formatMontant(c.soldeActuel, c.devise)}
                </option>
              ))}
            </select>
            {sourceSelectionnee && (
              <p className="text-xs" style={{ color: '#64748b' }}>
                Solde disponible :{' '}
                <span
                  className="font-semibold"
                  style={{ color: sourceSelectionnee.soldeActuel >= 0 ? '#34d399' : '#f87171' }}
                >
                  {formatMontant(sourceSelectionnee.soldeActuel, sourceSelectionnee.devise)}
                </span>
              </p>
            )}
          </div>

          {/* Flèche visuelle */}
          <div className="flex items-center justify-center">
            <div
              className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
              style={{ background: 'rgba(82,113,255,0.1)', border: '1px solid rgba(82,113,255,0.2)', color: '#818cf8' }}
            >
              <ArrowLeftRight className="h-3 w-3" />
              vers
            </div>
          </div>

          {/* Compte destination */}
          <div className="space-y-2">
            <Label>Compte destination</Label>
            <select
              value={destinationId}
              onChange={e => setDestinationId(e.target.value)}
              required
              disabled={!sourceId}
              className={SELECT_CLS}
            >
              <option value="">Sélectionner un compte…</option>
              {destinationsDisponibles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} — {formatMontant(c.soldeActuel, c.devise)}
                </option>
              ))}
            </select>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label>Montant (MRU)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Description (optionnelle) */}
          <div className="space-y-2">
            <Label>
              Description{' '}
              <span className="text-xs font-normal" style={{ color: '#475569' }}>(optionnel)</span>
            </Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex : Épargne mensuelle"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Erreur de validation inline */}
          {validationError && (
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
            >
              <span className="shrink-0 font-bold">✕</span>
              {validationError}
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              type="submit"
              disabled={loading || comptes.length < 2}
              style={{ background: 'linear-gradient(135deg, #5271ff, #7c5fff)' }}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Virement…</>
                : <><ArrowLeftRight className="h-4 w-4" /> Effectuer le virement</>
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComptesPage() {
  const { t } = useTranslation()
  const { data: comptes, loading, refetch } = useApi(() => comptesApi.lister())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [virementOpen, setVirementOpen] = useState(false)
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

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{t('accounts.title')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('accounts.count', comptes?.length ?? 0)}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Virement */}
          <button
            onClick={() => setVirementOpen(true)}
            disabled={!comptes || comptes.length < 2}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(82,113,255,0.12)',
              border: '1px solid rgba(82,113,255,0.3)',
              color: '#818cf8',
            }}
            onMouseEnter={e => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'rgba(82,113,255,0.2)'
                e.currentTarget.style.borderColor = 'rgba(82,113,255,0.5)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(82,113,255,0.12)'
              e.currentTarget.style.borderColor = 'rgba(82,113,255,0.3)'
            }}
            title={!comptes || comptes.length < 2 ? 'Il faut au moins 2 comptes' : undefined}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Virement
          </button>

          {/* Bouton Nouveau compte */}
          <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4" />
            {t('accounts.new')}
          </Button>
        </div>
      </div>

      {/* ── Grille des comptes ── */}
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
            <div
              key={compte.id}
              className="card p-6 flex flex-col gap-4"
              style={{ borderLeft: `3px solid ${TYPE_ACCENT[compte.type] ?? 'rgba(255,255,255,0.08)'}` }}
            >
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
                    {deleting === compte.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
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

      {/* ── Modals ── */}
      <CompteDialog
        open={dialogOpen}
        compte={selected}
        onClose={() => setDialogOpen(false)}
        onSave={refetch}
      />

      <VirementDialog
        open={virementOpen}
        comptes={comptes ?? []}
        onClose={() => setVirementOpen(false)}
        onSave={refetch}
      />
    </div>
  )
}
