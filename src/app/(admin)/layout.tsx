"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Building2, ScrollText,
  ArrowLeft, ShieldAlert, Landmark, LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

function getTokenRole(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1])).role ?? null
  } catch {
    return null
  }
}

const navItems = [
  { href: '/admin',               label: 'Dashboard Admin',  icon: LayoutDashboard },
  { href: '/admin/utilisateurs',  label: 'Utilisateurs',     icon: Users },
  { href: '/admin/organisations', label: 'Organisations',    icon: Building2 },
  { href: '/admin/logs',          label: 'Logs',             icon: ScrollText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { utilisateur, logout } = useAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const role = getTokenRole()
    if (!role) {
      router.replace('/login')
      return
    }
    if (role !== 'ADMIN') {
      router.replace('/dashboard')
      return
    }
    setChecked(true)
  }, [router])

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#06091b' }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: 'rgba(82,113,255,0.2)', borderTopColor: '#5271ff' }}
        />
      </div>
    )
  }

  const initial = utilisateur?.nom?.charAt(0)?.toUpperCase() ?? 'A'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#06091b' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col h-full w-64 shrink-0 relative"
        style={{
          background: 'rgba(6,9,27,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(124,95,255,0.7), rgba(82,113,255,0.5), transparent)' }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-36 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,95,255,0.15) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 relative">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl blur-[10px] opacity-75"
              style={{ background: 'linear-gradient(135deg, rgba(124,95,255,0.9), rgba(82,113,255,0.7))' }}
            />
            <div
              className="relative flex items-center justify-center h-9 w-9 rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c5fff, #5271ff)' }}
            >
              <ShieldAlert className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none tracking-tight">Admin</p>
            <p className="text-[11px] leading-none mt-0.5 font-medium" style={{ color: '#7c85c4' }}>
              Panneau de contrôle
            </p>
          </div>
        </div>

        <div className="mx-5 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                style={{ color: isActive ? '#e0e7ff' : '#64748b' }}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive ? '' : 'hover:bg-white/[0.05]'
                }`}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#c7d2fe' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#64748b' }}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg, #7c5fff, #5271ff)' }}
                  />
                )}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(124,95,255,0.12), rgba(82,113,255,0.08))' }}
                  />
                )}
                <Icon
                  className="h-4 w-4 shrink-0 relative z-10"
                  style={{ color: isActive ? '#7c5fff' : undefined }}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                <span className="relative z-10">{label}</span>
              </Link>
            )
          })}

          {/* Séparateur */}
          <div className="py-2">
            <div className="h-px mx-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Retour dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '' }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Retour dashboard
          </Link>
        </nav>

        <div className="mx-5 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* User */}
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 rounded-full blur-[6px]"
                style={{ background: 'linear-gradient(135deg, rgba(124,95,255,0.8), rgba(82,113,255,0.6))' }}
              />
              <div
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7c5fff, #5271ff)' }}
              >
                {initial}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-none" style={{ color: '#c7d2fe' }}>
                {utilisateur?.nom ?? 'Admin'}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: '#475569' }}>
                {utilisateur?.email ?? ''}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-200"
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.background = 'rgba(244,63,94,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '' }}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main
        className="flex-1 overflow-y-auto p-6"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(124,95,255,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(82,113,255,0.04) 0%, transparent 60%), #06091b',
        }}
      >
        {children}
      </main>
    </div>
  )
}
