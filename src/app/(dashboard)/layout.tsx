"use client"
import { useEffect, useState, useCallback, startTransition, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/components/ui/use-toast'
import { alertes as alertesApi } from '@/lib/api'
import { useTranslation } from '@/contexts/LanguageContext'

interface SsePayload {
  count?: number
  type?: string
  alerteType?: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertesNonLues, setAlertesNonLues] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)
  const prevCountRef = useRef<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
      return
    }
    try {
      const parts = token.split('.')
      if (parts.length !== 3) throw new Error('format invalide')
      JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('utilisateur')
      router.replace('/login')
      return
    }
    startTransition(() => setAuthChecked(true))
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

  // SSE : notifications temps réel des alertes budget
  useEffect(() => {
    if (!authChecked) return

    const token = localStorage.getItem('token')
    if (!token) return

    const es = new EventSource(
      `https://gestion-financiere-api-production.up.railway.app/api/alertes/stream?token=${encodeURIComponent(token)}`
    )

    const handleMessage = (event: MessageEvent) => {
      let payload: SsePayload
      try {
        payload = JSON.parse(event.data as string) as SsePayload
      } catch {
        return
      }

      const count = payload.count ?? null
      const alerteType = payload.type ?? payload.alerteType ?? null

      if (count !== null) {
        startTransition(() => setAlertesNonLues(count))

        // Ignorer le premier message (initialisation), toaster uniquement si le count monte
        if (prevCountRef.current !== null && count > prevCountRef.current) {
          if (alerteType === 'BUDGET_DEPASSE') {
            toast({ title: '⛔ Budget dépassé !', type: 'error' })
          } else {
            // BUDGET_80 ou toute autre hausse non typée
            toast({ title: '⚠️ Budget à 80% atteint !', type: 'warning' })
          }
        }

        prevCountRef.current = count
      }
    }

    es.onmessage = handleMessage

    // Certains backends envoient des événements typés (event: BUDGET_80 / BUDGET_DEPASSE)
    // On écoute les deux pour être compatible avec les deux formats SSE
    es.addEventListener('BUDGET_80', (e) => {
      let payload: SsePayload = {}
      try { payload = JSON.parse((e as MessageEvent).data as string) as SsePayload } catch { /**/ }
      const count = payload.count ?? null
      if (count !== null) {
        startTransition(() => setAlertesNonLues(count))
        if (prevCountRef.current !== null && count > prevCountRef.current) {
          toast({ title: '⚠️ Budget à 80% atteint !', type: 'warning' })
        }
        prevCountRef.current = count
      }
    })

    es.addEventListener('BUDGET_DEPASSE', (e) => {
      let payload: SsePayload = {}
      try { payload = JSON.parse((e as MessageEvent).data as string) as SsePayload } catch { /**/ }
      const count = payload.count ?? null
      if (count !== null) {
        startTransition(() => setAlertesNonLues(count))
        if (prevCountRef.current !== null && count > prevCountRef.current) {
          toast({ title: '⛔ Budget dépassé !', type: 'error' })
        }
        prevCountRef.current = count
      }
    })

    es.onerror = () => { es.close() }

    return () => { es.close() }
  }, [authChecked])

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
    '/rapports': t('page.reports'),
    '/profil': t('page.profile'),
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
