"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Landmark, Eye, EyeOff, Loader2, User, Mail, Lock, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth, organisations } from '@/lib/api'
import { useTranslation } from '@/contexts/LanguageContext'
import type { Organisation } from '@/types'

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useTranslation()
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
      setError(err instanceof Error ? err.message : t('auth.register.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg flex min-h-screen items-center justify-center px-4 py-12">
      {/* Animated orbs */}
      <div className="auth-orb auth-orb-1 animate-blob" />
      <div className="auth-orb auth-orb-2 animate-blob-2" />
      <div className="auth-orb auth-orb-3 animate-blob-3" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="relative mb-4 animate-float">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-600 blur-xl opacity-60 animate-glow" />
            <div className="relative flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 shadow-2xl">
              <Landmark className="h-7 w-7 text-white" strokeWidth={1.75} />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="gradient-text">{t('auth.register.title')}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">{t('auth.register.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-400">✕</span>
                {error}
              </div>
            )}

            {/* Nom */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                {t('auth.register.name')}
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={t('auth.register.name_placeholder')}
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                {t('auth.login.email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  type="email"
                  placeholder={t('auth.login.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                {t('auth.login.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Organisation */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {t('auth.register.org')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(['new', 'existing'] as const).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setOrgChoice(choice)}
                    className={`rounded-xl border py-2 text-sm font-semibold transition-all duration-200 ${
                      orgChoice === choice
                        ? 'border-blue-500/50 bg-blue-500/15 text-blue-300 shadow-sm shadow-blue-500/10'
                        : 'border-slate-700/60 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {choice === 'new' ? t('auth.register.org_new') : t('auth.register.org_existing')}
                  </button>
                ))}
              </div>
              {orgChoice === 'new' ? (
                <Input
                  placeholder={t('auth.register.org_name')}
                  value={nouvelleOrg}
                  onChange={(e) => setNouvelleOrg(e.target.value)}
                />
              ) : (
                <select
                  value={organisationId}
                  onChange={(e) => setOrganisationId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                >
                  <option value="">{t('auth.register.org_select')}</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.nom}</option>
                  ))}
                </select>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-base mt-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('auth.register.loading')}
                </>
              ) : (
                t('auth.register.submit')
              )}
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-xs text-slate-600">{t('auth.register.has_account')}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-slate-700 to-transparent" />
          </div>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              ← {t('auth.register.login_link')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
