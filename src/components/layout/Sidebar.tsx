"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Tag,
  PieChart, Bell, Landmark, LogOut, X, User, FileText,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/contexts/LanguageContext'

interface SidebarProps {
  alertesNonLues?: number
  onClose?: () => void
}

export function Sidebar({ alertesNonLues = 0, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { utilisateur, logout } = useAuth()
  const { t } = useTranslation()

  const navItems = [
    { href: '/dashboard',    label: t('nav.dashboard'),    icon: LayoutDashboard },
    { href: '/comptes',      label: t('nav.accounts'),     icon: CreditCard },
    { href: '/transactions', label: t('nav.transactions'), icon: ArrowLeftRight },
    { href: '/categories',   label: t('nav.categories'),   icon: Tag },
    { href: '/budgets',      label: t('nav.budgets'),      icon: PieChart },
    { href: '/alertes',      label: t('nav.alerts'),       icon: Bell },
    { href: '/rapports',     label: t('nav.reports'),      icon: FileText },
    { href: '/profil',       label: t('nav.profile'),      icon: User },
  ]

  const initial = utilisateur?.nom?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <aside className="sidebar-premium flex flex-col h-full w-64 relative">

      {/* Top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), rgba(139,92,246,0.5), transparent)' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-36 pointer-events-none rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

      {/* Header / Logo */}
      <div className="flex items-center justify-between px-5 py-5 relative">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-[10px] opacity-75"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.7))' }} />
            <div className="relative flex items-center justify-center h-9 w-9 rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Landmark className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none tracking-tight">{t('nav.gestion')}</p>
            <p className="text-[11px] leading-none mt-0.5 font-medium" style={{ color: '#7c85c4' }}>{t('nav.financiere')}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden transition-colors" style={{ color: '#4a5568' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a5568')}>
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="mx-5 divider-glow" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }, i) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              style={{ animationDelay: `${i * 50}ms`, color: isActive ? '#e0e7ff' : '#64748b' } as React.CSSProperties}
              className={`animate-slide-left relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'nav-active'
                  : 'hover:bg-white/[0.05]'
              }`}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#c7d2fe' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#64748b' }}
            >
              {/* Active left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #818cf8, #a78bfa)' }} />
              )}
              <Icon
                className="h-4 w-4 shrink-0 transition-colors"
                style={{ color: isActive ? '#818cf8' : undefined }}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span className="flex-1 text-sm">{label}</span>
              {href === '/alertes' && alertesNonLues > 0 && (
                <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white leading-none"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
                  {alertesNonLues > 9 ? '9+' : alertesNonLues}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Separator */}
      <div className="mx-5 divider-glow" />

      {/* User info */}
      <div className="p-4 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full blur-[6px]"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(139,92,246,0.6))' }} />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {initial}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-none" style={{ color: '#c7d2fe' }}>{utilisateur?.nom ?? 'Utilisateur'}</p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: '#475569' }}>{utilisateur?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-200 group"
          style={{ color: '#475569' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.background = 'rgba(244,63,94,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '' }}
        >
          <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  )
}
