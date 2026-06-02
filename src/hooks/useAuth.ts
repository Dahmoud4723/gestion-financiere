'use client'
import { useState, useEffect } from 'react'
import type { Utilisateur } from '@/types'

export function useAuth() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('utilisateur')
      if (stored) setUtilisateur(JSON.parse(stored))
    } catch {
      // ignore
    }
    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('utilisateur')
    window.location.href = '/login'
  }

  return { utilisateur, loading, logout }
}
