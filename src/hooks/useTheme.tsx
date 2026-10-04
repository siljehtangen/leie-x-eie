import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { applyThemeVars, paletteFor, type Palette, type Theme } from '../constants/theme'
import { initialTheme, loadStoredTheme, storeTheme } from '../utils/themeStorage'

interface ThemeContextValue {
  theme: Theme
  colors: Palette
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  colors: paletteFor('light'),
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => initialTheme())

  useEffect(() => {
    applyThemeVars(theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const onChange = (e: MediaQueryListEvent) => {
      if (!loadStoredTheme()) setTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    storeTheme(next)
    setTheme(next)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, colors: paletteFor(theme), toggleTheme }}>{children}</ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
