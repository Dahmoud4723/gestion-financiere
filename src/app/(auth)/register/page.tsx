"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Landmark, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth, organisations } from '@/lib/api'
import type { Organisation } from '@/types'

export default function RegisterPage() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [orgChoice, setOrgChoice] = useState<'existing' | 'new'>('new')
  const [organisationId, setOrganisationId] = useState('')
  const [nouvelleOrg, setNouvelleOrg] = useState('')
  const [orgs, setOrgs] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    organisations.lister().then(setOrgs).catch(() => setOrgs([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let finalOrgId = organisationId
      if (orgChoice === 'new' && nouvelleOrg.trim()) {
        const slug = nouvelleOrg.trim().toLowerCase().replace(/\s+/g, '-')
        const org = await organisations.creer({ nom: nouvelleOrg.trim(), slug })
        finalOrgId = org.id
      }
      const data = await auth.inscrire({
        nom: nom.trim(),
        email: email.trim(),
        motDePasse,
        organisationId: finalOrgId || undefined,
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-700 mb-4 shadow-lg shadow-blue-900/50">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Créer un compte</h1>
          <p className="text-slate-400 text-sm mt-1">Rejoignez Gestion Financière</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet</Label>
              <Input
                id="nom"
                type="text"
                placeholder="Jean Dupont"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motDePasse">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Organisation */}
            <div className="space-y-2">
              <Label>Organisation</Label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setOrgChoice('new')}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    orgChoice === 'new'
                      ? 'border-blue-600 bg-blue-900/40 text-blue-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  Nouvelle org.
                </button>
                <button
                  type="button"
                  onClick={() => setOrgChoice('existing')}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    orgChoice === 'existing'
                      ? 'border-blue-600 bg-blue-900/40 text-blue-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  Existante
                </button>
              </div>
              {orgChoice === 'new' ? (
                <Input
                  placeholder="Nom de l'organisation"
                  value={nouvelleOrg}
                  onChange={(e) => setNouvelleOrg(e.target.value)}
                />
              ) : (
                <select
                  value={organisationId}
                  onChange={(e) => setOrganisationId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une organisation</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.nom}</option>
                  ))}
                </select>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inscription en cours…
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
