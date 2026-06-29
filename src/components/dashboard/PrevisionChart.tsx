"use client"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import { formatMontant } from '@/lib/utils'

export interface PrevisionData {
  moyenneEntreeMensuelle: number
  moyenneDepenseMensuelle: number
  previsions: {
    mois: string
    entreePrevue: number
    depensePrevue: number
    soldePrevue: number
  }[]
}

interface Props {
  data: PrevisionData | null
  loading: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-xs"
      style={{
        background: 'rgba(6,9,27,0.96)',
        border: '1px solid rgba(82,113,255,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <p className="font-bold mb-2" style={{ color: '#e2e8f0' }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span style={{ color: '#64748b' }}>{entry.name} :</span>
          <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
            {formatMontant(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function SummaryCard({
  label, value, icon: Icon, color, bg,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bg: string
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4"
      style={{ background: bg, border: `1px solid ${color}28` }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: '#64748b' }}>{label}</p>
        <p className="text-lg font-bold tabular-nums mt-0.5" style={{ color }}>
          {formatMontant(value)}
        </p>
      </div>
    </div>
  )
}

function yTickFormatter(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}

export function PrevisionChart({ data, loading }: Props) {
  return (
    <div
      className="rounded-xl p-6 animate-fade-in-up"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>
          Prévision de trésorerie — 3 mois
        </h2>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{
            background: 'rgba(82,113,255,0.15)',
            border: '1px solid rgba(82,113,255,0.35)',
            color: '#818cf8',
          }}
        >
          Prévision
        </span>
      </div>

      {loading ? (
        <div className="flex h-[320px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5271ff' }} />
        </div>
      ) : !data || data.previsions.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center">
          <p className="text-sm" style={{ color: '#64748b' }}>Aucune donnée de prévision disponible</p>
        </div>
      ) : (
        <>
          {/* Cartes résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <SummaryCard
              label="Entrée mensuelle moyenne"
              value={data.moyenneEntreeMensuelle}
              icon={ArrowDownLeft}
              color="#10b981"
              bg="rgba(16,185,129,0.05)"
            />
            <SummaryCard
              label="Dépense mensuelle moyenne"
              value={data.moyenneDepenseMensuelle}
              icon={ArrowUpRight}
              color="#ef4444"
              bg="rgba(239,68,68,0.05)"
            />
          </div>

          {/* Graphique */}
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.previsions}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              barCategoryGap="28%"
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="mois"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={yTickFormatter}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                formatter={(value) => (
                  <span style={{ color: '#94a3b8' }}>{value}</span>
                )}
              />
              <Bar dataKey="entreePrevue"  name="Entrées"     fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="depensePrevue" name="Dépenses"    fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="soldePrevue"   name="Solde prévu" fill="#5271ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
