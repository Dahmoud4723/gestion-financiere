"use client"
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/contexts/LanguageContext'
import type { Locale } from '@/i18n'

interface HeaderProps {
  title: string
  alertesNonLues?: number
  onMenuClick?: () => void
}

export function Header({ title, alertesNonLues = 0, onMenuClick }: HeaderProps) {
  const { utilisateur } = useAuth()
  const { locale, setLocale } = useTranslation()

  const otherLocale: Locale = locale === 'fr' ? 'ar' : 'fr'
  const initial = utilisateur?.nom?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <header
      className="flex items-center gap-4 px-6 py-3.5 relative z-10"
      style={{
        background: 'rgba(6,9,27,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(82,113,255,0.08)',
        boxShadow: '0 1px 0 rgba(82,113,255,0.04)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
        style={{ color: '#4a6080', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(100,130,200,0.1)' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#c8d8f0'; e.currentTarget.style.background = 'rgba(82,113,255,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#4a6080'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-lg font-bold tracking-tight" style={{ color: '#e2e8f8' }}>{title}</h1>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <button
          onClick={() => setLocale(otherLocale)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            background: 'rgba(82,113,255,0.06)',
            border: '1px solid rgba(100,130,200,0.12)',
            color: '#5a7299',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(82,113,255,0.14)'
            el.style.borderColor = 'rgba(82,113,255,0.35)'
            el.style.color = '#8da8ff'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(82,113,255,0.06)'
            el.style.borderColor = 'rgba(100,130,200,0.12)'
            el.style.color = '#5a7299'
          }}
          title={locale === 'fr' ? 'Switch to Arabic' : 'Passer en français'}
        >
          {locale === 'fr' ? 'ع' : 'FR'}
        </button>

        {/* Alerts bell */}
        <Link
          href="/alertes"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
          style={{ background: 'rgba(82,113,255,0.06)', border: '1px solid rgba(100,130,200,0.12)', color: '#5a7299' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#8da8ff'; e.currentTarget.style.background = 'rgba(82,113,255,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#5a7299'; e.currentTarget.style.background = 'rgba(82,113,255,0.06)' }}
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {alertesNonLues > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ff4d72, #e0325a)' }}>
              {alertesNonLues > 9 ? '9+' : alertesNonLues}
            </span>
          )}
        </Link>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 ps-1">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-[5px]"
              style={{ background: 'linear-gradient(135deg, rgba(82,113,255,0.6), rgba(124,95,255,0.4))' }} />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #5271ff, #7c5fff)' }}>
              {initial}
            </div>
          </div>
          <span className="hidden md:block text-sm font-semibold" style={{ color: '#c8d8f0' }}>
            {utilisateur?.nom ?? 'Utilisateur'}
          </span>
        </div>
      </div>
    </header>
  )
}
