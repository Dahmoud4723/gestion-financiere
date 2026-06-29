"use client"
import { useMemo } from 'react'
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { formatMontant } from '@/lib/utils'
import type { Transaction, Compte } from '@/types'

interface ChartsSectionProps {
    transactions: Transaction[]
    comptes: Compte[]
}

// Palette cohérente avec le thème bleu marine / or
const GOLD = '#c9a227'
const GOLD_LIGHT = '#e0bc50'
const NAVY = '#2563eb'
const NAVY_LIGHT = '#60a5fa'
const GREEN = '#10b981'
const RED = '#ef4444'

const CATEGORY_COLORS = [GOLD, NAVY, GREEN, '#a78bfa', RED, NAVY_LIGHT, GOLD_LIGHT, '#f97316']

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl px-3.5 py-2.5 text-xs"
            style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(201,162,39,0.35)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
            }}>
            {label && <p className="font-semibold mb-1.5" style={{ color: '#cbd5e1' }}>{label}</p>}
            {payload.map((entry: any, i: number) => (
                <p key={i} className="flex items-center gap-2 font-medium" style={{ color: entry.color }}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
                    {entry.name}: {formatMontant(entry.value)}
                </p>
            ))}
        </div>
    )
}

export function ChartsSection({ transactions, comptes }: ChartsSectionProps) {

    // ─── 1. Évolution du solde sur 6 mois ──────────────────────────────────────
    const evolutionData = useMemo(() => {
        const months: { key: string; label: string }[] = []
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            months.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('fr-FR', { month: 'short' }),
            })
        }

        // Start from account initial balances (avoids negative start from reverse-calculation issues)
        const soldeInitial = comptes.reduce((s, c) => s + (c.soldeInitial ?? 0), 0)

        // Add net effect of all transactions before the chart window
        const firstKey = months[0].key
        const preChartNet = transactions
            .filter(tx => tx.dateTransaction < firstKey)
            .reduce((s, tx) => s + (tx.type === 'ENTREE' ? tx.montant : -tx.montant), 0)

        let runningSolde = soldeInitial + preChartNet
        return months.map(({ key, label }) => {
            const txDuMois = transactions.filter(tx => tx.dateTransaction?.startsWith(key))
            const net = txDuMois.reduce((s, tx) => s + (tx.type === 'ENTREE' ? tx.montant : -tx.montant), 0)
            runningSolde += net
            return { mois: label, solde: Math.round(runningSolde) }
        })
    }, [transactions, comptes])

    // ─── 2. Répartition des dépenses par catégorie ─────────────────────────────
    const categorieData = useMemo(() => {
        const now = new Date()
        const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const depensesMois = transactions.filter(
            tx => tx.type === 'DEPENSE' && tx.dateTransaction?.startsWith(moisActuel)
        )
        const parCategorie = new Map<string, number>()
        depensesMois.forEach(tx => {
            const nom = tx.categorieNom ?? 'Sans catégorie'
            parCategorie.set(nom, (parCategorie.get(nom) ?? 0) + tx.montant)
        })
        return Array.from(parCategorie.entries())
            .map(([nom, valeur]) => ({ nom, valeur }))
            .sort((a, b) => b.valeur - a.valeur)
            .slice(0, 8)
    }, [transactions])

    // ─── 3. Revenus vs Dépenses par mois ────────────────────────────────────────
    const comparaisonData = useMemo(() => {
        const months: { key: string; label: string }[] = []
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            months.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('fr-FR', { month: 'short' }),
            })
        }
        return months.map(({ key, label }) => {
            const txDuMois = transactions.filter(tx => tx.dateTransaction?.startsWith(key))
            const revenus = txDuMois.filter(tx => tx.type === 'ENTREE').reduce((s, tx) => s + tx.montant, 0)
            const depenses = txDuMois.filter(tx => tx.type === 'DEPENSE').reduce((s, tx) => s + tx.montant, 0)
            return { mois: label, revenus: Math.round(revenus), depenses: Math.round(depenses) }
        })
    }, [transactions])

    const hasData = transactions.length > 0

    if (!hasData) return null

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Évolution du solde */}
            <div className="card p-6 animate-fade-in-up delay-100 lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>
                        Évolution du solde
                    </h2>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)' }}>
                        <TrendingUp className="h-3.5 w-3.5" style={{ color: GOLD_LIGHT }} />
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="soldeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                        <XAxis dataKey="mois" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="solde" name="Solde"
                            stroke={GOLD_LIGHT} strokeWidth={2.5} fill="url(#soldeGradient)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Répartition par catégorie */}
            <div className="card p-6 animate-fade-in-up delay-200">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>
                        Dépenses par catégorie
                    </h2>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}>
                        <PieChartIcon className="h-3.5 w-3.5" style={{ color: NAVY_LIGHT }} />
                    </div>
                </div>
                {categorieData.length === 0 ? (
                    <p className="text-sm text-center py-16" style={{ color: '#64748b' }}>
                        Aucune dépense ce mois-ci
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={categorieData} dataKey="valeur" nameKey="nom" cx="50%" cy="50%"
                                innerRadius={55} outerRadius={85} paddingAngle={2}>
                                {categorieData.map((_, i) => (
                                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                layout="vertical" verticalAlign="middle" align="right"
                                wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Revenus vs Dépenses */}
            <div className="card p-6 animate-fade-in-up delay-300">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>
                        Revenus vs Dépenses
                    </h2>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: 'rgba(16,185,129,0.13)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <BarChart3 className="h-3.5 w-3.5" style={{ color: GREEN }} />
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={comparaisonData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                        <XAxis dataKey="mois" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                        <Bar dataKey="revenus" name="Revenus" fill={GREEN} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="depenses" name="Dépenses" fill={RED} radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </div>
    )
}