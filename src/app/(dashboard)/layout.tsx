"use client"
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Toaster } from '@/components/ui/toaster'
import { alertes as alertesApi } from '@/lib/api'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/comptes': 'Comptes',
  '/transactions': 'Transactions',
  '/categories': 'Catégories',
  '/budgets': 'Budgets',
  '/alertes': 'Alertes',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertesNonLues, setAlertesNonLues] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  const loadAlertes = useCallback(async () => {
    try {
      const data = await alertesApi.lister()
      if (Array.isArray(data)) {
        setAlertesNonLues(data.filter((a) => !a.lue).length)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (authChecked) loadAlertes()
  }, [authChecked, pathname, loadAlertes])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F172A]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
      </div>
    )
  }

  const title = pageTitles[pathname] ?? 'Gestion Financière'

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar – desktop always visible, mobile as overlay */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:flex lg:z-auto transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar
          alertesNonLues={alertesNonLues}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          alertesNonLues={alertesNonLues}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  )
}
