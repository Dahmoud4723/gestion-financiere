"use client"
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { translations, type Locale } from '@/i18n'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, ...args: number[]) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'fr'
    const saved = localStorage.getItem('locale') as Locale | null
    return saved === 'ar' || saved === 'fr' ? saved : 'fr'
  })

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem('locale', next)
    setLocaleState(next)
  }, [])

  const t = useCallback((key: string, ...args: number[]): string => {
    const entry = translations[locale][key]
    if (entry === undefined) return key
    if (typeof entry === 'function') return (entry as (...a: number[]) => string)(...args)
    return entry as string
  }, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used inside LanguageProvider')
  return ctx
}
