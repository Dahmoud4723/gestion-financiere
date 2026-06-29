"use client"
import { useEffect, useState } from 'react'
import {
  User, Shield, Calendar, Hash, Building2,
  Eye, EyeOff, Check, Copy, Loader2, KeyRound,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { profil as profilApi, type ProfilData } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
  padding: '1.5rem',
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function SectionTitle({
  icon: Icon, title, color,
}: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <h2 className="text-base font-bold text-slate-100">{title}</h2>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
      {children}
    </label>
  )
}

function PasswordInput({
  value, onChange, placeholder, show, onToggle,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: '#475569' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#475569' }}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function SaveButton({
  loading, disabled, children, style,
}: {
  loading: boolean
  disabled?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
      style={style}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const [profilData, setProfilData] = useState<ProfilData | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  // Section 1 – infos
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  // Section 2 – mot de passe
  const [ancienMdp, setAncienMdp] = useState('')
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [confirmerMdp, setConfirmerMdp] = useState('')
  const [showAncien, setShowAncien] = useState(false)
  const [showNouveau, setShowNouveau] = useState(false)
  const [showConfirmer, setShowConfirmer] = useState(false)
  const [mdpError, setMdpError] = useState('')
  const [savingMdp, setSavingMdp] = useState(false)

  // Section 3 – copie ID
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    profilApi.obtenir()
      .then(data => {
        setProfilData(data)
        setNom(data.nom)
        setEmail(data.email)
      })
      .catch(e => {
        toast({ title: 'Impossible de charger le profil', description: (e as Error).message, type: 'error' })
      })
      .finally(() => setPageLoading(false))
  }, [])

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingInfo(true)
    try {
      const updated = await profilApi.modifier({ nom: nom.trim(), email: email.trim() })
      setProfilData(updated)
      toast({ title: 'Profil mis à jour', type: 'success' })
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, type: 'error' })
    } finally {
      setSavingInfo(false)
    }
  }

  const handleChangeMdp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMdpError('')
    if (nouveauMdp.length < 8) {
      setMdpError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (nouveauMdp !== confirmerMdp) {
      setMdpError('Les mots de passe ne correspondent pas.')
      return
    }
    setSavingMdp(true)
    try {
      await profilApi.changerMotDePasse({
        ancienMotDePasse: ancienMdp,
        nouveauMotDePasse: nouveauMdp,
      })
      setAncienMdp('')
      setNouveauMdp('')
      setConfirmerMdp('')
      toast({ title: 'Mot de passe modifié avec succès', type: 'success' })
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, type: 'error' })
    } finally {
      setSavingMdp(false)
    }
  }

  const handleCopyId = async () => {
    if (!profilData) return
    await navigator.clipboard.writeText(profilData.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (pageLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5271ff' }} />
      </div>
    )
  }

  if (!profilData) return null

  const initial = profilData.nom.charAt(0).toUpperCase()
  const isAdmin = profilData.role === 'ADMIN'

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-white">Mon profil</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* ── Section 1 : Informations personnelles ── */}
      <div style={CARD}>
        <SectionTitle icon={User} title="Informations personnelles" color="#5271ff" />

        {/* Avatar + identité */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="relative shrink-0">
            <div
              className="absolute inset-0 rounded-full blur-[14px]"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.4))' }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold text-white select-none"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {initial}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white truncate">{profilData.nom}</p>
            <p className="text-sm text-slate-500 truncate mt-0.5">{profilData.email}</p>
            <span
              className="inline-flex items-center gap-1.5 mt-2 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={
                isAdmin
                  ? { background: 'rgba(124,95,255,0.15)', border: '1px solid rgba(124,95,255,0.35)', color: '#a78bfa' }
                  : { background: 'rgba(82,113,255,0.15)', border: '1px solid rgba(82,113,255,0.35)', color: '#818cf8' }
              }
            >
              <Shield className="h-3 w-3" />
              {profilData.role}
            </span>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div>
            <FieldLabel>Nom complet</FieldLabel>
            <Input
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Votre nom"
              required
            />
          </div>
          <div>
            <FieldLabel>Adresse email</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              required
            />
          </div>
          <div className="pt-1">
            <SaveButton
              loading={savingInfo}
              style={{ background: 'linear-gradient(135deg, #5271ff, #7c5fff)', color: '#fff' }}
            >
              {savingInfo ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </SaveButton>
          </div>
        </form>
      </div>

      {/* ── Section 2 : Changer le mot de passe ── */}
      <div style={CARD}>
        <SectionTitle icon={KeyRound} title="Changer le mot de passe" color="#f59e0b" />

        <form onSubmit={handleChangeMdp} className="space-y-4">
          <div>
            <FieldLabel>Ancien mot de passe</FieldLabel>
            <PasswordInput
              value={ancienMdp}
              onChange={setAncienMdp}
              placeholder="••••••••"
              show={showAncien}
              onToggle={() => setShowAncien(v => !v)}
            />
          </div>
          <div>
            <FieldLabel>Nouveau mot de passe</FieldLabel>
            <PasswordInput
              value={nouveauMdp}
              onChange={setNouveauMdp}
              placeholder="Minimum 8 caractères"
              show={showNouveau}
              onToggle={() => setShowNouveau(v => !v)}
            />
          </div>
          <div>
            <FieldLabel>Confirmer le mot de passe</FieldLabel>
            <PasswordInput
              value={confirmerMdp}
              onChange={setConfirmerMdp}
              placeholder="••••••••"
              show={showConfirmer}
              onToggle={() => setShowConfirmer(v => !v)}
            />
          </div>

          {mdpError && (
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
            >
              <span className="shrink-0 font-bold">✕</span>
              {mdpError}
            </div>
          )}

          <div className="pt-1">
            <SaveButton
              loading={savingMdp}
              disabled={!ancienMdp || !nouveauMdp || !confirmerMdp}
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
              }}
            >
              {savingMdp ? 'Modification…' : 'Changer le mot de passe'}
            </SaveButton>
          </div>
        </form>
      </div>

      {/* ── Section 3 : Informations du compte ── */}
      <div style={CARD}>
        <SectionTitle icon={Hash} title="Informations du compte" color="#34d399" />

        <div className="space-y-0">
          {/* ID copiable */}
          <div
            className="flex items-center gap-3 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Hash className="h-4 w-4 shrink-0" style={{ color: '#334155' }} />
            <span className="text-sm" style={{ color: '#64748b' }}>ID utilisateur</span>
            <div className="ml-auto flex items-center gap-2">
              <span
                className="rounded-lg px-2 py-0.5 text-xs font-mono tabular-nums"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#64748b',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {profilData.id.length > 12
                  ? `${profilData.id.slice(0, 8)}…${profilData.id.slice(-4)}`
                  : profilData.id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title={copied ? 'Copié !' : "Copier l'ID complet"}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150"
                style={{
                  background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
                  border: copied ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={e => {
                  if (!copied) {
                    e.currentTarget.style.background = 'rgba(82,113,255,0.12)'
                    e.currentTarget.style.borderColor = 'rgba(82,113,255,0.3)'
                  }
                }}
                onMouseLeave={e => {
                  if (!copied) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }
                }}
              >
                {copied
                  ? <Check className="h-3.5 w-3.5" style={{ color: '#34d399' }} />
                  : <Copy className="h-3.5 w-3.5" style={{ color: '#475569' }} />
                }
              </button>
            </div>
          </div>

          {/* Organisation */}
          <div
            className="flex items-center gap-3 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Building2 className="h-4 w-4 shrink-0" style={{ color: '#334155' }} />
            <span className="text-sm" style={{ color: '#64748b' }}>Organisation</span>
            <span className="ml-auto text-sm font-medium" style={{ color: '#cbd5e1' }}>
              {profilData.organisationId ?? '—'}
            </span>
          </div>

          {/* Membre depuis */}
          <div className="flex items-center gap-3 py-3.5">
            <Calendar className="h-4 w-4 shrink-0" style={{ color: '#334155' }} />
            <span className="text-sm" style={{ color: '#64748b' }}>Membre depuis</span>
            <span className="ml-auto text-sm font-medium" style={{ color: '#cbd5e1' }}>
              {formatDate(profilData.creeLe)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
