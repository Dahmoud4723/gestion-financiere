"use client"
import { useEffect, useState } from 'react'
import { Loader2, ScrollText, RefreshCw } from 'lucide-react'
import { adminApi, type AdminLog } from '@/lib/adminApi'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TYPE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  CREATE: { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  DELETE: { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  UPDATE: { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  LOGIN:  { bg: 'rgba(82,113,255,0.1)',  color: '#818cf8', border: 'rgba(82,113,255,0.25)' },
}

function actionColor(log: AdminLog): { bg: string; color: string; border: string } {
  // Priorité au champ type structuré
  if (log.type && TYPE_STYLES[log.type]) return TYPE_STYLES[log.type]

  // Fallback : inférer depuis le texte de l'action
  const a = log.action.toLowerCase()
  if (a.includes('supprim') || a.includes('delet')) return TYPE_STYLES.DELETE
  if (a.includes('bloqu')   || a.includes('modif') || a.includes('updat')) return TYPE_STYLES.UPDATE
  if (a.includes('créé')    || a.includes('inscri') || a.includes('creat')) return TYPE_STYLES.CREATE
  if (a.includes('connect') || a.includes('login'))  return TYPE_STYLES.LOGIN
  return { bg: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'rgba(255,255,255,0.1)' }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await adminApi.logs.lister()
      setLogs(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Journal d'activité</h1>
          <p className="text-sm text-slate-500 mt-1">
            {logs.length} entrée{logs.length > 1 ? 's' : ''} dans le journal
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(82,113,255,0.1)',
            border: '1px solid rgba(82,113,255,0.25)',
            color: '#818cf8',
          }}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div
        className="rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#5271ff' }} />
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <ScrollText className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">Aucune activité enregistrée</p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {logs.map((log, i) => {
              const colors = actionColor(log)
              return (
                <li
                  key={log.id}
                  className="flex items-start gap-4 px-5 py-4 transition-colors"
                  style={{ animationDelay: `${i * 20}ms` }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {/* Timeline dot */}
                  <div className="mt-1 shrink-0">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: colors.color }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-200">
                        {log.utilisateurEmail}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: colors.bg,
                          color: colors.color,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {log.action}
                      </span>
                    </div>
                    {log.details && (
                      <p className="mt-1 text-xs text-slate-500 truncate">{log.details}</p>
                    )}
                  </div>

                  <time className="shrink-0 text-xs tabular-nums" style={{ color: '#475569' }}>
                    {formatDateTime(log.creeLe)}
                  </time>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
