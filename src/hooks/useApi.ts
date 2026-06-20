'use client'
import { useState, useEffect, useCallback, useRef, startTransition } from 'react'

export function useApi<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchFnRef = useRef(fetchFn)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    fetchFnRef.current = fetchFn
  })

  useEffect(() => {
    let cancelled = false
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    fetchFnRef.current()
      .then((result) => {
        if (!cancelled) startTransition(() => { setData(result); setLoading(false) })
      })
      .catch((err: unknown) => {
        if (!cancelled) startTransition(() => {
          setError(err instanceof Error ? err.message : 'Erreur inconnue')
          setLoading(false)
        })
      })
    return () => { cancelled = true }
  }, [tick])

  const refetch = useCallback(() => startTransition(() => setTick((t) => t + 1)), [])

  return { data, loading, error, refetch }
}
