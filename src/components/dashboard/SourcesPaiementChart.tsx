"use client"
import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Wallet, Loader2 } from 'lucide-react'
import { formatMontant } from '@/lib/utils'

interface SourceStat {
  source: string
  total: number
  count: number
  pourcentage: number
}

const SOURCE_COLORS: Record<string, string> = {
  BANKILY:  '#f59e0b',
  MASRVI:   '#3b82f6',
  VIREMENT: '#10b981',
  CASH:     '#8b5cf6',
  SEDAD:    '#ef4444',
}

const SOURCE_LABELS: Record<string, string> = {
  BANKILY:  'Bankily',
  MASRVI:   'Masrvi',
  VIREMENT: 'Virement',
  CASH:     'Espèces',
  SEDAD:    'Sedad',
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: SourceStat }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const color = SOURCE_COLORS[d.source] ?? '#64748b'
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-xs"
      style={{
        background: 'rgba(15,23,42,0.96)',
        border: `1px solid ${color}55`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <p className="font-bold mb-2" style={{ color }}>
        {SOURCE_LABELS[d.source] ?? d.source}
      </p>
      <p className="font-semibold mb-0.5" style={{ color: '#cbd5e1' }}>
        {formatMontant(d.total)}
      </p>
      <p style={{ color: '#64748b' }}>
        {d.count} transaction{d.count > 1 ? 's' : ''}
      </p>
      <p className="mt-1 font-medium" style={{ color: '#94a3b8' }}>
        {d.pourcentage.toFixed(1)}% du volume
      </p>
    </div>
  )
}

export function SourcesPaiementChart() {
  const [data, setData] = useState<SourceStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    fetch('http://localhost:3001/api/transactions/stats/sources', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(r => r.json())
      .then(json => {
        const arr = json?.data ?? json
        if (Array.isArray(arr)) setData(arr)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="card p-6 animate-fade-in-up"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '0.75rem',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>
          Répartition par source de paiement
        </h2>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'rgba(245,158,11,0.13)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <Wallet className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5271ff' }} />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm" style={{ color: '#64748b' }}>Aucune transaction disponible</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">

          {/* Donut */}
          <div className="relative w-full lg:w-auto lg:flex-shrink-0" style={{ height: 280, minWidth: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="total"
                  strokeWidth={0}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={SOURCE_COLORS[entry.source] ?? '#64748b'}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Label central */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: '#64748b' }}
                >
                  Sources
                </span>
                <span className="text-lg font-bold tabular-nums" style={{ color: '#e2e8f0' }}>
                  {data.length}
                </span>
              </div>
            </div>
          </div>

          {/* Détail par source */}
          <div className="flex-1 w-full space-y-3">
            {data
              .slice()
              .sort((a, b) => b.total - a.total)
              .map(entry => {
                const color = SOURCE_COLORS[entry.source] ?? '#64748b'
                const label = SOURCE_LABELS[entry.source] ?? entry.source
                return (
                  <div key={entry.source} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-sm font-medium" style={{ color: '#cbd5e1' }}>
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs tabular-nums" style={{ color: '#64748b' }}>
                          {entry.count} tx
                        </span>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: '#e2e8f0' }}>
                          {formatMontant(entry.total)}
                        </span>
                        <span
                          className="text-xs font-bold tabular-nums w-10 text-right"
                          style={{ color }}
                        >
                          {entry.pourcentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {/* Barre de progression */}
                    <div
                      className="h-1 w-full rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${entry.pourcentage}%`,
                          background: `linear-gradient(90deg, ${color}cc, ${color})`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>

        </div>
      )}
    </div>
  )
}
