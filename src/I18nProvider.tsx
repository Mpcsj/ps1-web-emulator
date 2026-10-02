import { useEffect, useState, type ReactNode } from 'react'
import { I18nContext, LOCALE, STRINGS, type Lang } from './i18n'

const STORAGE_KEY = 'ps1-web-player:lang'

// Saved choice first, then the browser language.
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'pt') return saved
  } catch { /* storage unavailable */ }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)
  useEffect(() => {
    document.documentElement.lang = LOCALE[lang]
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
  }, [lang])
  return <I18nContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>{children}</I18nContext.Provider>
}
