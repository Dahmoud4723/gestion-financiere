import React from 'react'
import type { LucideIcon } from 'lucide-react'

type ColorVariant = 'blue' | 'green' | 'red' | 'amber'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: ColorVariant
  trend?: string
  trendUp?: boolean
}

const colorStyles: Record<ColorVariant, {
  stat: string
  iconBg: React.CSSProperties
  iconColor: string
  topBar: string
  orb: string
  valueColor: string
}> = {
  blue: {
    stat: 'stat-blue',
    iconBg: { background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.5)' },
    iconColor: '#93c5fd',
    topBar: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)',
    orb: 'radial-gradient(circle, rgba(37,99,235,0.5) 0%, transparent 70%)',
    valueColor: '#bfdbfe',
  },
  green: {
    stat: 'stat-green',
    iconBg: { background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.45)' },
    iconColor: '#6ee7b7',
    topBar: 'linear-gradient(90deg, #047857, #10b981, #34d399)',
    orb: 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 70%)',
    valueColor: '#a7f3d0',
  },
  red: {
    stat: 'stat-red',
    iconBg: { background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.45)' },
    iconColor: '#fca5a5',
    topBar: 'linear-gradient(90deg, #b91c1c, #ef4444, #f87171)',
    orb: 'radial-gradient(circle, rgba(239,68,68,0.45) 0%, transparent 70%)',
    valueColor: '#fecaca',
  },
  amber: {
    stat: 'stat-amber',
    iconBg: { background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.5)' },
    iconColor: '#fcd34d',
    topBar: 'linear-gradient(90deg, #92400e, #c9a227, #f5d980)',
    orb: 'radial-gradient(circle, rgba(201,162,39,0.5) 0%, transparent 70%)',
    valueColor: '#fde68a',
  },
}

export function StatCard({ title, value, icon: Icon, color, trend, trendUp }: StatCardProps) {
  const c = colorStyles[color]

  return (
    <div className={`card shimmer-on-hover animate-fade-in-up ${c.stat} p-5`}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: c.topBar }} />

      {/* Corner orb */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: c.orb, filter: 'blur(24px)' }} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: '#94a3b8' }}>{title}</p>
          <p className="text-3xl font-extrabold tracking-tight leading-none"
            style={{ color: c.valueColor }}>{value}</p>
          {trend && (
            <p className={`text-xs mt-3 font-semibold flex items-center gap-1 ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className="text-base leading-none">{trendUp ? '↑' : '↓'}</span>
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl"
          style={c.iconBg}>
          <Icon className="h-7 w-7" style={{ color: c.iconColor }} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}