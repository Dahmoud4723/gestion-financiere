"use client"
import React, { useState } from 'react'
import {
  Plus, Tag, Trash2, Loader2,
  ShoppingCart, Car, Home, Heart, Utensils, Gamepad2, Shirt, GraduationCap,
  Plane, FileText, Briefcase, TrendingUp, Gift, ArrowDownLeft, Tv, Building2,
  Smartphone, Coffee, Fuel, ShoppingBag, Music, Baby, Wallet, Wrench, type LucideIcon,
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { categories as catApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from '@/components/ui/use-toast'
import { useTranslation } from '@/contexts/LanguageContext'
import type { Categorie } from '@/types'

const COULEURS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#64748B',
]

const ICONE_MAP: Array<[string[], LucideIcon]> = [
  [['alimentation', 'nourriture', 'courses', 'supermarché', 'épicerie'], ShoppingCart],
  [['restaurant', 'repas', 'fast food', 'fast-food'], Utensils],
  [['café', 'coffee'], Coffee],
  [['transport', 'voiture', 'auto', 'véhicule', 'bus', 'métro', 'taxi', 'uber'], Car],
  [['essence', 'carburant', 'fuel'], Fuel],
  [['logement', 'loyer', 'maison', 'appartement', 'immobilier', 'charges'], Home],
  [['santé', 'médecin', 'pharmacie', 'médical', 'dentiste', 'hôpital'], Heart],
  [['loisirs', 'divertissement', 'sport', 'jeux', 'cinéma'], Gamepad2],
  [['musique', 'concert'], Music],
  [['vêtements', 'habillement', 'mode', 'habits'], Shirt],
  [['éducation', 'formation', 'école', 'université', 'cours'], GraduationCap],
  [['voyage', 'vacances', 'hôtel', 'avion', 'tourisme'], Plane],
  [['factures', 'électricité', 'eau', 'gaz', 'internet'], FileText],
  [['abonnements', 'streaming', 'netflix', 'spotify'], Tv],
  [['shopping', 'achats', 'commerce'], ShoppingBag],
  [['impôts', 'taxes', 'fiscalité'], Building2],
  [['téléphone', 'mobile', 'forfait'], Smartphone],
  [['enfants', 'bébé', 'crèche', 'baby'], Baby],
  [['salaire', 'paie', 'rémunération'], Briefcase],
  [['investissement', 'bourse', 'actions', 'dividende'], TrendingUp],
  [['bonus', 'prime', 'gratification'], Gift],
  [['freelance', 'mission', 'prestation'], Wallet],
  [['entretien', 'réparation', 'maintenance'], Wrench],
]

function getCategorieIcon(nom: string, type: string): LucideIcon {
  const key = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  for (const [keywords, icon] of ICONE_MAP) {
    if (keywords.some((k) => {
      const kn = k.normalize('NFD').replace(/[̀-ͯ]/g, '')
      return key.includes(kn) || kn.includes(key)
    })) return icon
  }
  return type === 'ENTREE' ? ArrowDownLeft : Tag
}

function CategorieDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  const [nom, setNom] = useState('')
  const [type, setType] = useState<'ENTREE' | 'SORTIE'>('SORTIE')
  const [couleur, setCouleur] = useState('#3B82F6')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await catApi.creer({ nom, type, couleur })
      toast({ title: t('categories.created_toast'), type: 'success' })
      setNom('')
      setCouleur('#3B82F6')
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
          <DialogTitle>{t('categories.form_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>{t('common.name')}</Label>
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={t('categories.name_placeholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('common.type')}</Label>
            <div className="flex gap-2">
              {(['ENTREE', 'SORTIE'] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setType(tp)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    type === tp
                      ? tp === 'ENTREE'
                        ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
                        : 'border-red-600 bg-red-900/40 text-red-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {tp === 'ENTREE' ? t('categories.type.ENTREE') : t('categories.type.SORTIE')}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('common.color')}</Label>
            <div className="flex flex-wrap gap-2">
              {COULEURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCouleur(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${couleur === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
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

export default function CategoriesPage() {
  const { t } = useTranslation()
  const { data: categories, loading, refetch } = useApi(() => catApi.lister())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm(t('categories.delete_confirm'))) return
    setDeleting(id)
    try {
      await catApi.supprimer(id)
      toast({ title: t('categories.deleted_toast'), type: 'success' })
      refetch()
    } catch (err) {
      toast({ title: t('common.error'), description: err instanceof Error ? err.message : t('common.unknown_error'), type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const entrees = (categories ?? []).filter((c: Categorie) => c.type === 'ENTREE')
  const sorties = (categories ?? []).filter((c: Categorie) => c.type === 'SORTIE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{t('categories.title')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('categories.count', categories?.length ?? 0)}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('categories.new')}
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={t('categories.empty_title')}
          description={t('categories.empty_desc')}
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> {t('categories.new')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {entrees.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {t('categories.income_section', entrees.length)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {entrees.map((cat: Categorie) => (
                  <CategoryCard key={cat.id} cat={cat} onDelete={handleDelete} deleting={deleting} />
                ))}
              </div>
            </div>
          )}
          {sorties.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {t('categories.expenses_section', sorties.length)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {sorties.map((cat: Categorie) => (
                  <CategoryCard key={cat.id} cat={cat} onDelete={handleDelete} deleting={deleting} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CategorieDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={refetch}
      />
    </div>
  )
}

function CategoryCard({
  cat,
  onDelete,
  deleting,
}: {
  cat: Categorie
  onDelete: (id: string) => void
  deleting: string | null
}) {
  const { t } = useTranslation()
  const color = cat.couleur ?? '#64748B'

  return (
    <div className="card p-4 flex items-center gap-3 group">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
        style={{ background: `${color}22` }}
      >
        {React.createElement(getCategorieIcon(cat.nom, cat.type), { className: 'h-5 w-5', style: { color } })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">{cat.nom}</p>
        <Badge variant={cat.type === 'ENTREE' ? 'success' : 'destructive'} className="mt-1">
          {cat.type === 'ENTREE' ? t('categories.type.ENTREE') : t('categories.type.SORTIE')}
        </Badge>
      </div>
      {!cat.estSysteme && (
        <button
          onClick={() => onDelete(cat.id)}
          disabled={deleting === cat.id}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          {deleting === cat.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  )
}
