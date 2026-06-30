"use client"
import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as ReTip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, Activity,
  FileDown, Loader2, FileText, RefreshCw,
  TrendingDown, Minus,
} from 'lucide-react'
import { formatMontant } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RapportResume {
  totalEntrees: number
  totalDepenses: number
  soldeNet: number
  nbTransactions: number
}

interface DepenseCategorie {
  categorie: string
  montant: number
  pourcentage: number
}

interface DepenseSource {
  source: string
  montant: number
}

interface TopDepense {
  description: string
  categorie: string
  montant: number
  date: string
}

interface RapportTransaction {
  date: string
  description: string
  categorie: string
  source: string
  montant: number
  type: 'ENTREE' | 'DEPENSE' | 'SORTIE'
}

interface RapportMensuel {
  mois: string
  periode: { debut: string; fin: string }
  resume: RapportResume
  depensesParCategorie: DepenseCategorie[]
  depensesParSource: DepenseSource[]
  topDepenses: TopDepense[]
  transactions: RapportTransaction[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
}

const PIE_COLORS = [
  '#5271ff', '#7c5fff', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6',
]

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

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date).substring(0, 10)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMoisLabel(mois: string): string {
  const [y, m] = mois.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function prevMois(mois: string): string {
  const [y, m] = mois.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function yFmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}

function pctDelta(current: number, prev: number): number | null {
  if (!prev) return null
  return ((current - prev) / Math.abs(prev)) * 100
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: '#94a3b8' }}>
      {title}
    </h2>
  )
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null
  const pos = delta >= 0
  const Icon = delta === 0 ? Minus : pos ? TrendingUp : TrendingDown
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: pos ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${pos ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        color: pos ? '#34d399' : '#f87171',
      }}
    >
      <Icon className="h-3 w-3" />
      {delta === 0 ? '0%' : `${pos ? '+' : ''}${delta.toFixed(1)}%`}
    </span>
  )
}

function ResumeCard({
  label, value, icon: Icon, color, bg, delta, negative,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: string
  bg: string
  delta?: number | null
  negative?: boolean
}) {
  const effectiveColor = negative ? '#ef4444' : color
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={CARD}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>{label}</p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: bg, border: `1px solid ${effectiveColor}30` }}
        >
          <Icon className="h-4 w-4" style={{ color: effectiveColor }} />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color: effectiveColor }}>{value}</p>
      {delta !== undefined && (
        <div className="flex items-center gap-2">
          <DeltaBadge delta={delta ?? null} />
          <span className="text-xs" style={{ color: '#475569' }}>vs mois préc.</span>
        </div>
      )}
    </div>
  )
}

function PieTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: DepenseCategorie }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-xs"
      style={{
        background: 'rgba(6,9,27,0.96)',
        border: '1px solid rgba(82,113,255,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p className="font-bold mb-1" style={{ color: '#e2e8f0' }}>{d.name}</p>
      <p className="tabular-nums" style={{ color: '#94a3b8' }}>{formatMontant(d.value)}</p>
      <p className="font-semibold mt-0.5" style={{ color: '#818cf8' }}>{d.payload.pourcentage.toFixed(1)} %</p>
    </div>
  )
}

function BarTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
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
      }}
    >
      <p className="font-bold mb-1" style={{ color: '#e2e8f0' }}>{label}</p>
      <p className="tabular-nums font-semibold" style={{ color: '#818cf8' }}>{formatMontant(payload[0].value)}</p>
    </div>
  )
}

function CompareBar({
  label, current, prev,
}: { label: string; current: number; prev: number }) {
  const max = Math.max(current, prev, 1)
  const delta = pctDelta(current, prev)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{label}</span>
        <DeltaBadge delta={delta} />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(current / max) * 100}%`,
              background: 'linear-gradient(90deg, #5271ff, #7c5fff)',
            }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums w-24 text-right" style={{ color: '#e2e8f0' }}>
          {formatMontant(current)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(prev / max) * 100}%`,
              background: 'rgba(100,116,139,0.4)',
            }}
          />
        </div>
        <span className="text-xs tabular-nums w-24 text-right" style={{ color: '#64748b' }}>
          {formatMontant(prev)}
        </span>
      </div>
      <div className="flex gap-4 pt-0.5">
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#64748b' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: '#5271ff' }} /> Mois actuel
        </span>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#64748b' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: 'rgba(100,116,139,0.6)' }} /> Mois préc.
        </span>
      </div>
    </div>
  )
}

