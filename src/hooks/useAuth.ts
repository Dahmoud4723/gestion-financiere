'use client'
import { useState } from 'react'
import type { Utilisateur } from '@/types'

function readUtilisateur(): Utilisateur | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('utilisateur')
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

export function useAuth() {
  const [utilisateur] = useState<Utilisateur | null>(readUtilisateur)

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('utilisateur')
    window.location.href = '/login'
  }

  return { utilisateur, logout }
}
