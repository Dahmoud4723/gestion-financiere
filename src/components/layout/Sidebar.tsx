"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Tag,
  PieChart,
  Bell,
  Landmark,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
  alertesNonLues?: number
  onClose?: () => void
}

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/comptes', label: 'Comptes', icon: CreditCard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/categories', label: 'Catégories', icon: Tag },
  { href: '/budgets', label: 'Budgets', icon: PieChart },
  { href: '/alertes', label: 'Alertes', icon: Bell },
]

export function Sidebar({ alertesNonLues = 0, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { utilisateur, logout } = useAuth()

  return (
    <aside className="flex flex-col h-full bg-[#1E293B] border-r border-slate-700 w-64">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-700">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">Gestion</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">Financière</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {href === '/alertes' && alertesNonLues > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {alertesNonLues > 9 ? '9+' : alertesNonLues}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-blue-200 shrink-0">
            {utilisateur?.nom?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-100 truncate">{utilisateur?.nom ?? 'Utilisateur'}</p>
            <p className="text-xs text-slate-400 truncate">{utilisateur?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
