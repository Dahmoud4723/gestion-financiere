"use client"
import { useEffect, useState } from 'react'
import { Users, Building2, ArrowLeftRight, TrendingUp, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { adminApi, type AdminStats } from '@/lib/adminApi'

function StatCard({
  title, value, icon: Icon, iconColor, iconBg, subtitle,
}: {
  title: string
  value: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  subtitle?: string
}) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: iconBg, border: `1px solid ${iconColor}30` }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} strokeWidth={2} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-100 tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  )
}

function formatMRU(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M MRU`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k MRU`
  return `${value.toFixed(0)} MRU`
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm"
      style={{
        background: 'rgba(6,9,27,0.95)',
        border: '1px solid rgba(124,95,255,0.3)',
        color: '#e0e7ff',
      }}
    >
      <p className="font-semibold mb-1">{label}</p>
      <p style={{ color: '#7c5fff' }}>{payload[0].value} inscription{payload[0].value > 1 ? 's' : ''}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5271ff' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-red-400">Erreur : {error}</p>
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      title: 'Utilisateurs',
      value: String(stats.nbUtilisateurs),
      icon: Users,
      iconColor: '#5271ff',
      iconBg: 'rgba(82,113,255,0.12)',
    },
    {
      title: 'Organisations',
      value: String(stats.nbOrganisations),
      icon: Building2,
      iconColor: '#7c5fff',
      iconBg: 'rgba(124,95,255,0.12)',
    },
    {
      title: 'Transactions',
      value: String(stats.nbTransactions),
      icon: ArrowLeftRight,
      iconColor: '#34d399',
      iconBg: 'rgba(52,211,153,0.12)',
    },
    {
      title: 'Volume total',
      value: formatMRU(stats.volumeTotal),
      icon: TrendingUp,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.12)',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Vue globale de la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Graphique inscriptions */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Inscriptions par mois
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Nouveaux utilisateurs sur la période</p>
          </div>
        </div>
        {stats.inscriptionsParMois.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">Aucune donnée disponible</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.inscriptionsParMois} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5fff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c5fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="mois"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="nb"
                stroke="#7c5fff"
                strokeWidth={2}
                fill="url(#colorInscriptions)"
                dot={{ fill: '#7c5fff', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#7c5fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