function DonutSection({ data }: { data: DepenseCategorie[] }) {
  if (!data.length) {
    return (
      <div style={CARD} className="p-6">
        <SectionTitle title="Dépenses par catégorie" />
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm" style={{ color: '#475569' }}>Aucune dépense ce mois</p>
        </div>
      </div>
    )
  }
  return (
    <div style={CARD} className="p-6">
      <SectionTitle title="Dépenses par catégorie" />
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="montant"
            nameKey="categorie"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={95}
            paddingAngle={2}
            strokeWidth={0}
            animationBegin={0}
            animationDuration={700}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <ReTip content={<PieTooltip />} />
          <Legend
            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
            wrapperStyle={{ paddingTop: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function BarSourceSection({ data }: { data: DepenseSource[] }) {
  const chartData = data.map(d => ({
    name: SOURCE_LABELS[d.source] ?? d.source,
    montant: d.montant,
    color: SOURCE_COLORS[d.source] ?? '#64748b',
  }))

  if (!data.length) {
    return (
      <div style={CARD} className="p-6">
        <SectionTitle title="Dépenses par source de paiement" />
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm" style={{ color: '#475569' }}>Aucune donnée</p>
        </div>
      </div>
    )
  }

  return (
    <div style={CARD} className="p-6">
      <SectionTitle title="Dépenses par source de paiement" />
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 48)}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
          barSize={18}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            type="number"
            tickFormatter={yFmt}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={68}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <ReTip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function TopDepensesSection({ data }: { data: TopDepense[] }) {
  return (
    <div style={CARD} className="p-6">
      <SectionTitle title="Top 5 dépenses du mois" />
      {data.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: '#475569' }}>Aucune dépense</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Description', 'Catégorie', 'Montant', 'Date'].map(h => (
                  <th
                    key={h}
                    className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#475569' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: i < data.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td className="py-3 pr-4 font-medium" style={{ color: '#e2e8f0' }}>{d.description || '—'}</td>
                  <td className="py-3 pr-4">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: 'rgba(82,113,255,0.12)', color: '#818cf8', border: '1px solid rgba(82,113,255,0.25)' }}
                    >
                      {d.categorie ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-bold tabular-nums" style={{ color: '#f87171' }}>
                    {formatMontant(d.montant)}
                  </td>
                  <td className="py-3 text-xs" style={{ color: '#64748b' }}>{formatDate(d.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TransactionsSection({ data }: { data: RapportTransaction[] }) {
  const [page, setPage] = useState(1)
  const PAGE = 15
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE))
  const slice = data.slice((page - 1) * PAGE, page * PAGE)

  return (
    <div style={CARD} className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
          Toutes les transactions ({data.length})
        </h2>
        {totalPages > 1 && (
          <p className="text-xs" style={{ color: '#64748b' }}>Page {page}/{totalPages}</p>
        )}
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: '#475569' }}>Aucune transaction</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date', 'Description', 'Catégorie', 'Source', 'Montant'].map(h => (
                    <th
                      key={h}
                      className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#475569' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((tx, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: i < slice.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td className="py-2.5 pr-4 text-xs tabular-nums" style={{ color: '#64748b' }}>
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-2.5 pr-4 max-w-[180px] truncate font-medium" style={{ color: '#cbd5e1' }}>
                      {tx.description || '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: '#64748b' }}>
                      {tx.categorie ?? '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: '#64748b' }}>
                      {SOURCE_LABELS[tx.source] ?? tx.source ?? '—'}
                    </td>
                    <td className="py-2.5 font-bold tabular-nums"
                      style={{ color: tx.type === 'ENTREE' ? '#34d399' : '#f87171' }}
                    >
                      {tx.type === 'ENTREE' ? '+' : '−'}{formatMontant(tx.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
              >
                ← Préc.
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="h-7 w-7 rounded-lg text-xs font-semibold transition-colors"
                  style={page === p
                    ? { background: 'rgba(82,113,255,0.25)', border: '1px solid rgba(82,113,255,0.5)', color: '#a5b4fc' }
                    : { border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }
                  }
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
              >
                Suiv. →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function fetchRapport(mois: string): Promise<RapportMensuel> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(
    `https://gestion-financiere-api-production.up.railway.app/api/rapports/mensuel?mois=${mois}`,
    { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Erreur ${res.status}` }))
    throw new Error(err.message ?? `Erreur ${res.status}`)
  }
  const json = await res.json() as { data?: RapportMensuel } & RapportMensuel
  return json.data ?? json
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RapportsPage() {
  const now = new Date()
  const defaultMois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [moisInput, setMoisInput] = useState(defaultMois)
  const [moisLabel, setMoisLabel] = useState('')
  const [rapport, setRapport] = useState<RapportMensuel | null>(null)
  const [rapportPrev, setRapportPrev] = useState<RapportMensuel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generer = async () => {
    setLoading(true)
    setError(null)
    try {
      const [current, previous] = await Promise.allSettled([
        fetchRapport(moisInput),
        fetchRapport(prevMois(moisInput)),
      ])
      setRapport(current.status === 'fulfilled' ? current.value : null)
      setRapportPrev(previous.status === 'fulfilled' ? previous.value : null)
      if (current.status === 'rejected') throw current.reason
      setMoisLabel(formatMoisLabel(moisInput))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const { resume } = rapport ?? {}
  const { resume: resumePrev } = rapportPrev ?? {}

  return (
    <>
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body, html { background: #fff !important; color: #1e293b !important; }
          .print-section { page-break-inside: avoid; }
        }
      `}</style>

      <div className="space-y-6 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 no-print">
          <div>
            <h1 className="text-xl font-bold text-white">
              Rapport mensuel{moisLabel ? ` — ${moisLabel}` : ''}
            </h1>
            {rapport?.periode && (
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                {new Date(rapport.periode.debut).toLocaleDateString('fr-FR')}
                {' → '}
                {new Date(rapport.periode.fin).toLocaleDateString('fr-FR')}
                {rapportPrev && (
                  <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.25)', color: '#64748b' }}>
                    Comparé à {formatMoisLabel(prevMois(moisInput))}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="month"
              value={moisInput}
              onChange={e => setMoisInput(e.target.value)}
              max={defaultMois}
              className="rounded-xl px-3 py-2 text-sm outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e0e7ff',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(82,113,255,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />

            <button
              onClick={generer}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #5271ff, #7c5fff)', color: '#fff' }}
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />
              }
              {loading ? 'Génération…' : 'Générer'}
            </button>

            {rapport && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #b89540, #d4af6a)', color: '#0a0f1e' }}
              >
                <FileDown className="h-4 w-4" />
                Exporter PDF
              </button>
            )}
          </div>
        </div>

        {/* ── État vide ── */}
        {!rapport && !loading && !error && (
          <div className="flex h-72 flex-col items-center justify-center gap-4 rounded-xl" style={CARD}>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(82,113,255,0.1)', border: '1px solid rgba(82,113,255,0.25)' }}
            >
              <FileText className="h-7 w-7" style={{ color: '#5271ff' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>Aucun rapport généré</p>
              <p className="text-xs mt-1" style={{ color: '#475569' }}>
                Sélectionnez un mois et cliquez sur « Générer »
              </p>
            </div>
          </div>
        )}

        {/* ── Chargement ── */}
        {loading && (
          <div className="flex h-72 items-center justify-center rounded-xl" style={CARD}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#5271ff' }} />
          </div>
        )}

        {/* ── Erreur ── */}
        {error && !loading && (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            <span className="font-bold shrink-0">✕</span>
            {error}
          </div>
        )}

        {/* ── Contenu ── */}
        {rapport && !loading && (
          <div className="space-y-6">

            {/* 1. KPIs avec comparaison */}
            <div className="print-section grid grid-cols-2 xl:grid-cols-4 gap-4">
              <ResumeCard
                label="Total Entrées"
                value={formatMontant(resume!.totalEntrees)}
                icon={ArrowDownLeft}
                color="#10b981"
                bg="rgba(16,185,129,0.12)"
                delta={resumePrev ? pctDelta(resume!.totalEntrees, resumePrev.totalEntrees) : undefined}
              />
              <ResumeCard
                label="Total Dépenses"
                value={formatMontant(resume!.totalDepenses)}
                icon={ArrowUpRight}
                color="#ef4444"
                bg="rgba(239,68,68,0.12)"
                delta={resumePrev ? pctDelta(resume!.totalDepenses, resumePrev.totalDepenses) : undefined}
              />
              <ResumeCard
                label="Solde Net"
                value={formatMontant(resume!.soldeNet)}
                icon={TrendingUp}
                color={resume!.soldeNet >= 0 ? '#5271ff' : '#ef4444'}
                bg={resume!.soldeNet >= 0 ? 'rgba(82,113,255,0.12)' : 'rgba(239,68,68,0.12)'}
                negative={resume!.soldeNet < 0}
                delta={resumePrev ? pctDelta(resume!.soldeNet, resumePrev.soldeNet) : undefined}
              />
              <ResumeCard
                label="Transactions"
                value={String(resume!.nbTransactions)}
                icon={Activity}
                color="#94a3b8"
                bg="rgba(148,163,184,0.1)"
                delta={resumePrev ? pctDelta(resume!.nbTransactions, resumePrev.nbTransactions) : undefined}
              />
            </div>

            {/* 2. Comparaison barres mois précédent */}
            {rapportPrev && (
              <div className="print-section rounded-xl p-6" style={CARD}>
                <SectionTitle title={`Comparaison — ${formatMoisLabel(moisInput)} vs ${formatMoisLabel(prevMois(moisInput))}`} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <CompareBar
                    label="Entrées"
                    current={resume!.totalEntrees}
                    prev={resumePrev!.totalEntrees}
                  />
                  <CompareBar
                    label="Dépenses"
                    current={resume!.totalDepenses}
                    prev={resumePrev!.totalDepenses}
                  />
                  <CompareBar
                    label="Transactions"
                    current={resume!.nbTransactions}
                    prev={resumePrev!.nbTransactions}
                  />
                </div>
              </div>
            )}

            {/* 3. Graphiques */}
            <div className="print-section grid grid-cols-1 lg:grid-cols-2 gap-5">
              <DonutSection data={rapport.depensesParCategorie} />
              <BarSourceSection data={rapport.depensesParSource} />
            </div>

            {/* 4. Top 5 dépenses */}
            <div className="print-section">
              <TopDepensesSection data={rapport.topDepenses} />
            </div>

            {/* 5. Toutes les transactions */}
            <div className="print-section">
              <TransactionsSection data={rapport.transactions} />
            </div>

          </div>
        )}
      </div>
    </>
  )
}
