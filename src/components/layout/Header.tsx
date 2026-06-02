"use client"
import Link from 'next/link'
import { Bell, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  title: string
  alertesNonLues?: number
  onMenuClick?: () => void
}

export function Header({ title, alertesNonLues = 0, onMenuClick }: HeaderProps) {
  const { utilisateur } = useAuth()

  return (
    <header className="flex items-center gap-4 border-b border-slate-700 bg-[#1E293B] px-6 py-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-slate-100 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      <h1 className="flex-1 text-xl font-semibold text-slate-100">{title}</h1>

      <div className="flex items-center gap-3">
        <Link
          href="/alertes"
          className="relative flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {alertesNonLues > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {alertesNonLues > 9 ? '9+' : alertesNonLues}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-blue-200">
            {utilisateur?.nom?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <span className="hidden md:block text-sm font-medium text-slate-100">
            {utilisateur?.nom ?? 'Utilisateur'}
          </span>
        </div>
      </div>
    </header>
  )
}
