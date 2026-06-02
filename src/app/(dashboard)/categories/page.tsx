"use client"
import { useState } from 'react'
import { Plus, Tag, Trash2, Loader2 } from 'lucide-react'
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
import type { Categorie } from '@/types'

const COULEURS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#64748B',
]

function CategorieDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: () => void
}) {
  const [nom, setNom] = useState('')
  const [type, setType] = useState<'ENTREE' | 'SORTIE'>('SORTIE')
  const [couleur, setCouleur] = useState('#3B82F6')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await catApi.creer({ nom, type, couleur })
      toast({ title: 'Catégorie créée', type: 'success' })
      setNom('')
      setCouleur('#3B82F6')
      onSave()
      onClose()
    } catch (err) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Alimentation, Salaire…"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(['ENTREE', 'SORTIE'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? t === 'ENTREE'
                        ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
                        : 'border-red-600 bg-red-900/40 text-red-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t === 'ENTREE' ? 'Revenus' : 'Dépenses'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Couleur</Label>
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
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CategoriesPage() {
  const { data: categories, loading, refetch } = useApi(() => catApi.lister())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    setDeleting(id)
    try {
      await catApi.supprimer(id)
      toast({ title: 'Catégorie supprimée', type: 'success' })
      refetch()
    } catch (err) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', type: 'error' })
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
          <h2 className="text-2xl font-bold text-slate-100">Catégories</h2>
          <p className="text-slate-400 text-sm mt-1">{categories?.length ?? 0} catégorie(s)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Aucune catégorie"
          description="Créez des catégories pour organiser vos transactions"
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Nouvelle catégorie
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {entrees.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Revenus ({entrees.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {entrees.map((cat: Categorie) => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    onDelete={handleDelete}
                    deleting={deleting}
                  />
                ))}
              </div>
            </div>
          )}
          {sorties.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Dépenses ({sorties.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {sorties.map((cat: Categorie) => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    onDelete={handleDelete}
                    deleting={deleting}
                  />
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
  return (
    <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-4 flex items-center gap-3 group">
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ background: cat.couleur ?? '#64748B' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">{cat.nom}</p>
        <Badge variant={cat.type === 'ENTREE' ? 'success' : 'destructive'} className="mt-1">
          {cat.type === 'ENTREE' ? 'Revenus' : 'Dépenses'}
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
