"use client"
import { useEffect, useState, useCallback, startTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Toaster } from '@/components/ui/toaster'
import { alertes as alertesApi } from '@/lib/api'
import { useTranslation } from '@/contexts/LanguageContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertesNonLues, setAlertesNonLues] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
    } else {
      startTransition(() => setAuthChecked(true))
    }
  }, [router])

  useEffect(() => {
    const handleAuthExpired = () => router.replace('/login')
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [router])

  const loadAlertes = useCallback(async () => {
    try {
      const data = await alertesApi.lister()
      if (Array.isArray(data)) {
        startTransition(() => setAlertesNonLues(data.filter((a) => !a.lue).length))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (authChecked) { void loadAlertes() }
  }, [authChecked, pathname, loadAlertes])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#06091b' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: 'rgba(82,113,255,0.2)', borderTopColor: '#5271ff' }} />
      </div>
    )
  }

  const pageTitles: Record<string, string> = {
    '/dashboard': t('page.dashboard'),
    '/comptes': t('page.accounts'),
    '/transactions': t('page.transactions'),
    '/categories': t('page.categories'),
    '/budgets': t('page.budgets'),
    '/alertes': t('page.alerts'),
  }

  const title = pageTitles[pathname] ?? t('app.name')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#06091b' }}>
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
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(82,113,255,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(124,95,255,0.04) 0%, transparent 60%), #06091b' }}>
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  )
}
