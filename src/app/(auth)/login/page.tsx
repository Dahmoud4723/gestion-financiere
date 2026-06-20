"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Landmark, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth } from '@/lib/api'
import { useTranslation } from '@/contexts/LanguageContext'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await auth.connecter(email, motDePasse)
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg flex min-h-screen items-center justify-center px-4 py-12">
      {/* Animated orbs */}
      <div className="auth-orb auth-orb-2 animate-blob" />
      <div className="auth-orb auth-orb-1 animate-blob-2" />
      <div className="auth-orb auth-orb-3 animate-blob-3" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo ring glow */}
          <div className="relative mb-5 animate-float">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 blur-xl opacity-60 animate-glow" />
            <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 shadow-2xl">
              <Landmark className="h-8 w-8 text-white" strokeWidth={1.75} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">{t('app.name')}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">{t('auth.login.title')}</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-400">✕</span>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                {t('auth.login.email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.login.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                {t('auth.login.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  id="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  autoComplete="current-password"
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

            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('auth.login.loading')}
                </>
              ) : (
                t('auth.login.submit')
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-xs text-slate-600">{t('auth.login.no_account')}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-slate-700 to-transparent" />
          </div>
          <div className="mt-4 text-center">
            <Link href="/register" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              {t('auth.login.register_link')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
